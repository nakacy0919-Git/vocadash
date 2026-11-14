// Procedural cinematic plasma and depth-sorted debris. No downloads, textures, or API calls.
const quadVS = 'attribute vec2 p; void main(){gl_Position=vec4(p,0.,1.);}';
const plasmaFS = [
'precision highp float;',
'uniform vec2 res; uniform float time,energy,thinking;',
'float hash(vec3 p){p=fract(p*.1031);p+=dot(p,p.yzx+33.33);return fract((p.x+p.y)*p.z);}',
'float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}',
'float fbm(vec3 p){float a=.52,s=0.;for(int j=0;j<4;j++){s+=a*noise(p);p=p*2.07+vec3(7.3,4.2,2.8);a*=.49;}return s;}',
'float ring(vec2 p,float r,float tilt){p.y/=tilt;return exp(-abs(length(p)-r)*160.);}',
'vec2 rot(vec2 p,float a){return mat2(cos(a),-sin(a),sin(a),cos(a))*p;}',
'void main(){',
' vec2 uv=(gl_FragCoord.xy-.5*res)/(.5*min(res.x,res.y)); uv.y-=.045;',
' float t=time*.33, e=energy, r=length(uv),rad=.86+e*.105;',
' vec3 col=vec3(.004,.009,.021)+vec3(.008,.029,.078)*exp(-r*r*.75);',
' float haze=fbm(vec3(uv*2.1,t*.22)); col+=vec3(.012,.035,.09)*haze*exp(-r*r*.35);',
' // Holographic perspective lines and orbital geometry.',
' float stripe=pow(max(0.,cos((uv.y+.06*sin(uv.x*1.5))*32.)),48.);',
' col+=vec3(.025,.057,.092)*stripe*(.3+.7*min(1.,abs(uv.x)*.6));',
' float grids=ring(rot(uv,.27),rad*1.18,.73)+ring(rot(uv,-.58),rad*1.38,.43)+ring(rot(uv,.14),rad*.995,.98);',
' col+=vec3(.07,.22,.48)*grids*.22;',
' float d=r/rad; float outside=max(0.,d-1.);',
' float halo=exp(-abs(d-1.)*7.5), farGlow=exp(-r*r*1.5);',
' col+=vec3(.028,.108,.34)*halo*(.55+e*.6)+vec3(.012,.046,.14)*farGlow;',
' if(d<1.36){',
'  float z=sqrt(max(0.,1.-d*d));',
'  vec3 surf=vec3(uv/rad,z);surf.xz=rot(surf.xz,t*.26);surf.yz=rot(surf.yz,.18*sin(t));',
'  vec3 p=surf*4.0+vec3(t*.14,-t*.12,t*.18);',
'  float n=fbm(p+vec3(0.,0.,t*.25));',
'  vec3 q=p+2.6*vec3(n,noise(p+12.7),noise(p-8.2));',
'  float f=fbm(q),fine=fbm(q*2.6+vec3(t*.25));',
'  float ridge=pow(max(0.,1.-abs(f-.53)*7.3),3.);',
'  float fil=pow(max(0.,1.-abs(fine-.51)*10.),4.);',
'  float cloud=smoothstep(.38,.7,f+fine*.17);',
'  float limb=pow(max(0.,1.-z),1.8);',
'  float edgeNoise=fbm(vec3(uv*6.3,t*.5));',
'  float rugged=rad*(1.+.09*(edgeNoise-.4)+e*.035*sin(uv.x*14.+t*9.));',
'  float body=1.-smoothstep(rugged-.04,rugged+.095,r);',
'  float rim=exp(-abs(r-rugged)*17.);',
'  float fronts=pow(max(0.,sin(surf.x*6.+surf.y*4.+f*5.+t*.7)),5.);',
'  vec3 electric=vec3(.035,.18,.58)*cloud+vec3(.055,.37,1.15)*ridge*(.2+.8*cloud);',
'  electric+=vec3(.12,.68,1.35)*fil*(.17+.83*ridge)+vec3(.35,.76,1.15)*fronts*cloud*.6;',
'  electric*=body*(.42+.55*limb+e*.65);',
'  col+=electric+vec3(.10,.40,1.0)*rim*(.24+.8*edgeNoise)*(1.+e);',
'  float plume=pow(max(0.,edgeNoise-.35)*1.5,1.8)*exp(-outside*9.)*smoothstep(.83,1.0,d);',
'  col+=vec3(.065,.27,.75)*plume*(.8+e*.75);',
' }',
' // Filmic mapping preserves an electric blue halo and white-hot details.',
' col*=1.+thinking*.14; col=1.-exp(-col*1.6); col=pow(col,vec3(.88));',
' float vignette=1.-.18*smoothstep(.7,2.3,r);gl_FragColor=vec4(col*vignette,1.);',
'}'
].join('\n');
const debrisVS = [
'precision highp float; attribute vec4 data; attribute vec2 extra; uniform vec2 res; uniform float time,energy,scale; varying float light,kind,spin,seed;',
'void main(){float t=time,az=data.x+t*(.06+extra.x*.12),h=data.y,rr=data.z;float s=sqrt(max(0.,1.-h*h));',
' vec3 p=vec3(cos(az)*s,h,sin(az)*s)*rr;',
' p.y+=sin(t*.75+extra.y*31.)*.035; p*=1.+energy*(.05+.15*extra.x);',
' float tilt=.35; p.yz=mat2(cos(tilt),-sin(tilt),sin(tilt),cos(tilt))*p.yz;',
' float perspective=1./(1.55-.24*p.z);vec2 pos=p.xy*perspective;pos.x*=min(res.x,res.y)/res.x;pos.y*=min(res.x,res.y)/res.y;pos.y+=.045;',
' gl_Position=vec4(pos,0.,1.);kind=data.w;seed=extra.y;light=clamp(.42+.23*p.z,.12,1.);spin=t*(.3+extra.x)+extra.y*19.;',
' gl_PointSize=clamp((kind>.5?6.+extra.x*18.:1.1+extra.x*3.8)*scale*perspective*(1.+energy*.35),1.,42.);}'
].join('\n');
const debrisFS = [
'precision mediump float; varying float light,kind,spin,seed;',
'void main(){vec2 p=gl_PointCoord*2.-1.;float c=cos(spin),s=sin(spin);p=mat2(c,-s,s,c)*p;',
' if(kind<.5){float d=length(p);float a=exp(-d*d*5.5)*light;gl_FragColor=vec4(mix(vec3(.19,.43,.95),vec3(.82,.95,1.),seed),a*.8);}',
' else{float shape=max(abs(p.x)*.91+abs(p.y)*.24,abs(p.y)*1.2+abs(p.x)*.17);if(shape>.85)discard;float facet=step(p.x*.63,p.y);vec3 dark=vec3(.14,.25,.46);vec3 bright=mix(vec3(.48,.73,1.),vec3(1.,.97,.85),step(.72,seed));vec3 col=mix(dark,bright,facet*.65+.25);float edge=1.-smoothstep(.62,.85,shape);gl_FragColor=vec4(col*(.7+light*.6),edge*(.45+light*.55));}}'
].join('\n');
function shader(gl,type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){const msg=gl.getShaderInfoLog(s);gl.deleteShader(s);throw Error(msg||'shader compile');}return s;}
function program(gl,vs,fs){const v=shader(gl,gl.VERTEX_SHADER,vs),f=shader(gl,gl.FRAGMENT_SHADER,fs),p=gl.createProgram();gl.attachShader(p,v);gl.attachShader(p,f);gl.linkProgram(p);gl.deleteShader(v);gl.deleteShader(f);if(!gl.getProgramParameter(p,gl.LINK_STATUS)){gl.deleteProgram(p);throw Error('shader link');}return p;}
export function createEnergyRenderer(canvas){
 const gl=canvas.getContext('webgl',{alpha:false,antialias:false,depth:false,stencil:false,preserveDrawingBuffer:false,powerPreference:'high-performance'});
 if(!gl)return null;
 let plasma,debris,quad,points;
 try{
  plasma=program(gl,quadVS,plasmaFS);debris=program(gl,debrisVS,debrisFS);
  quad=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,quad);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
  const rnd=i=>{const x=Math.sin(i*127.1+3.1)*43758.5453;return x-Math.floor(x);};
  const records=Array.from({length:1550},(_,i)=>{const shard=i>=1400;return [rnd(i*6)*Math.PI*2,rnd(i*6+1)*2-1,shard ? .95+rnd(i*6+2)*2.1:.55+rnd(i*6+2)*3.1,shard?1:0,rnd(i*6+3),rnd(i*6+4)];}).sort((a,b)=>a[2]*Math.sin(a[0])-b[2]*Math.sin(b[0]));
  points=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,points);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(records.flat()),gl.STATIC_DRAW);
  const locations=(p,names)=>Object.fromEntries(names.map(n=>[n,gl.getUniformLocation(p,n)]));const pu=locations(plasma,['res','time','energy','thinking']),du=locations(debris,['res','time','energy','scale']);
  const qa=gl.getAttribLocation(plasma,'p'),da=gl.getAttribLocation(debris,'data'),ea=gl.getAttribLocation(debris,'extra');
  let w=0,h=0,scale=1;
  return {resize(cssW,cssH){const d=Math.min(window.devicePixelRatio||1,1.5,Math.sqrt(620000/Math.max(1,cssW*cssH)));const nw=Math.max(1,Math.round(cssW*d)),nh=Math.max(1,Math.round(cssH*d));if(nw!==w||nh!==h){w=nw;h=nh;canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h);}scale=d;},
   draw(t,e,busy){if(gl.isContextLost())return false;gl.disable(gl.BLEND);gl.useProgram(plasma);gl.uniform2f(pu.res,w,h);gl.uniform1f(pu.time,t);gl.uniform1f(pu.energy,e);gl.uniform1f(pu.thinking,busy?1:0);gl.bindBuffer(gl.ARRAY_BUFFER,quad);gl.enableVertexAttribArray(qa);gl.vertexAttribPointer(qa,2,gl.FLOAT,false,0,0);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);gl.disableVertexAttribArray(qa);
    gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.useProgram(debris);gl.uniform2f(du.res,w,h);gl.uniform1f(du.time,t);gl.uniform1f(du.energy,e);gl.uniform1f(du.scale,scale);gl.bindBuffer(gl.ARRAY_BUFFER,points);gl.enableVertexAttribArray(da);gl.enableVertexAttribArray(ea);gl.vertexAttribPointer(da,4,gl.FLOAT,false,24,0);gl.vertexAttribPointer(ea,2,gl.FLOAT,false,24,16);gl.drawArrays(gl.POINTS,0,records.length);gl.disableVertexAttribArray(da);gl.disableVertexAttribArray(ea);return true;},
   dispose(){gl.deleteBuffer(quad);gl.deleteBuffer(points);gl.deleteProgram(plasma);gl.deleteProgram(debris);}
  };
 }catch(err){if(quad)gl.deleteBuffer(quad);if(points)gl.deleteBuffer(points);if(plasma)gl.deleteProgram(plasma);if(debris)gl.deleteProgram(debris);return null;}
}
