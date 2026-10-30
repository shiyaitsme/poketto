/* Qualitative visual models, with the physical relationships stated beside each scene. */
(() => {
'use strict';
const $=id=>document.getElementById(id), canvas=$('light'), ctx=canvas.getContext('2d'), diagram=$('diagram'), dc=diagram.getContext('2d');
const scenes={
 sky:{name:'天空与晚霞',label:'01 / A SKY YOU CAN LOOK AROUND',prompt:'你站在湖边，面向落日。拖动天空环顾四周，再把太阳降到地平线以下，看看橘粉晚霞怎样过渡到蓝调。',params:[['alt','太阳高度',-10,80,6,'°'],['air','雾霾感',0.3,2,0.7,'×',0.05]],presets:[['白天',{alt:40,air:0.7}],['金色时刻',{alt:6,air:0.7}],['粉色晚霞',{alt:-1,air:0.7}],['蓝调时刻',{alt:-7,air:0.7}]],equation:'短波光更易散射 · 散射强度 ∝ 1 / λ⁴',mechanism:'太阳低时，阳光穿过更长的大气路径，更多蓝光被散走，太阳方向留下橘红色。高处天空仍偏蓝，薄云接到偏暖的阳光时可呈橘粉色。日落后，上层大气仍被照亮，余晖逐渐减弱，天空转向蓝紫色。不是每次日落都有相同颜色，云、气溶胶和观察方向都会改变它。',notice:'日落时分别看看太阳方向、头顶和背向太阳的天空：暖色往往集中在低空，头顶仍可偏蓝。太阳落下后再等一会，留意粉色余晖和蓝调的变化。不要直视真实的太阳。',limits:'这是带透视相机、三维地形和湖面反射的 WebGL 场景。天空用随太阳高度、观察方向变化的经验配色及程序薄云演示典型色彩，不是光谱大气模拟，也不保证某个太阳高度必然出现粉霞。太阳圆盘适度放大以便辨认；不支持 WebGL 时使用二维示意。'},
 film:{name:'肥皂膜的颜色',label:'02 / TWO REFLECTIONS, ONE COLOUR',prompt:'这是一个空心的肥皂泡，彩色来自包住空气的薄薄水膜。拖动环绕，点击泡泡选一个位置，再点「放大选中处」，看这一小块膜怎样反射光。',params:[['thick','参考膜厚',0,1200,350,' nm'],['angle','观察点斜视角',0,89,15,'°']],presets:[['薄到发暗',{thick:0,angle:0}],['绿光更亮',{thick:103,angle:0}],['绿光变暗',{thick:207,angle:0}],['看看彩带',{thick:650,angle:25}]],equation:'相位差 δ = 4πnd cos θₜ / λ + π',mechanism:'泡泡是空心的，外壁是一层水膜。观察一个局部位置：第一束光在水膜外侧界面反射，第二束进入水膜、在内侧界面反射，再从外侧出来。两束光叠加时，波峰对波峰会增强，波峰对波谷会抵消。不同颜色的波长不同，同样的膜厚，对它们的增强与抵消也不同，所以白光反射后变成了彩色。外侧界面的反射还会让波形翻转，这已计入波形比较。',notice:'看看一个真正的肥皂泡：上方的膜往往更薄，下方更厚，边缘又比正面更斜，不同位置的颜色因此不同。斜着看同一个位置，颜色也可能变化。极薄时，反射光接近相消，看向深色背景会显得发暗。',limits:'三维球壳展示空心肥皂泡，膜厚随高度和位置变化；没有模拟流体排液和形变。每个像素按局部法线和视线计算斜视角，颜色采用等亮环境近似；背面球壁弱化显示，不做完整多次反射。局部放大图中的两个界面是同一块球壁的空气—水膜—空气界面，不是整个泡泡的前后球壁。颜色用空气—肥皂水—空气、折射率 1.33 的两束光干涉近似，对 380–780 nm 光谱积分后映射到屏幕 RGB。光路图不按真实角度和膜厚比例绘制，并把出射光分开以便阅读，波形包含前表面反射的 π 相位反转。强度在各波长内归一化，不是真实反射率，也不是测厚色卡。不支持 WebGL 时使用二维膜面示意。'},
 water:{name:'池底的光纹',label:'03 / LIGHT GATHERS HERE',prompt:'把水池从平静调到起伏，再勾选「显示折射光路」：看水面怎样把原本平行的光线折向一起。拖动查看侧面，或点「俯看池底」追踪亮纹。',params:[['wave','水面起伏',0,1,0.8,'',0.01],['depth','池底深度',30,180,140,' cm']],presets:[['平静水面',{wave:0,depth:110}],['浅水波光',{wave:0.65,depth:50}],['深一点看看',{wave:0.65,depth:160}],['波光粼粼',{wave:0.9,depth:140}]],equation:'n₁ sin θ₁ = n₂ sin θ₂',mechanism:'阳光到达水面时近似平行。水面一旦起伏，每个位置的法线就不同，光进入水中后向各自的法线偏折。原本间隔均匀的光线，在池底有些地方挤到一起，有些地方散开。接到更多光的地方更亮，这些亮纹叫焦散。水深改变光线传播到池底的距离，所以亮纹的位置和形状也会改变，并不是越深一定越亮。',notice:'晴天看看浅泳池底：水面轻轻动，池底的亮纹就会晃动。它不是把水面波纹原样投影下来，而是折射后的光线密度分布。先用平静水面对照，再观察起伏水面，更容易看清区别。',limits:'用三个不同方向的正弦波组成二维水面，以垂直平行光照射。均匀采样 256×256 条光线，按局部法线和斯涅尔定律（空气 1、水 1.333）计算折射，再把池底落点累加为 128×128 密度纹理；三维光路与亮纹使用同一套计算。水面视作延伸到观察区以外，忽略池壁遮挡。水面透明度、色彩和瓷砖为阅读辅助，未模拟完整视线折射、多次反射、吸收和流体运动。动画是预设波相位变化，不是流体求解。亮纹亮度做了压缩，展示相对聚光而非真实照度。不支持 WebGL 时保留二维截面示意。'}
};
let current='sky', values={},width=600,height=420;
let waterView=null,waterAttempted=false,waterPlaying=false,waterFrame=0,waterLast=0;
let skyView=null,filmView=null,filmAttempted=false,filmMode='surface',waveLength=550,filmPoint={thick:350,angle:0};
const skyCanvas=$('sky-3d');
function fallbackSky(){skyView=null;$('face-sun').hidden=true;skyCanvas.hidden=true;canvas.hidden=false;if(current==='sky')render();}
try{skyView=new window.PokettoSky(skyCanvas,()=>{if(current==='sky')render()},fallbackSky)}catch(e){console.warn('3D sky unavailable; using 2D illustration.',e)}
$('face-sun').onclick=()=>{if(skyView){skyView.faceSun(values.alt);render()}};
function syncViews(){
 skyCanvas.hidden=current!=='sky'||!skyView;
 $('water-3d').hidden=current!=='water'||!waterView;
 for(const id of ['water-tabs','water-tools','water-caption','water-source'])$(id).hidden=current!=='water'||!waterView;
 $('water-rays').disabled=current==='water'&&waterView?.mode==='floor';
 if(current!=='water'&&waterPlaying)setWaterPlaying(false);
 document.querySelectorAll('[data-water-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.waterView===(waterView?.mode||'pool'))));
 $('film-3d').hidden=current!=='film'||!filmView;
 canvas.hidden=(current==='sky'&&!!skyView)||(current==='film'&&!!filmView)||(current==='water'&&!!waterView);
 $('face-sun').hidden=current!=='sky'||!skyView;
 $('bubble-label').hidden=current!=='film';canvas.parentElement.parentElement.classList.toggle('film-expanded',current==='film'&&filmMode==='paths');$('film-probe').hidden=current!=='film';$('film-detail').hidden=current!=='film'||filmMode!=='paths';$('film-source').hidden=current!=='film';$('diagram').hidden=current==='film';$('film-tabs').hidden=current!=='film';$('film-read').hidden=current!=='film';
 document.querySelectorAll('[data-film-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.filmMode===filmMode)));
}
function ensureFilm(){
 if(filmAttempted)return;filmAttempted=true;
 try{
  const pixels=new Uint8Array(256*64*3);
  for(let y=0;y<64;y++)for(let x=0;x<256;x++){
   const col=filmColor(x/255*1800,y/63*90);
   for(let k=0;k<3;k++)pixels[(y*256+x)*3+k]=Math.round(Math.max(0,Math.min(1,col[k]))*255);
  }
  filmView=new window.PokettoFilm($('film-3d'),pixels,()=>render(),()=>{filmView=null;syncViews();if(current==='film')render()});
 }catch(e){console.warn('3D film unavailable; using 2D illustration.',e)}
}
function setWaterPlaying(play){
 waterPlaying=play;cancelAnimationFrame(waterFrame);$('water-play').textContent=play?'暂停水面':'让水动起来';$('water-play').setAttribute('aria-pressed',String(play));
 if(play){waterLast=performance.now();waterFrame=requestAnimationFrame(animateWater)}
}
function animateWater(now){
 if(!waterPlaying||current!=='water'||!waterView)return;
 if(now-waterLast>=85&&!document.hidden){waterView.time+=Math.min(.15,(now-waterLast)/1000);waterLast=now;waterView.draw(values.wave,values.depth,$('water-rays').checked)}
 waterFrame=requestAnimationFrame(animateWater);
}
function ensureWater(){
 if(waterAttempted)return;waterAttempted=true;
 try{waterView=new window.PokettoWater($('water-3d'),()=>render(),()=>{waterView=null;setWaterPlaying(false);if(current==='water')render()})}catch(e){console.warn('3D pool unavailable; using 2D illustration.',e)}
}
function setup(){
 const s=scenes[current];
 if(current==='water'){ensureWater();setWaterPlaying(false);$('water-rays').checked=false;if(waterView){waterView.time=0;waterView.setView('pool')}}
 if(current==='film'){filmMode='surface';waveLength=550;ensureFilm()}
 if(current==='sky'&&skyView)skyView.reset();
 values=Object.fromEntries(s.params.map(p=>[p[0],p[4]]));syncViews();if(current==='film'&&filmView){filmView.reset();filmView.setProbeAngle(values.angle)}
 $('heading').textContent=s.name;$('scene-label').textContent=s.label;$('prompt').textContent=s.prompt;
 for(const k of ['equation','mechanism','notice','limits'])$(k).textContent=s[k];
 $('inputs').replaceChildren();
 for(const [key,label,min,max,value,unit,step] of s.params){
  const box=document.createElement('div');box.className='control';
  const lab=document.createElement('label');lab.htmlFor=key;lab.append(document.createTextNode(label));
  const out=document.createElement('output');out.id=key+'-value';out.htmlFor=key;lab.append(out);
  const input=document.createElement('input');input.className='pk-range';Object.assign(input,{type:'range',id:key,min,max,step:step||1,value});
  input.addEventListener('input',()=>{values[key]=Number(input.value);if(current==='film'&&key==='angle'&&filmView)filmView.setProbeAngle(values.angle);render()});box.append(lab,input);$('inputs').append(box);
 }
 $('presets').replaceChildren();
 for(const [label,v] of s.presets){
  const b=document.createElement('button');b.className='pk-chip zh';b.textContent=label;
  b.onclick=()=>{Object.assign(values,v);if(current==='sky'&&skyView)skyView.faceSun(values.alt);if(current==='film'){if(filmView){filmView.reset();filmView.setProbeAngle(values.angle)}if(label.startsWith('绿光'))waveLength=550;}render()};$('presets').append(b);
 }
 canvas.setAttribute('aria-label',s.name+'，使用下方或右侧滑块改变参数');render();
}
function size(c){const r=c.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);c.width=Math.round(r.width*d);c.height=Math.round(r.height*d);const g=c.getContext('2d');g.setTransform(d,0,0,d,0,0);return [r.width,r.height]}
function line(g,x,y,x2,y2,color,w=1){g.strokeStyle=color;g.lineWidth=w;g.beginPath();g.moveTo(x,y);g.lineTo(x2,y2);g.stroke()}
function text(g,t,x,y,color='#e6e6db'){g.fillStyle=color;g.font='12px sans-serif';g.fillText(t,x,y)}
function rgb(a){return `rgb(${a.map(v=>Math.round(Math.max(0,Math.min(1,v))*255)).join(',')})`}
function sky(){
 const {alt,air}=values;
 if(skyView){skyView.draw(alt,air)}else{
  const stops=alt>12?['#326fa7','#87b7d3','#e2d9be']:alt>0?['#3e628d','#c48a9e','#f1a368']:alt>-4?['#384d7b','#a7799b','#e7a38e']:['#172442','#4e547f','#a17d96'];
  const grad=ctx.createLinearGradient(0,0,0,height*.78);stops.forEach((c,i)=>grad.addColorStop(i/2,c));ctx.fillStyle=grad;ctx.fillRect(0,0,width,height);
  if(alt>-.8){const x=width*.55,y=height*.78-Math.sin(alt*Math.PI/180)*height*.7;ctx.fillStyle=alt<10?'#ffd3a1':'#fff5de';ctx.beginPath();ctx.arc(x,y,7,0,Math.PI*2);ctx.fill()}
  ctx.fillStyle='#253342';ctx.fillRect(0,height*.79,width,height*.21);
 }
 $('observation').textContent=alt>12?'白天：较高的太阳照亮蓝天。点击「看向太阳」能抬头找到太阳。':alt>0?'太阳仍在地平线上方，朝它的方向看，低空逐渐转暖；头顶仍是蓝色。':alt>-4?'太阳已落到地平线下。薄云和高处大气还接到阳光，余晖可以呈橘粉色，天空上方保留蓝紫色。':'蓝调时刻：太阳已经落下，暖色余晖减弱，天空和湖面渐渐转为深蓝。';
 if(air>1.4)$('observation').textContent+=' 雾霾感增大，地平线更朦胧，色彩也会被冲淡。';
}
// Approximate CIE 1931 colour matching functions (Gaussian fits).
function cie(l){const g=(m,a,b)=>Math.exp(-.5*Math.pow((l-m)*(l<m?a:b),2));return [1.056*g(599.8,.0264,.0323)+.362*g(442,.0624,.0374)-.065*g(501.1,.049,.0382),.821*g(568.8,.0213,.0247)+.286*g(530.9,.0613,.0322),1.217*g(437,.0845,.0278)+.681*g(459,.0385,.0725)]}
function reflect(l,d,angle=values.angle){const a=angle*Math.PI/180,ct=Math.sqrt(1-Math.pow(Math.sin(a)/1.33,2));return (1-Math.cos(4*Math.PI*1.33*d*ct/l))/2}
const spectral=Array.from({length:81},(_,i)=>{const l=380+i*5;return [l,cie(l)]});
function filmColor(d,angle=values.angle){let X=0,Y=0,Z=0;for(const [l,c] of spectral){const r=reflect(l,d,angle);X+=r*c[0];Y+=r*c[1];Z+=r*c[2]}X/=22;Y/=22;Z/=22;return [3.2406*X-1.5372*Y-.4986*Z,-.9689*X+1.8758*Y+.0415*Z,.0557*X-.204*Y+1.057*Z].map(v=>v<=.0031308?Math.max(0,v)*12.92:1.055*Math.pow(v,1/2.4)-.055)}
function arrow(g,x,y,x2,y2,color,w=2){line(g,x,y,x2,y2,color,w);const a=Math.atan2(y2-y,x2-x);line(g,x2,y2,x2-8*Math.cos(a-.45),y2-8*Math.sin(a-.45),color,w);line(g,x2,y2,x2-8*Math.cos(a+.45),y2-8*Math.sin(a+.45),color,w)}
function filmPaths(g,w,h){
 g.fillStyle='#111f2b';g.fillRect(0,0,w,h);
 const y1=h*.44,y2=h*.65,x1=w*.30,x2=w*.43,x3=w*.56;
 g.fillStyle='#84bcb32b';g.fillRect(18,y1,w-36,y2-y1);
 line(g,18,y1,w-18,y1,'#a5c5c0',1.5);line(g,18,y2,w-18,y2,'#a5c5c0',1.5);
 const col=waveLength===650?'#f6a59b':waveLength===550?'#b9e04c':'#97bfff';
 arrow(g,w*.12,h*.23,x1,y1,'#f0eee4');
 arrow(g,x1,y1,w*.47,h*.23,col);
 line(g,x1,y1,x2,y2,col,2);line(g,x2,y2,x3,y1,col,2);
 g.setLineDash([6,4]);arrow(g,x3,y1,w*.77,h*.23,col);g.setLineDash([]);
 text(g,'白光',w*.08,h*.18);text(g,'①',w*.47,h*.19,col);text(g,'②',w*.77,h*.19,col);
 text(g,'外侧',22,y1-10,'#b6c8c9');text(g,'肥皂水',22,(y1+y2)/2+4,'#b6c8c9');text(g,'内侧',22,y2+20,'#b6c8c9');
 text(g,'① 在水膜外侧反射',22,h*.79,col);text(g,'② 进膜 → 内侧反射 → 出膜',22,h*.86,col);
 text(g,'角度与膜厚非比例；光路分开示意',22,h-12,'#a3b4bb');
}
function filmWaves(){
 const c=$('film-waves'),g=c.getContext('2d'),[w,h]=size(c),start=64,end=w-12;
 const ct=Math.sqrt(1-Math.pow(Math.sin(filmPoint.angle*Math.PI/180)/1.33,2));
 const delta=4*Math.PI*1.33*filmPoint.thick*ct/waveLength+Math.PI;
 const col=waveLength===650?'#b3493f':waveLength===550?'#47714a':'#386ba9';
 const waveName=waveLength===650?'红光':waveLength===550?'绿光':'蓝光';
 const rows=[28,73,118];
 ['① 外侧','② 内侧','叠加后'].forEach((label,i)=>{text(g,label,0,rows[i]+4,'#4a4c45');line(g,start,rows[i],end,rows[i],'#a5a69c',.7)});
 for(let row=0;row<3;row++){
  g.beginPath();
  for(let x=start;x<=end;x++){
   const t=(x-start)/(end-start)*Math.PI*6,first=Math.sin(t),second=Math.sin(t+delta);
   const v=row===0?first:row===1?second:(first+second);
   const y=rows[row]-v*12;x===start?g.moveTo(x,y):g.lineTo(x,y);
  }
  g.strokeStyle=col;g.lineWidth=row===2?2.5:1.5;g.stroke();
 }
 const intensity=reflect(waveLength,filmPoint.thick,filmPoint.angle);
 $('film-result').textContent=waveName+'在观察点：'+(intensity>.8?'两束波形接近同向，叠加更亮。':intensity<.2?'两束波形接近相反，叠加后变暗。':'两束波形部分抵消，亮度介于两者之间。');
 c.setAttribute('aria-label',waveName+'的两束反射光波形和叠加结果，相对反射强度 '+Math.round(intensity*100)+'%');
 for(const [name,l] of [['red',650],['green',550],['blue',450]]){const n=Math.round(reflect(l,filmPoint.thick,filmPoint.angle)*100);$(name+'-value').textContent=n+'%';$(name+'-bar').style.width=n+'%'}
 document.querySelectorAll('[data-wave]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.wave)===waveLength)));
}
function film(){
 const probeUV=filmView?filmView.selected:[Math.sin(values.angle*Math.PI/180)*.65,0];$('bubble-label').style.left='clamp(16px, '+((probeUV[0]+1)*50)+'%, calc(100% - 155px))';$('bubble-label').style.top='clamp(48px, '+((1-probeUV[1])*50)+'%, calc(100% - 35px))';
 if(filmView)filmView.draw(values.thick);
 else{
  ctx.fillStyle='#111f2b';ctx.fillRect(0,0,width,height);
  const r=Math.min(width*.38,height*.38),cx=width/2,cy=height*.5;
  for(let y=-r;y<r;y+=3)for(let x=-r;x<r;x+=3){
   const nx=x/r,ny=-y/r;if(nx*nx+ny*ny>=1)continue;
   const nz=Math.sqrt(1-nx*nx-ny*ny),d=values.thick*(1-ny*.35+.06*Math.sin(nx*8+ny*5)*Math.sin(nz*6+ny*3));
   ctx.fillStyle=rgb(filmColor(d,Math.acos(nz)*180/Math.PI).map(v=>v*.65));ctx.fillRect(cx+x,cy+y,3,3);
  }
  ctx.strokeStyle='#eef4ca';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(cx+Math.sin(values.angle*Math.PI/180)*r,cy,5,0,Math.PI*2);ctx.stroke();
 }
 $('legend').textContent=filmView?'3D · 拖动环绕 / 方向键 · 点击泡泡选点 · 圆环标记当前观察处':'二维球面示意 · 使用观察角滑杆选点';
 $('probe-readout').textContent='选中处膜厚 '+Math.round(filmPoint.thick)+' nm · 斜视角 '+Math.round(filmPoint.angle)+'°（相对这一点的法线）';
 if(filmMode==='paths'){const c=$('film-section'),g=c.getContext('2d'),[w,h]=size(c);filmPaths(g,w,h)}
 filmWaves();
 $('observation').textContent=values.thick<30?'泡泡并没有涂黑：膜极薄时，两束反射光接近抵消，反射变弱，你更容易透过它看见背景。':'点「上方较薄处」「正面」「边缘斜视处」比较。膜厚和局部斜视角都会影响颜色；下面的强度条和波形始终对应圆环选中的这一点。拖动会跟随这块膜；转到背面不可见时，观察点回到正面。';
}
function water(){if(waterView){waterView.draw(values.wave,values.depth,$('water-rays').checked);$('legend').textContent=waterView.mode==='floor'?'俯看池底 · 暂时移开水面，仅观察相同的聚光纹理':($('water-rays').checked?'青线＝水面起伏 · 金线＝抽样光路 · 小亮点＝落点':'3D · 拖动 / 方向键环绕 · 亮纹在瓷砖池底');$('observation').textContent=values.wave===0?'平静水面下，竖直入射的平行光不改道，池底照明均匀。勾选光路，看看等间距的光线。':'水面每一点的坡度不同，光线各自折向法线。光线在池底挤到一起的地方变亮；改变水深，它们相遇的位置也会变。';return}ctx.fillStyle='#122734';ctx.fillRect(0,0,width,height);const surface=x=>height*.23+values.wave*height*.045*(Math.sin(x/width*13)+.45*Math.sin(x/width*23));const slope=x=>values.wave*height*.045/width*(13*Math.cos(x/width*13)+.45*23*Math.cos(x/width*23));const bottom=height*.72,travel=height*.43*values.depth/110;ctx.fillStyle='#183e4b';ctx.beginPath();ctx.moveTo(0,height);for(let x=0;x<=width;x+=2)ctx.lineTo(x,surface(x));ctx.lineTo(width,height);ctx.fill();const bins=new Float32Array(Math.ceil(width));for(let x=-width;x<2*width;x+=.8){const a=Math.atan(slope(x)),theta=-a+Math.asin(Math.sin(a)/1.333),end=x+Math.tan(theta)*travel;if(end>=0&&end<width)bins[Math.floor(end)]+=1;if(x>=0&&x<=width&&Math.round(x/.8)%18===0){line(ctx,x,65,x,surface(x),'#eddf9877');line(ctx,x,surface(x),end,bottom,'#fce8a361')}}ctx.beginPath();for(let x=0;x<=width;x+=2){const y=surface(x);x===0?ctx.moveTo(x,y):ctx.lineTo(x,y)}ctx.strokeStyle='#85dddc';ctx.lineWidth=2;ctx.stroke();line(ctx,0,bottom,width,bottom,'#a6d0ce');for(let x=0;x<width;x++){let b=0;for(let j=-2;j<=2;j++)b+=bins[Math.max(0,Math.min(bins.length-1,x+j))];const intensity=Math.min(1,b/20);ctx.fillStyle=rgb([.07+intensity*.7,.2+intensity*.7,.24+intensity*.65]);ctx.fillRect(x,bottom+14,1,height-bottom-14)}text(ctx,'空气',18,58);text(ctx,'水',18,height*.43);text(ctx,'池底亮带',18,height-15);$('observation').textContent=values.wave===0?'平静水面：竖直入射的光不偏折，池底照明均匀。':'倾斜的水面让光线改道。光线密集处更亮；改变水深，光线相遇的位置也会变化。'}
function drawDiagram(){const [w,h]=size(diagram);dc.clearRect(0,0,w,h);if(current==='sky'){line(dc,25,75,w-25,75,'#d67b32',4);for(let i=0;i<7;i++){const x=70+i*(w-140)/6;dc.fillStyle='#6e7f82';dc.beginPath();dc.arc(x,75,3,0,7);dc.fill();line(dc,x,75,x+15,25,'#4583c6',2)}text(dc,'短波光散向其他方向',25,18,'#365f8a');text(dc,'直射光 →',w-95,110,'#b05b2c')}else if(current==='film'){dc.fillStyle='#9cbfc64d';dc.fillRect(0,55,w,45);line(dc,0,55,w,55,'#697e83');line(dc,0,100,w,100,'#697e83');line(dc,30,10,100,55,'#c48936',2);line(dc,100,55,160,10,'#b66376',2);line(dc,100,55,125,100,'#c48936',2);line(dc,125,100,150,55,'#c48936',2);line(dc,150,55,210,10,'#b66376',2);text(dc,'上表面反射',Math.min(w-115,220),35,'#704b57');text(dc,'膜内多走一程',20,130,'#425b62')}else{line(dc,0,60,w,100,'#4d9599',2);line(dc,w*.45,10,w*.45,78,'#bd903d',2);line(dc,w*.45,78,w*.52,140,'#bd903d',2);dc.setLineDash([4,4]);line(dc,w*.45-12,130,w*.45+12,30,'#7c8685');dc.setLineDash([]);text(dc,'入水后向法线偏折',20,25,'#385b60')}}
function render(){
 syncViews();if(current==='film'){if(filmView){filmPoint=filmView.sample(values.thick);if(!filmPoint){filmView.selected=[0,0];filmPoint=filmView.sample(values.thick)}values.angle=Math.min(89,Math.round(filmPoint.angle))}else{const a=values.angle*Math.PI/180,n=[Math.sin(a),0,Math.cos(a)];filmPoint={angle:values.angle,thick:values.thick*(1+.06*Math.sin(n[0]*8)*Math.sin(n[2]*6))}}}$('sky-status').hidden=current!=='sky';
 if(current==='sky')$('sky-status').textContent=values.alt>=0?'太阳在地平线上方 '+values.alt+'°':'太阳在地平线下方 '+Math.abs(values.alt)+'° · 日落后的余晖';
 if(!canvas.hidden)[width,height]=size(canvas);
 for(const [key,,,,,unit] of scenes[current].params){$(key).value=values[key];$(key+'-value').textContent=values[key]+unit}
 ctx.clearRect(0,0,width,height);
 if(current!=='film')$('legend').textContent=current==='water'?'上：水面截面与折射光线　下：池底亮带':(skyView?'3D · 拖动 / 方向键环顾 · 看向太阳可归位 · 湖面映出天空':'二维示意 · 当前环境无法启用 3D');
 ({sky,film,water}[current])();drawDiagram();
}
$('water-play').onclick=()=>setWaterPlaying(!waterPlaying);
$('water-rays').onchange=()=>render();
document.querySelectorAll('[data-water-view]').forEach(b=>b.onclick=()=>{if(waterView){waterView.setView(b.dataset.waterView);render()}});
document.querySelectorAll('[data-film-mode]').forEach(b=>b.onclick=()=>{filmMode=b.dataset.filmMode;render()});
$('bubble-label').onclick=()=>{filmMode='paths';render()};
document.querySelectorAll('[data-probe]').forEach(b=>b.onclick=()=>{const a=b.dataset.probe==='front'?0:b.dataset.probe==='top'?45:70;if(filmView)filmView.setProbeAngle(a,b.dataset.probe==='top');else values.angle=a;render()});
document.querySelectorAll('[data-wave]').forEach(b=>b.onclick=()=>{waveLength=Number(b.dataset.wave);render()});
document.querySelectorAll('[data-scene]').forEach(b=>b.onclick=()=>{current=b.dataset.scene;document.querySelectorAll('[data-scene]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));setup()});$('reset').onclick=setup;const resizeObserver=new ResizeObserver(()=>render());resizeObserver.observe(canvas.parentElement);setup();
})();
