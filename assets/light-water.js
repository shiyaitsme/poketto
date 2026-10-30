/* 2D water height field -> vector Snell refraction -> photon density on a 3D floor.
   All visible rays and the caustic texture use the same surface and mapping. */
window.PokettoWater = class {
  static waves=[[.075,3.5,1.2,1],[.05,-1.6,4.8,-1.3],[.035,5.7,-3.4,.7]];
  static surface(x,z,wave,time){
    let h=0,dx=0,dz=0;
    for(const [a,kx,kz,kt] of this.waves){const phase=kx*x+kz*z+kt*time;h+=a*Math.sin(phase);dx+=a*kx*Math.cos(phase);dz+=a*kz*Math.cos(phase)}
    return {h:h*wave,dx:dx*wave,dz:dz*wave};
  }
  static trace(x,z,wave,depth,time){
    const s=this.surface(x,z,wave,time),length=Math.hypot(s.dx,1,s.dz),n=[-s.dx/length,1/length,-s.dz/length],eta=1/1.333;
    const k=eta*n[1]-Math.sqrt(1-eta*eta*(1-n[1]*n[1]));
    const dir=[k*n[0],-eta+k*n[1],k*n[2]],t=(depth+s.h)/-dir[1];
    return {start:[x,s.h,z],end:[x+dir[0]*t,-depth,z+dir[2]*t],normal:n,dir};
  }
  static density(wave,depth,time,size=128,count=256){
    const bins=new Float32Array(size*size);
    if(wave===0){bins.fill(1);return bins;}
    const step=6.4/count,scale=size/5;
    for(let j=0;j<count;j++)for(let i=0;i<count;i++){
      const ray=this.trace(-3.2+(i+.5)*step,-3.2+(j+.5)*step,wave,depth,time);
      const u=(ray.end[0]+2.5)*scale-.5,v=(ray.end[2]+2.5)*scale-.5,x=Math.floor(u),y=Math.floor(v),fx=u-x,fy=v-y;
      for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++){const xx=x+dx,yy=y+dy;if(xx>=0&&xx<size&&yy>=0&&yy<size)bins[yy*size+xx]+=(dx?fx:1-fx)*(dy?fy:1-fy);}
    }
    const expected=Math.pow(5/size/step,2);for(let i=0;i<bins.length;i++)bins[i]/=expected;
    return bins;
  }
  constructor(canvas,onChange,onFailure){
    this.canvas=canvas;this.onChange=onChange;this.yaw=.65;this.elevation=.66;this.mode='pool';this.time=0;this.key='';
    const gl=canvas.getContext('webgl',{alpha:false,antialias:true});if(!gl)throw new Error('WebGL unavailable');this.gl=gl;
    const vertex=`precision highp float;attribute vec3 position;uniform vec3 eye,right,up,forward;uniform vec2 resolution;uniform float depth,wave,time,layer;varying vec3 world;varying vec3 normal;
void main(){vec3 p=position;normal=vec3(0,1,0);
 if(layer==1.){
 float a=3.5*p.x+1.2*p.z+time,b=-1.6*p.x+4.8*p.z-1.3*time,c=5.7*p.x-3.4*p.z+.7*time;
 p.y=wave*(.075*sin(a)+.05*sin(b)+.035*sin(c));
 normal=normalize(vec3(-wave*(.075*3.5*cos(a)-.05*1.6*cos(b)+.035*5.7*cos(c)),1.,-wave*(.075*1.2*cos(a)+.05*4.8*cos(b)-.035*3.4*cos(c))));
 }else if(layer==0.)p.y=-depth;
 else if(layer==2.)p.y*=depth;
 world=p;vec3 v=p-eye;float z=dot(v,forward);gl_Position=vec4(dot(v,right)/(.48*resolution.x/resolution.y),dot(v,up)/.48,1.002002*z-.2002,z);}`;
    const fragment=`precision highp float;varying vec3 world,normal;uniform sampler2D caustic;uniform vec3 eye;uniform float layer;
void main(){
 if(layer==3.){gl_FragColor=vec4(1.,.88,.40,.68);return;}
 if(layer==4.){gl_FragColor=vec4(1.,.97,.65,1.);return;}
 if(layer==5.){gl_FragColor=vec4(.56,.83,.82,.65);return;}
 if(layer==2.){gl_FragColor=vec4(.16,.43,.46,.14);return;}
 if(layer==1.){vec3 n=normalize(normal),v=normalize(eye-world);float fresnel=pow(1.-max(dot(n,v),0.),3.);float shine=pow(max(dot(reflect(-normalize(vec3(-.5,1.,.3)),n),v),0.),30.);gl_FragColor=vec4(vec3(.20,.64,.69)+shine*.4,.12+fresnel*.22);return;}
 float intensity=texture2D(caustic,(world.xz+2.5)/5.).r*8.;
 vec2 tile=abs(fract((world.xz+2.5)*2.)-.5);float seam=smoothstep(.465,.49,max(tile.x,tile.y));
 vec3 base=mix(vec3(.10,.34,.39),vec3(.055,.20,.24),seam);
 vec3 color=base*(.32+.75*min(intensity,2.5))+vec3(.52,.72,.66)*max(intensity-1.35,0.)*.42;
 gl_FragColor=vec4(color,1.);
}`;
    const compile=(type,src)=>{const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;};
    this.program=gl.createProgram();gl.attachShader(this.program,compile(gl.VERTEX_SHADER,vertex));gl.attachShader(this.program,compile(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(this.program);if(!gl.getProgramParameter(this.program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(this.program));gl.useProgram(this.program);
    this.position=gl.getAttribLocation(this.program,'position');this.uniforms=Object.fromEntries(['eye','right','up','forward','resolution','depth','wave','time','layer'].map(k=>[k,gl.getUniformLocation(this.program,k)]));
    const makeBuffer=vertices=>{const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.STATIC_DRAW);return {buffer:b,count:vertices.length/3}};
    const quad=(x0,z0,x1,z1)=>[x0,0,z0,x1,0,z0,x0,0,z1,x0,0,z1,x1,0,z0,x1,0,z1];
    this.floor=makeBuffer(quad(-2.5,-2.5,2.5,2.5));
    const mesh=[];for(let z=0;z<60;z++)for(let x=0;x<60;x++)mesh.push(...quad(-2.5+x/12,-2.5+z/12,-2.5+(x+1)/12,-2.5+(z+1)/12));this.water=makeBuffer(mesh);
    this.dynamic=gl.createBuffer();this.makeBuffer=makeBuffer;
    this.texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,this.texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    let drag=null;canvas.addEventListener('pointerdown',e=>{drag=[e.clientX,e.clientY];canvas.setPointerCapture(e.pointerId);canvas.classList.add('dragging')});
    canvas.addEventListener('pointermove',e=>{if(!drag)return;this.mode='pool';this.yaw-=(e.clientX-drag[0])*.008;this.elevation=Math.max(.18,Math.min(1.4,this.elevation+(e.clientY-drag[1])*.006));drag=[e.clientX,e.clientY];onChange()});
    const end=()=>{drag=null;canvas.classList.remove('dragging')};canvas.addEventListener('pointerup',end);canvas.addEventListener('pointercancel',end);
    canvas.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();this.mode='pool';if(e.key==='ArrowLeft')this.yaw-=.12;if(e.key==='ArrowRight')this.yaw+=.12;if(e.key==='ArrowUp')this.elevation=Math.min(1.4,this.elevation+.08);if(e.key==='ArrowDown')this.elevation=Math.max(.18,this.elevation-.08);onChange()});
    canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();onFailure()});
  }
  setView(mode){this.mode=mode;this.yaw=mode==='floor'?0:.65;this.elevation=mode==='floor'?1.54:.66;}
  draw(wave,depthCm,showRays){
    const gl=this.gl,c=this.canvas,r=c.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,1.5),w=Math.round(r.width*d),h=Math.round(r.height*d),depth=depthCm/100;
    if(!w||!h)return;if(c.width!==w||c.height!==h){c.width=w;c.height=h;}
    gl.viewport(0,0,w,h);gl.clearColor(.045,.075,.095,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.enable(gl.DEPTH_TEST);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.useProgram(this.program);
    const norm=v=>{const l=Math.hypot(...v);return v.map(x=>x/l)},cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],target=[0,-depth*.85,0],radius=this.mode==='floor'?7.4:7.3;
    const eye=[radius*Math.sin(this.yaw)*Math.cos(this.elevation),target[1]+radius*Math.sin(this.elevation),radius*Math.cos(this.yaw)*Math.cos(this.elevation)],forward=norm(target.map((x,i)=>x-eye[i])),right=norm(cross(forward,[0,1,0])),up=cross(right,forward);
    for(const [k,v] of Object.entries({eye,forward,right,up}))gl.uniform3f(this.uniforms[k],...v);
    gl.uniform2f(this.uniforms.resolution,w,h);gl.uniform1f(this.uniforms.depth,depth);gl.uniform1f(this.uniforms.wave,wave);gl.uniform1f(this.uniforms.time,this.time);
    const key=[wave,depth,this.time].join(',');
    if(key!==this.key){
      this.key=key;this.bins=window.PokettoWater.density(wave,depth,this.time);const pixels=new Uint8Array(128*128);
      for(let i=0;i<pixels.length;i++)pixels[i]=Math.round(Math.min(8,this.bins[i])/8*255);
      gl.bindTexture(gl.TEXTURE_2D,this.texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.LUMINANCE,128,128,0,gl.LUMINANCE,gl.UNSIGNED_BYTE,pixels);
    }
    const draw=(object,layer,mode=gl.TRIANGLES)=>{gl.uniform1f(this.uniforms.layer,layer);gl.bindBuffer(gl.ARRAY_BUFFER,object.buffer);gl.enableVertexAttribArray(this.position);gl.vertexAttribPointer(this.position,3,gl.FLOAT,false,0,0);gl.drawArrays(mode,0,object.count)};
    const dynamic=(vertices,layer,mode)=>{gl.bindBuffer(gl.ARRAY_BUFFER,this.dynamic);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.DYNAMIC_DRAW);draw({buffer:this.dynamic,count:vertices.length/3},layer,mode)};
    gl.depthMask(true);draw(this.floor,0);
    if(this.mode!=='floor'){
      const sx=eye[0]>0?-2.5:2.5,sz=eye[2]>0?-2.5:2.5;
      const walls=[sx,0,-2.5,sx,-1,-2.5,sx,0,2.5,sx,0,2.5,sx,-1,-2.5,sx,-1,2.5,-2.5,0,sz,2.5,0,sz,-2.5,-1,sz,-2.5,-1,sz,2.5,0,sz,2.5,-1,sz];
      gl.depthMask(false);dynamic(walls,2,gl.TRIANGLES);draw(this.water,1);
      const edges=[];for(const y of [0,-depth]){for(const z of [-2.5,2.5])edges.push(-2.5,y,z,2.5,y,z);for(const x of [-2.5,2.5])edges.push(x,y,-2.5,x,y,2.5)}for(const x of [-2.5,2.5])for(const z of [-2.5,2.5])edges.push(x,0,z,x,-depth,z);dynamic(edges,5,gl.LINES);
      if(showRays){
        const guides=[];
        for(const fixed of [-2,-1,0,1,2])for(let k=0;k<40;k++)for(const alongX of [true,false]){
          const a=-2.5+k/8,b=a+.125,x0=alongX?a:fixed,z0=alongX?fixed:a,x1=alongX?b:fixed,z1=alongX?fixed:b;
          guides.push(x0,window.PokettoWater.surface(x0,z0,wave,this.time).h,z0,x1,window.PokettoWater.surface(x1,z1,wave,this.time).h,z1);
        }
        dynamic(guides,5,gl.LINES);
        const lines=[],dots=[];for(let j=-2;j<=2;j++)for(let i=-2;i<=2;i++){const ray=window.PokettoWater.trace(i*.65,j*.65,wave,depth,this.time);lines.push(i*.65,.9,j*.65,...ray.start,...ray.start,...ray.end);const [x,y,z]=ray.end,rr=.028;dots.push(x-rr,y+.004,z,x+rr,y+.004,z,x,y+.004,z-rr,x,y+.004,z+rr)}dynamic(lines,3,gl.LINES);dynamic(dots,4,gl.LINES)}
    }
    gl.depthMask(true);
  }
};
