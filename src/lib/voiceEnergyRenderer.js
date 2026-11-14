// Procedural rotating abstract energy sphere. No downloads, textures, or API calls.
const quadVS = 'attribute vec2 p; void main(){gl_Position=vec4(p,0.,1.);}';
// Transparent light core, not a textured planet: rotating shells of emissive points.
const plasmaFS=[
'precision mediump float;',
'uniform vec2 res; uniform float time,energy,thinking;',
'void main(){',
'vec2 uv=(gl_FragCoord.xy-.5*res)/(.5*min(res.x,res.y));uv.y-=.045;',
'float r=length(uv),e=energy,rad=.63+e*.075;',
'vec3 col=vec3(.004,.009,.022);',
'float haze=exp(-r*r*1.6);col+=vec3(.012,.025,.072)*haze;',
'float rim=exp(-pow((r-rad)*21.,2.));',
'float core=exp(-pow(r/(.10+e*.035),2.));',
'float aura=exp(-pow(r/(.36+e*.10),2.));',
'col+=vec3(.024,.10,.28)*aura+vec3(.06,.22,.49)*rim*(.18+.35*e);',
'col+=vec3(.14,.53,1.0)*core*(.45+.55*e);',
'col*=1.+thinking*.16;col=1.-exp(-col*1.6);gl_FragColor=vec4(col,1.);}',
].join('\n');
const debrisVS=[
'precision highp float; attribute vec4 data; attribute vec2 extra; uniform vec2 res; uniform float time,energy,scale; varying mediump float light,kind,spin,seed;',
'void main(){float h=data.y,rr=data.z,s=sqrt(max(0.,1.-h*h));float az=data.x+time*(.34+.09*extra.x);',
'vec3 p=vec3(cos(az)*s,h,sin(az)*s)*rr;',
'float a=.38,b=.21*sin(time*.20);p.yz=mat2(cos(a),-sin(a),sin(a),cos(a))*p.yz;p.xy=mat2(cos(b),-sin(b),sin(b),cos(b))*p.xy;',
'p*=1.+energy*(.09+.045*sin(az*4.+time*5.+extra.y*6.28));',
'float perspective=1./(1.-.20*p.z);vec2 pos=p.xy*perspective;pos.x*=min(res.x,res.y)/res.x;pos.y*=min(res.x,res.y)/res.y;pos.y+=.045;',
'gl_Position=vec4(pos,0.,1.);kind=data.w;seed=extra.y;light=clamp(.49+p.z*.70,.13,1.);spin=az;',
'gl_PointSize=clamp((kind>.5?2.8+extra.x*4.2:1.4+extra.x*2.8)*scale*perspective*(1.+energy*.45),1.,15.);}'
].join('\n');
const debrisFS=[
'precision mediump float; varying mediump float light,kind,spin,seed;',
'void main(){vec2 p=gl_PointCoord*2.-1.;float d=length(p);float halo=exp(-d*d*3.8);float hot=exp(-d*d*18.);',
'vec3 cold=mix(vec3(.055,.25,.86),vec3(.08,.83,1.),seed);vec3 col=cold*halo+vec3(.48,.80,1.)*hot;',
'float alpha=(halo*.45+hot*.55)*light*(kind>.5 ? .7 : 1.);gl_FragColor=vec4(col,alpha);}'
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
  const records=Array.from({length:2600},(_,i)=>{const outer=i>=2280,inner=i<400;const h=1-2*((i+.5)/2600),az=i*2.39996323,r=outer ? .70+rnd(i*6+2)*.12:inner ? .12+rnd(i*6+2)*.36:.53+rnd(i*6+2)*.12;return [az,h,r,outer?1:0,rnd(i*6+3),rnd(i*6+4)];});
  points=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,points);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(records.flat()),gl.STATIC_DRAW);
  const locations=(p,names)=>Object.fromEntries(names.map(n=>[n,gl.getUniformLocation(p,n)]));const pu=locations(plasma,['res','time','energy','thinking']),du=locations(debris,['res','time','energy','scale']);
  const qa=gl.getAttribLocation(plasma,'p'),da=gl.getAttribLocation(debris,'data'),ea=gl.getAttribLocation(debris,'extra');
  let w=0,h=0,scale=1;
  return {resize(cssW,cssH){const d=Math.min(window.devicePixelRatio||1,1.5,Math.sqrt(620000/Math.max(1,cssW*cssH)));const nw=Math.max(1,Math.round(cssW*d)),nh=Math.max(1,Math.round(cssH*d));if(nw!==w||nh!==h){w=nw;h=nh;canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h);}scale=d;},
   draw(t,e,busy){if(gl.isContextLost())return false;gl.disable(gl.BLEND);gl.useProgram(plasma);gl.uniform2f(pu.res,w,h);gl.uniform1f(pu.time,t);gl.uniform1f(pu.energy,e);gl.uniform1f(pu.thinking,busy?1:0);gl.bindBuffer(gl.ARRAY_BUFFER,quad);gl.enableVertexAttribArray(qa);gl.vertexAttribPointer(qa,2,gl.FLOAT,false,0,0);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);gl.disableVertexAttribArray(qa);
    gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE);gl.useProgram(debris);gl.uniform2f(du.res,w,h);gl.uniform1f(du.time,t);gl.uniform1f(du.energy,e);gl.uniform1f(du.scale,scale);gl.bindBuffer(gl.ARRAY_BUFFER,points);gl.enableVertexAttribArray(da);gl.enableVertexAttribArray(ea);gl.vertexAttribPointer(da,4,gl.FLOAT,false,24,0);gl.vertexAttribPointer(ea,2,gl.FLOAT,false,24,16);gl.drawArrays(gl.POINTS,0,records.length);gl.disableVertexAttribArray(da);gl.disableVertexAttribArray(ea);return true;},
   dispose(){gl.deleteBuffer(quad);gl.deleteBuffer(points);gl.deleteProgram(plasma);gl.deleteProgram(debris);}
  };
 }catch(err){if(quad)gl.deleteBuffer(quad);if(points)gl.deleteBuffer(points);if(plasma)gl.deleteProgram(plasma);if(debris)gl.deleteProgram(debris);return null;}
}
