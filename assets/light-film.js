/* Ray-traced hollow soap bubble with an interactive local surface probe.
   Reflection colours come from a spectral interference lookup, shared with the explanation. */
window.PokettoFilm = class {
  constructor(canvas, pixels, onAngle, onFailure) {
    this.canvas=canvas;this.onAngle=onAngle;this.yaw=0;this.pitch=0;this.selected=[0,0];
    const gl=canvas.getContext('webgl',{alpha:false,antialias:false});
    if(!gl)throw new Error('WebGL unavailable');
    this.gl=gl;
    const vertex='attribute vec2 p;varying vec2 uv;void main(){uv=p;gl_Position=vec4(p,0.,1.);}';
    const fragment=`precision highp float;
varying vec2 uv;uniform vec2 resolution;uniform float yaw,pitch,thickness;uniform vec3 probe;uniform sampler2D colours;
vec3 environment(vec3 d){
 vec3 c=mix(vec3(.025,.04,.065),vec3(.08,.11,.15),clamp(d.y*.5+.5,0.,1.));
 float window=exp(-pow((d.x+.48)/.16,8.)-pow((d.y-.42)/.24,8.))*smoothstep(-.1,.5,d.z);
 float strip=exp(-pow((d.x-.7)/.04,2.)-pow((d.y-.15)/.6,4.))*smoothstep(-.2,.5,d.z);
 return c+vec3(.9,.94,1.)*window+vec3(.42,.65,.8)*strip;
}
vec3 filmColour(vec3 n,vec3 ray){
 float variation=-n.y*.35+.06*sin(n.x*8.+n.y*5.)*sin(n.z*6.+n.y*3.);
 float d=max(0.,thickness*(1.+variation));
 float incidence=acos(clamp(abs(dot(-ray,n)),0.,1.))/1.5707963;
 return texture2D(colours,vec2(clamp(d/1800.,0.,1.)*(255./256.)+.5/256.,clamp(incidence,0.,1.)*(63./64.)+.5/64.)).rgb;
}
void main(){
 vec3 eye=3.3*vec3(sin(yaw)*cos(pitch),sin(pitch),cos(yaw)*cos(pitch));
 vec3 forward=normalize(-eye),right=normalize(cross(forward,vec3(0,1,0))),up=cross(right,forward);
 vec3 ray=normalize(forward+(uv.x*resolution.x/resolution.y*right+uv.y*up)*.44);
 vec3 color=mix(vec3(.025,.04,.06),vec3(.09,.12,.17),.5+.5*uv.y);
 float b=dot(eye,ray),disc=b*b-dot(eye,eye)+1.;
 if(disc>0.){
  float t=-b-sqrt(disc);vec3 n=normalize(eye+ray*t);
  vec3 front=filmColour(n,ray);
  vec3 backNormal=normalize(eye+ray*(-b+sqrt(disc)));
  vec3 back=filmColour(backNormal,-ray);
  float fresnel=pow(1.-max(dot(-ray,n),0.),3.);
  vec3 reflected=environment(reflect(ray,n));
  float visibility=max(front.r,max(front.g,front.b));
  // Front and back walls contribute separately; the interference lookup describes
  // the two interfaces within each local wall, not the hollow bubble diameter.
  color=color*.62+front*(.13+.50*fresnel)+back*.055;
  color+=reflected*(.65+.40*fresnel)*visibility;
  float rim=pow(1.-max(dot(-ray,n),0.),8.);
  color+=vec3(.42,.65,.70)*rim*visibility*.65;
  float mark=acos(clamp(dot(n,probe),-1.,1.));
  float ring=1.-smoothstep(.007,.012,abs(mark-.045));
  float centre=1.-smoothstep(.006,.012,mark);
  color=mix(color,vec3(.94,.97,.81),max(ring,centre));
 }
 gl_FragColor=vec4(clamp(color,0.,1.),1.);
}`;
    const compile=(type,src)=>{const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;};
    this.program=gl.createProgram();gl.attachShader(this.program,compile(gl.VERTEX_SHADER,vertex));gl.attachShader(this.program,compile(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(this.program);
    if(!gl.getProgramParameter(this.program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(this.program));
    gl.useProgram(this.program);
    const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
    const loc=gl.getAttribLocation(this.program,'p');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
    const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,256,64,0,gl.RGB,gl.UNSIGNED_BYTE,pixels);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    this.uniforms=Object.fromEntries(['resolution','yaw','pitch','thickness','probe'].map(k=>[k,gl.getUniformLocation(this.program,k)]));
    let drag=null;
    canvas.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY,moved:false};canvas.setPointerCapture(e.pointerId);canvas.classList.add('dragging');});
    canvas.addEventListener('pointermove',e=>{if(!drag)return;if(Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>5)drag.moved=true;if(drag.moved){this.orbit(-(e.clientX-drag.lastX)*.008,(e.clientY-drag.lastY)*.006);this.onAngle()}drag.lastX=e.clientX;drag.lastY=e.clientY;});
    canvas.addEventListener('pointerup',e=>{if(drag&&!drag.moved){const r=canvas.getBoundingClientRect(),old=this.selected;this.selected=[2*(e.clientX-r.left)/r.width-1,1-2*(e.clientY-r.top)/r.height];if(!this.sample(350))this.selected=old;this.onAngle()}drag=null;canvas.classList.remove('dragging');});
    canvas.addEventListener('pointercancel',()=>{drag=null;canvas.classList.remove('dragging');});
    canvas.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();this.orbit(e.key==='ArrowLeft'?-.12:e.key==='ArrowRight'?.12:0,e.key==='ArrowUp'?.08:e.key==='ArrowDown'?-.08:0);this.onAngle();});
    canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();onFailure();});
  }
  orbit(yawStep,pitchStep){
    const anchor=this.sample(350)?.normal;
    this.yaw+=yawStep;this.pitch=Math.max(-1.1,Math.min(1.1,this.pitch+pitchStep));
    if(!anchor){this.selected=[0,0];return;}
    const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0),norm=v=>{const l=Math.hypot(...v);return v.map(x=>x/l)},cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
    const eye=[3.3*Math.sin(this.yaw)*Math.cos(this.pitch),3.3*Math.sin(this.pitch),3.3*Math.cos(this.yaw)*Math.cos(this.pitch)],v=anchor.map((x,i)=>x-eye[i]);
    if(dot(anchor,v)>=-.04){this.selected=[0,0];return;}
    const forward=norm(eye.map(x=>-x)),right=norm(cross(forward,[0,1,0])),up=cross(right,forward),z=dot(v,forward),r=this.canvas.getBoundingClientRect();
    this.selected=[dot(v,right)/(.44*z*(r.width/r.height||1)),dot(v,up)/(.44*z)];
  }
  reset(){this.yaw=0;this.pitch=0;this.selected=[0,0];}
  setProbeAngle(degrees,upper=false){
    const r=this.canvas.getBoundingClientRect(),alpha=Math.asin(Math.sin(degrees*Math.PI/180)/3.3),v=Math.tan(alpha)/.44;
    this.selected=upper?[0,v]:[v/(r.width/r.height||1),0];
  }
  sample(thickness){
    const norm=v=>{const l=Math.hypot(...v);return v.map(x=>x/l)},dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
    const eye=[3.3*Math.sin(this.yaw)*Math.cos(this.pitch),3.3*Math.sin(this.pitch),3.3*Math.cos(this.yaw)*Math.cos(this.pitch)];
    const forward=norm(eye.map(x=>-x)),right=norm(cross(forward,[0,1,0])),up=cross(right,forward),r=this.canvas.getBoundingClientRect();
    const ray=norm(forward.map((x,i)=>x+.44*(this.selected[0]*(r.width/r.height||1)*right[i]+this.selected[1]*up[i])));
    const b=dot(eye,ray),disc=b*b-dot(eye,eye)+1;if(disc<=0)return null;
    const t=-b-Math.sqrt(disc),n=norm(eye.map((x,i)=>x+ray[i]*t));
    const angle=Math.acos(Math.max(0,Math.min(1,-dot(ray,n))))*180/Math.PI;
    const factor=1-n[1]*.35+.06*Math.sin(n[0]*8+n[1]*5)*Math.sin(n[2]*6+n[1]*3);
    return {normal:n,angle,thick:Math.max(0,thickness*factor)};
  }
  draw(thickness){
    const c=this.canvas,gl=this.gl,r=c.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,1.5),w=Math.round(r.width*d),h=Math.round(r.height*d);if(!w||!h)return;
    if(c.width!==w||c.height!==h){c.width=w;c.height=h;}
    let point=this.sample(thickness);if(!point){this.selected=[0,0];point=this.sample(thickness)}
    gl.viewport(0,0,w,h);gl.useProgram(this.program);gl.uniform2f(this.uniforms.resolution,w,h);gl.uniform1f(this.uniforms.yaw,this.yaw);gl.uniform1f(this.uniforms.pitch,this.pitch);gl.uniform1f(this.uniforms.thickness,thickness);gl.uniform3f(this.uniforms.probe,...point.normal);gl.drawArrays(gl.TRIANGLES,0,6);
  }
};
