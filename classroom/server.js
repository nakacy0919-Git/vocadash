import { createServer } from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { randomBytes, randomUUID, scryptSync, timingSafeEqual, createHash } from 'node:crypto';
import { readFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { summarize, growth, csv, MODEL, classSummary } from './analytics.js';
import {CATALOG,normalizeWords,sourcePath} from '../src/lib/learning.js';
import {categoryUnit} from '../src/lib/category.js';
const unitCache=new Map();
function vocabulary(course,unit){
 const key=course+':'+unit;if(unitCache.has(key))return unitCache.get(key);
 if(!CATALOG.find(c=>c.id===course)?.units.some(u=>u.id===unit))fail(400,'教材が無効です');
 let raw=categoryUnit(course,unit);
 if(!raw){try{raw=JSON.parse(readFileSync(new URL('../src/'+sourcePath(course,unit).slice(2),import.meta.url),'utf8'));}catch{fail(400,'この教材はまだ配信できません');}}
 const words=normalizeWords(raw,course,unit);unitCache.set(key,words);return words;
}
const digest=s=>createHash('sha256').update(s).digest('hex');
const secret=()=>randomBytes(24).toString('base64url');
const fail=(status,message)=>{throw Object.assign(new Error(message),{status});};
function text(value,max=100){if(typeof value!=='string'||!value.trim()||value.length>max)fail(400,'入力を確認してください');return value.trim();}
function integer(value,min,max){if(!Number.isSafeInteger(value)||value<min||value>max)fail(400,'数値が範囲外です');return value;}
function password(value){if(typeof value!=='string'||value.length<12||value.length>128)fail(400,'パスワードは12〜128文字です');return value;}
function hashPassword(p,salt=secret()){return salt+':'+scryptSync(p,salt,64).toString('hex');}
function checkPassword(p,stored){const [salt,h]=stored.split(':');return timingSafeEqual(Buffer.from(h,'hex'),scryptSync(p,salt,64));}
export function createClassroom({filename=':memory:',origin='http://localhost:5173',teacherKey='',secure=false}={}) {
 if(filename!==':memory:')mkdirSync(dirname(resolve(filename)),{recursive:true,mode:0o700});
 const db=new DatabaseSync(filename);db.exec(readFileSync(new URL('./schema.sql',import.meta.url),'utf8'));
 const q=(sql,...args)=>db.prepare(sql).all(...args), one=(sql,...args)=>db.prepare(sql).get(...args), run=(sql,...args)=>db.prepare(sql).run(...args);
 const rates=new Map();
 function access(user,id,teacher=false){const c=one('SELECT * FROM classes WHERE id=?',id);if(!c|| (c.teacher_id!==user.id && (teacher||!one('SELECT 1 FROM members WHERE class_id=? AND user_id=?',id,user.id))))fail(403,'このクラスにはアクセスできません');return c;}
 function dashboard(user,id){const c=access(user,id);const assignments=q('SELECT * FROM assignments WHERE class_id=? ORDER BY created DESC',id);const all=q('SELECT a.* FROM attempts a JOIN assignments s ON s.id=a.assignment_id JOIN members m ON m.class_id=s.class_id AND m.user_id=a.user_id WHERE s.class_id=? ORDER BY a.created,a.id',id);const members=c.teacher_id===user.id?q('SELECT u.id,u.name FROM users u JOIN members m ON u.id=m.user_id WHERE m.class_id=? ORDER BY u.name',id):[{id:user.id,name:user.name}];const visible= c.teacher_id===user.id?all:all.filter(a=>a.user_id===user.id);return {class:{id:c.id,name:c.name,timezone:c.timezone,...(c.teacher_id===user.id?{invite:c.invite,expires:c.expires}:{})},model:MODEL,rows:members.map(m=>{const attempts=visible.filter(a=>a.user_id===m.id);return {...m,...summarize(attempts),growth:growth(attempts,c.timezone),assignments:assignments.map(s=>({id:s.id,...summarize(attempts.filter(a=>a.assignment_id===s.id))}))};}),summary:classSummary(visible),growth:growth(visible.map(a=>({...a,word:a.user_id+':'+a.word})),c.timezone),assignments,events:q('SELECT * FROM events WHERE class_id=? ORDER BY starts DESC LIMIT 20',id).map(e=>({...e,progress:new Set(visible.filter(a=>a.created>=e.starts&&a.created<=e.ends&&a.correct).map(a=>a.user_id+':'+a.word)).size}))};}
 const server=createServer(async(req,res)=>{
  const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'};
  const send=(status,data,extra={})=>{res.writeHead(status,{...headers,...extra});res.end(typeof data==='string'?data:JSON.stringify(data));};
  try {
   const url=new URL(req.url,origin),p=url.pathname;
   if(!p.startsWith('/api/classroom/'))fail(404,'Not found');
   if(req.method!=='GET'&&req.headers.origin!==origin)fail(403,'Origin rejected');
   const rateKey=req.socket.remoteAddress+':'+(p.includes('/auth/')?'auth':digest(req.headers.cookie||'anonymous'));const now=Date.now();
   if(rates.size>10000)for(const [k,v]of rates)if(v.until<now)rates.delete(k);
   const rate=rates.get(rateKey)||{count:0,until:now+60000};if(rate.until<now){rate.count=0;rate.until=now+60000;}rate.count++;rates.set(rateKey,rate);if(rate.count>(p.includes('/auth/')?200:240))fail(429,'少し待って再試行してください');
   let body={};if(req.method==='POST'){let raw='';for await(const chunk of req){raw+=chunk;if(Buffer.byteLength(raw)>65536)fail(413,'データが大きすぎます');}try{body=JSON.parse(raw||'{}');}catch{fail(400,'Invalid JSON');}if(!body||typeof body!=='object'||Array.isArray(body))fail(400,'Invalid body');}
   const token=(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith('vd_session='))?.slice(11)||'';
   const user=one('SELECT u.id,u.name,u.role,u.login FROM users u JOIN sessions s ON s.user_id=u.id WHERE s.token=? AND s.expires>?',digest(token),now);
   const cookie=(value,age)=>`vd_session=${value}; HttpOnly; SameSite=Strict; Path=/api/classroom; Max-Age=${age}${secure?'; Secure':''}`;
   if(p==='/api/classroom/auth/register'||p==='/api/classroom/auth/login'){
    const login=text(body.login,80).toLowerCase(), pass=password(body.password);
    const loginKey='login:'+digest(login), loginRate=rates.get(loginKey)||{count:0,until:now+60000};if(loginRate.until<now){loginRate.count=0;loginRate.until=now+60000;}loginRate.count++;rates.set(loginKey,loginRate);if(loginRate.count>10)fail(429,'少し待って再試行してください');
    if(!/^[a-z0-9_.@-]{3,80}$/.test(login))fail(400,'ログインIDは英数字3〜80文字です');
    let u=one('SELECT * FROM users WHERE login=?',login);
    if(p.endsWith('register')){const role=body.role==='teacher'?'teacher':'student';if(role==='teacher'&&(!teacherKey||typeof body.teacherKey!=='string'||digest(body.teacherKey)!==digest(teacherKey)))fail(403,'教員登録キーが必要です');if(u)fail(409,'このIDは利用できません');u={id:randomUUID(),login,name:text(body.name,60),role};run('INSERT INTO users VALUES(?,?,?,?,?)',u.id,login,u.name,role,hashPassword(pass));}
    else if(!u||!checkPassword(pass,u.password))fail(401,'IDまたはパスワードを確認してください');
    run('DELETE FROM sessions WHERE expires<?',now);const session=secret();run('INSERT INTO sessions VALUES(?,?,?)',digest(session),u.id,now+8*3600000);return send(200,{id:u.id,name:u.name,role:u.role,login:u.login},{'Set-Cookie':cookie(session,28800)});
   }
   if(!user)fail(401,'ログインしてください');
   if(p==='/api/classroom/auth/me')return send(200,user);
   if(p==='/api/classroom/auth/logout'&&req.method==='POST'){run('DELETE FROM sessions WHERE token=?',digest(token));return send(200,{ok:true},{'Set-Cookie':cookie('',0)});}
   if(p==='/api/classroom/account/export'&&req.method==='GET')return send(200,{profile:user,attempts:q('SELECT * FROM attempts WHERE user_id=? ORDER BY created',user.id)},{'Content-Disposition':'attachment; filename="vocadash-personal-data.json"'});
   if(p==='/api/classroom/account/delete'&&req.method==='POST'){
    const stored=one('SELECT password FROM users WHERE id=?',user.id);if(!checkPassword(password(body.password),stored.password)||body.login!==user.login)fail(403,'IDとパスワードを確認してください');
    db.exec('BEGIN');try{run('DELETE FROM classes WHERE teacher_id=?',user.id);run('DELETE FROM users WHERE id=?',user.id);db.exec('COMMIT');}catch(e){db.exec('ROLLBACK');throw e;}return send(200,{ok:true},{'Set-Cookie':cookie('',0)});
   }
   if(p==='/api/classroom/classes'&&req.method==='GET')return send(200,q('SELECT DISTINCT c.id,c.name,c.timezone FROM classes c LEFT JOIN members m ON m.class_id=c.id WHERE c.teacher_id=? OR m.user_id=?',user.id,user.id));
   if(p==='/api/classroom/classes'&&req.method==='POST'){
    if(user.role!=='teacher')fail(403,'教員専用です');const timezone=text(body.timezone||'Asia/Tokyo',80);try{new Intl.DateTimeFormat('en',{timeZone:timezone});}catch{fail(400,'タイムゾーンが無効です');}const id=randomUUID();run('INSERT INTO classes VALUES(?,?,?,?,?,?)',id,user.id,text(body.name),timezone,secret(),now+7*86400000);return send(201,{id});
   }
   if(p==='/api/classroom/join'&&req.method==='POST'){
    if(user.role!=='student')fail(403,'生徒アカウントで参加してください');const c=one('SELECT * FROM classes WHERE invite=? AND expires>?',text(body.invite),now);if(!c)fail(404,'招待リンクが無効または期限切れです');run('INSERT OR IGNORE INTO members VALUES(?,?)',c.id,user.id);return send(200,{id:c.id});
   }
   const match=p.match(/^\/api\/classroom\/classes\/([^/]+)\/(dashboard|csv|invite|assignments|events|remove)$/);
   if(match){const [,id,action]=match;const c=access(user,id,action!=='dashboard');
    if(req.method==='GET'&&action==='dashboard')return send(200,dashboard(user,id));
    if(req.method==='GET'&&action==='csv')return send(200,csv(dashboard(user,id).rows),{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="vocadash-class.csv"'});
    if(req.method==='POST'&&action==='invite'){run('UPDATE classes SET invite=?,expires=? WHERE id=?',secret(),now+7*86400000,id);return send(200,{ok:true});}
    if(req.method==='POST'&&action==='remove'){run('DELETE FROM members WHERE class_id=? AND user_id=?',id,text(body.userId));return send(200,{ok:true});}
    if(req.method==='POST'&&action==='assignments'){const assignedWords=vocabulary(text(body.course),text(body.unit));integer(body.target,1,assignedWords.length);const aid=randomUUID();run('INSERT INTO assignments VALUES(?,?,?,?,?,?,?,?)',aid,id,text(body.title),text(body.course),text(body.unit),integer(body.target,1,1000),integer(body.due,now,now+366*86400000),now);return send(201,{id:aid});}
    if(req.method==='POST'&&action==='events'){const starts=integer(body.starts,now-60000,now+366*86400000),ends=integer(body.ends,starts+60000,starts+31*86400000);run('INSERT INTO events VALUES(?,?,?,?,?,?)',randomUUID(),c.id,text(body.title),integer(body.goal,1,100000),starts,ends);return send(201,{ok:true});}
   }
   if(p==='/api/classroom/attempts'&&req.method==='POST'){
    if(user.role!=='student')fail(403,'生徒専用です');const a=one('SELECT * FROM assignments WHERE id=?',text(body.assignmentId));if(!a)fail(404,'課題が見つかりません');access(user,a.class_id);
    const items=body.items;if(!Array.isArray(items)||!items.length||items.length>50)fail(400,'1〜50件で送信してください');
    const allowed=new Map(vocabulary(a.course,a.unit).map(w=>[w.id,w]));
    if(items.some(i=>!allowed.has(i.word)))fail(400,'課題に含まれない語彙です');
    const validated=items.map(i=>({id:text(i.id),word:text(i.word,200),label:allowed.get(i.word).word,created:i.created===undefined?now:integer(i.created,now-90*86400000,now+60000),correct:i.correct===true?1:i.correct===false?0:fail(400,'正誤が無効です'),duration:integer(i.duration,0,120000),mode:text(i.mode,40)}));
    db.exec('BEGIN');try{for(const i of validated){const old=one('SELECT user_id,assignment_id FROM attempts WHERE id=?',i.id);if(old&&(old.user_id!==user.id||old.assignment_id!==a.id))fail(409,'記録IDが重複しています');run('INSERT OR IGNORE INTO attempts VALUES(?,?,?,?,?,?,?,?,?)',i.id,user.id,a.id,i.word,i.label,i.correct,i.duration,i.mode,i.created);}db.exec('COMMIT');}catch(e){db.exec('ROLLBACK');throw e;}return send(200,{ok:true,count:validated.length});
   }
   fail(404,'Not found');
  }catch(e){send(e.status||500,{error:e.status?e.message:'サーバーでエラーが発生しました'});}
 });
 return {server,db};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 if(process.env.NODE_ENV==='production'&&(!process.env.CLASSROOM_ORIGIN?.startsWith('https://')||!process.env.CLASSROOM_TEACHER_KEY))throw new Error('HTTPS origin and teacher key required');
 const {server}=createClassroom({filename:process.env.CLASSROOM_DB||'.classroom-data/classroom.sqlite',origin:process.env.CLASSROOM_ORIGIN||'http://localhost:5173',teacherKey:process.env.CLASSROOM_TEACHER_KEY,secure:process.env.NODE_ENV==='production'});
 server.listen(Number(process.env.CLASSROOM_PORT||8787),'127.0.0.1',()=>console.log('Classroom API: http://127.0.0.1:8787'));
}
