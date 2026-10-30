/* Educational twilight schematic. Geometry and colours deliberately not to scale. */
(() => {
'use strict';
const $ = id => document.getElementById(id);
const time=$('time'), sky=$('sky'), section=$('section');
let playing=false, previous=0, raf=0;
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const mix=(a,b,t)=>a.map((x,i)=>Math.round(x+(b[i]-x)*t));
const rgb=a=>`rgb(${a.join(',')})`;
function setup(canvas){const r=canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(r.width*d);canvas.height=Math.round(r.height*d);const c=canvas.getContext('2d');c.scale(d,d);return [c,r.width,r.height];}
function line(c,x,y,X,Y,color,dash=[]){c.beginPath();c.setLineDash(dash);c.strokeStyle=color;c.lineWidth=1.5;c.moveTo(x,y);c.lineTo(X,Y);c.stroke();c.setLineDash([]);}
function arrow(c,x,y,X,Y,color){line(c,x,y,X,Y,color);const a=Math.atan2(Y-y,X-x);c.beginPath();c.fillStyle=color;c.moveTo(X,Y);c.lineTo(X-8*Math.cos(a-.4),Y-8*Math.sin(a-.4));c.lineTo(X-8*Math.cos(a+.4),Y-8*Math.sin(a+.4));c.fill();}
function label(c,text,x,y,color='#263247'){c.font='12px system-ui';c.fillStyle=color;c.fillText(text,x,y);}
function draw(){
const t=+time.value, night=clamp((t+1)/9),show=$('labels').checked,rays=$('rays').checked;
$('angle').textContent=`${-t>0?'+':''}${(-t).toFixed(1)}°`;
const stage=t<.6?0:t<5.5?1:2;
$('phase').textContent=['太阳落下，另一边开始变暗','你看到的是地球自己的影子','影子升高，粉色慢慢消散'][stage];
$('reason').textContent=['此时朝东看，太阳在你的身后。随着太阳下沉，地球开始遮住通往东侧低层大气的直射阳光。','下方大气失去直射阳光，成为蓝灰色地影；上方仍被偏红的阳光照亮，经散射呈现粉色。','太阳继续下沉，更多大气进入地影。地影向上抬升，粉色变淡，最终融入逐渐暗下的天空。'][stage];
document.querySelectorAll('[data-time]').forEach(b=>b.setAttribute('aria-pressed',Math.abs(t-+b.dataset.time)<.15));
{
const [c,w,h]=setup(sky),horizon=h*.83,shadow=clamp(t/8)*h*.30,edge=horizon-shadow;
const top=mix([92,154,196],[20,29,59],night),bottom=mix([204,194,200],[55,60,89],night);
let g=c.createLinearGradient(0,0,0,horizon);g.addColorStop(0,rgb(top));g.addColorStop(1,rgb(bottom));c.fillStyle=g;c.fillRect(0,0,w,h);
const strength=clamp((t+.5)/2)*clamp((8-t)/3);
for(let y=0;y<horizon;y++){const pink=Math.exp(-Math.pow((y-(edge-19))/26,2))*strength*.72;c.fillStyle=`rgba(239,151,171,${pink})`;c.fillRect(0,y,w,1);const s=clamp((y-edge+7)/20)*clamp(t/1.2)*.75;c.fillStyle=`rgba(48,64,99,${s})`;c.fillRect(0,y,w,1);}
c.fillStyle=rgb(mix([49,65,64],[15,26,34],night));c.beginPath();c.moveTo(0,horizon+2);for(let x=0;x<=w;x+=6)c.lineTo(x,horizon-3*Math.sin(x/54)-2*Math.cos(x/23));c.lineTo(w,h);c.lineTo(0,h);c.fill();
if(show){label(c,'东 E · 背向太阳',18,h-18,'#f5f0ed');if(t>.6&&t<7){label(c,'维纳斯带 · 仍受光',w*.53,edge-28,'#fff1f3');label(c,'地影 · 直射阳光被挡住',w*.45,Math.min(horizon-12,edge+29),'#edf0ff');}}
}
{
const [c,w,h]=setup(section),cx=w*.43,R=w*.82,cy=h*.72+R,oy=cy-R;
// Exaggerated solar depression makes the moving tangent/shadow legible.
const a=t*Math.PI/180*2.5,m=-Math.tan(a),boundary=x=>cy-R/Math.cos(a)+m*(x-cx);
c.fillStyle='#dce3e5';c.fillRect(0,0,w,h);
c.fillStyle='#a4afc2';c.beginPath();c.moveTo(0,boundary(0));c.lineTo(w,boundary(w));c.lineTo(w,h);c.lineTo(0,h);c.fill();
let glow=c.createLinearGradient(0,0,0,h);glow.addColorStop(0,'#f4ded455');glow.addColorStop(1,'#d88d9a55');c.fillStyle=glow;c.beginPath();c.moveTo(0,0);c.lineTo(w,0);c.lineTo(w,boundary(w));c.lineTo(0,boundary(0));c.fill();
if(rays){for(let i=0;i<3;i++){const y=45+i*29;arrow(c,12,y,w*.88,y+m*(w*.88-12),'#b17e39');}}
c.fillStyle='#586454';c.beginPath();c.arc(cx,cy,R,0,Math.PI*2);c.fill();c.strokeStyle='#344a46';c.stroke();
// Observer on the surface, facing right (east).
c.fillStyle='#202d2b';c.beginPath();c.arc(cx,oy-17,4,0,7);c.fill();line(c,cx,oy-13,cx,oy-3,'#202d2b');line(c,cx,oy-10,cx+9,oy-12,'#202d2b');
const px=w*.80,py=boundary(px)-20;
if(rays){line(c,cx,oy-17,px,py,'#9c4566',[4,4]);line(c,cx,oy-17,w*.85,Math.min(h-15,boundary(w*.85)+24),'#40547e',[4,4]);if(!$('light-note').hidden){arrow(c,px,py,cx+5,oy-18,'#ad4468');arrow(c,w*.26,60,w*.25,25,'#528dbd');label(c,'蓝光向其他方向散射',w*.12,38,'#366e9d');}c.fillStyle='#e3a0b1';c.beginPath();c.arc(px,py,5,0,7);c.fill();}
if(show){label(c,'西 W · 阳光来自这侧',16,h-17,'#f1efe4');label(c,'东 E',w-53,h-17,'#f1efe4');label(c,'你',cx-7,oy+23,'#fff5e8');label(c,'地球（曲率放大）',w*.56,h-42,'#fff5e8');label(c,'仍受直射阳光',w*.57,67);if(t>.5)label(c,'地影',w*.82,Math.min(h-63,boundary(w*.82)+20));}
}
}
function stop(){playing=false;cancelAnimationFrame(raf);$('play').textContent='▶ 播放日落';$('play').setAttribute('aria-pressed','false');}
function tick(now){if(!playing)return;const dt=previous?Math.min(now-previous,100):0;previous=now;time.value=Math.min(8,+time.value+dt*.00045);draw();if(+time.value>=8)stop();else raf=requestAnimationFrame(tick);}
time.addEventListener('input',()=>{stop();draw();});
$('play').addEventListener('click',()=>{if(playing){stop();return;}if(+time.value>=8)time.value=-2;playing=true;previous=0;$('play').textContent='Ⅱ 暂停';$('play').setAttribute('aria-pressed','true');raf=requestAnimationFrame(tick);});
document.querySelectorAll('[data-time]').forEach(b=>b.addEventListener('click',()=>{stop();time.value=b.dataset.time;draw();}));
['labels','rays'].forEach(id=>$(id).addEventListener('change',draw));
$('trace').setAttribute('aria-expanded','false');$('trace').addEventListener('click',()=>{const open=$('light-note').hidden;$('light-note').hidden=!open;$('trace').setAttribute('aria-expanded',String(open));$('trace').textContent=open?'收起光路解释 ↙':'点亮粉色光带的光路 ↗';if(open){$('rays').checked=true;if(+time.value<1||+time.value>6){stop();time.value=3;}}draw();});
sky.addEventListener('click',()=>$('trace').click());
new ResizeObserver(draw).observe(sky);draw();
})();
