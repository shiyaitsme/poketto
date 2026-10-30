/* A small WebGL landscape: perspective camera, directional sky, ray-marched
   terrain and a reflecting lake. Colours are illustrative, not a weather model. */
window.PokettoSky = class {
  constructor(canvas, onChange, onFailure) {
    this.canvas = canvas; this.onChange = onChange; this.onFailure = onFailure;
    this.yaw = 0; this.pitch = .12;
    const gl = canvas.getContext('webgl', {antialias:false, alpha:false});
    if (!gl) throw new Error('WebGL unavailable');
    this.gl = gl;
    const vertex = 'attribute vec2 position; varying vec2 uv; void main(){uv=position;gl_Position=vec4(position,0.,1.);}';
    const fragment = `
precision highp float;
varying vec2 uv;
uniform vec2 resolution;
uniform float altitude, haze, yaw, pitch;
const float PI=3.14159265;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){return .55*noise(p)+.28*noise(p*2.03)+.12*noise(p*4.07);}
vec3 sunDir(){float a=altitude*PI/180.;return vec3(0.,sin(a),cos(a));}
vec3 sky(vec3 d, bool disc){
  float day=smoothstep(-8.,7.,altitude);
  float dusk=exp(-pow((altitude+1.)/12.,2.));
  float forward=pow(max(0.,dot(normalize(vec3(d.x,0.,d.z)),vec3(0,0,1))),3.);
  float elevation=max(d.y,0.);
  vec3 zenith=mix(vec3(.045,.07,.19),vec3(.12,.36,.67),day);
  vec3 horizon=mix(vec3(.30,.29,.48),vec3(.68,.81,.87),day);
  horizon=mix(horizon,vec3(.98,.48,.24),dusk*(.3+.7*forward));
  vec3 c=mix(horizon,zenith,pow(clamp(elevation*1.5,0.,1.),.48));
  float pink=exp(-pow((elevation-.12)/.11,2.))*dusk;
  c=mix(c,vec3(.77,.40,.53),pink*(.18+.28*forward));
  float glow=pow(max(dot(d,sunDir()),0.),mix(14.,5.,clamp(haze/2.,0.,1.)));
  c+=vec3(1.,.48,.18)*glow*dusk*.16;
  if(d.y>.006){
    vec2 p=d.xz/d.y*.8;
    float n=fbm(p*vec2(.5,1.6));
    float clouds=smoothstep(.49,.69,n)*smoothstep(.005,.09,d.y)*(1.-smoothstep(.55,.9,d.y));
    vec3 cloud=mix(vec3(.28,.29,.43),vec3(.95,.94,.91),day);
    cloud=mix(cloud,vec3(1.,.62,.54),dusk*(.45+.55*forward));
    c=mix(c,cloud,clouds*.74);
  }
  float veil=exp(-elevation*8.)*clamp((haze-.3)/1.7,0.,1.)*.25;
  c=mix(c,horizon,veil);
  if(disc && altitude>-.8){
    float angle=acos(clamp(dot(d,sunDir()),-1.,1.));
    float disk=1.-smoothstep(.017,.019,angle);
    vec3 sunlight=mix(vec3(1.,.36,.12),vec3(1.,.98,.87),smoothstep(0.,20.,altitude));
    c=mix(c,sunlight,disk);
    c+=sunlight*exp(-angle*angle/ .0009)*.17;
  }
  return c;
}
float terrain(vec2 p){
  float farLand=smoothstep(600.,1800.,length(p));
  return -5.+farLand*(18.+95.*fbm(p*.004)+32.*noise(p*.012));
}
void main(){
  float fov=tan(58.*PI/360.);
  vec3 ray=normalize(vec3(uv.x*resolution.x/resolution.y*fov,uv.y*fov,1.));
  ray.yz=mat2(cos(pitch),-sin(pitch),sin(pitch),cos(pitch))*ray.yz;
  ray.xz=mat2(cos(yaw),-sin(yaw),sin(yaw),cos(yaw))*ray.xz;
  vec3 origin=vec3(0.,8.,0.);
  vec3 color=sky(ray,true);
  float travel=8.,hit=-1.;vec3 p;
  for(int i=0;i<80;i++){
    p=origin+ray*travel;
    if(p.y<terrain(p.xz)){hit=travel;break;}
    travel+=max(3.,travel*.085);
    if(travel>6000.)break;
  }
  float waterT=ray.y<-.0001?(-3.-origin.y)/ray.y:100000.;
  if(hit>0. && hit<waterT){
    p=origin+ray*hit;
    float e=2.;
    vec3 normal=normalize(vec3(terrain(p.xz-vec2(e,0))-terrain(p.xz+vec2(e,0)),2.*e,terrain(p.xz-vec2(0,e))-terrain(p.xz+vec2(0,e))));
    float day=smoothstep(-8.,20.,altitude);
    vec3 rock=mix(vec3(.035,.045,.08),vec3(.18,.24,.23),day);
    rock*=.65+.35*max(dot(normal,sunDir()),0.);
    float fog=1.-exp(-hit*(.0003+.0002*haze));
    color=mix(rock,sky(normalize(vec3(ray.x,.025,ray.z)),false),fog*.8);
  }else if(ray.y<0.){
    vec3 p=origin+ray*waterT;
    vec3 reflection=ray;reflection.y=abs(ray.y)+.008*sin(p.x*.09)*sin(p.z*.08);
    color=sky(normalize(reflection),true)*.67;
    color=mix(color,vec3(.05,.11,.17),.16);
    float ripple=(.5+.5*sin(p.z*.45+sin(p.x*.12)*2.));
    color+=vec3(.015,.02,.025)*ripple*exp(-waterT*.001);
  }
  color=pow(max(color,vec3(0.)),vec3(.94));
  gl_FragColor=vec4(color,1.);
}`;
    const compile = (type, source) => {const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(shader));return shader;};
    this.program=gl.createProgram();
    gl.attachShader(this.program,compile(gl.VERTEX_SHADER,vertex));gl.attachShader(this.program,compile(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(this.program);
    if(!gl.getProgramParameter(this.program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(this.program));
    gl.useProgram(this.program);
    const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
    const loc=gl.getAttribLocation(this.program,'position');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
    this.uniforms=Object.fromEntries(['resolution','altitude','haze','yaw','pitch'].map(k=>[k,gl.getUniformLocation(this.program,k)]));
    let drag=null;
    canvas.addEventListener('pointerdown',e=>{drag=[e.clientX,e.clientY];canvas.setPointerCapture(e.pointerId);canvas.classList.add('dragging');});
    canvas.addEventListener('pointermove',e=>{if(!drag)return;this.yaw-=(e.clientX-drag[0])*.004;this.pitch=Math.max(-.18,Math.min(1.35,this.pitch+(e.clientY-drag[1])*.004));drag=[e.clientX,e.clientY];this.onChange();});
    const end=()=>{drag=null;canvas.classList.remove('dragging');};
    canvas.addEventListener('pointerup',end);canvas.addEventListener('pointercancel',end);
    canvas.addEventListener('keydown',e=>{const arrows={ArrowLeft:[-.12,0],ArrowRight:[.12,0],ArrowUp:[0,.08],ArrowDown:[0,-.08]};if(!arrows[e.key])return;e.preventDefault();this.yaw+=arrows[e.key][0];this.pitch=Math.max(-.18,Math.min(1.35,this.pitch+arrows[e.key][1]));this.onChange();});
    canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();this.onFailure();});
  }
  reset(){this.yaw=0;this.pitch=.12;}
  faceSun(alt){this.yaw=0;this.pitch=Math.max(.12,Math.min(1.25,alt*Math.PI/180.));}
  draw(alt,air){
    const gl=this.gl,c=this.canvas,r=c.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,1.5);
    const w=Math.round(r.width*d),h=Math.round(r.height*d);
    if(!w||!h)return;
    if(c.width!==w||c.height!==h){c.width=w;c.height=h;}
    gl.viewport(0,0,w,h);gl.useProgram(this.program);
    gl.uniform2f(this.uniforms.resolution,w,h);
    for(const [k,v] of Object.entries({altitude:alt,haze:air,yaw:this.yaw,pitch:this.pitch}))gl.uniform1f(this.uniforms[k],v);
    gl.drawArrays(gl.TRIANGLES,0,6);
  }
};
