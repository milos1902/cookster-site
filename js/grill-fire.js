/* The stone grill (top left of the kitchen): it is OFF by default, only cold coals. The picture of the kitchen has the glowing embers painted in, so a patch (assets/effects/grill_coals_off.webp)
   with the same picture but cold coals lies over them. When the grill is lit the patch melts away and the painted embers show, and over them the embers twinkle (one brighter, one darker, all the time,
   each on its own rhythm) and a thin smoke rises. A firewood log from the hand on the grill lights it (it burns for a few minutes, then it dies down); CooksterGrill.set(true/false) does it from code. */
(function(){
'use strict';
if(window.CooksterGrill)return;
var BOX={x:230,y:18,w:540,h:147},PATCH='assets/effects/grill_coals_off.webp?v=1',MASK='assets/effects/grill_embers_mask.png?v=1',BURN=240,MAXB=480;
var GRILL_RECT={l:225,t:20,r:760,b:235};
var root=null,patch=null,fl=null,fc=null,sm=null,sc=null,mask=null,mk=null,cells=[],smoke=[],level=0,target=0,left=0,last=0,run=false,t=0,mimg=new Image();
mimg.src=MASK;
function build(){
  var sc0=document.getElementById('scene');if(!sc0)return false;
  root=document.createElement('div');root.id='grillFire';root.style.cssText='position:absolute;left:'+BOX.x+'px;top:'+BOX.y+'px;width:'+BOX.w+'px;height:'+BOX.h+'px;pointer-events:none;z-index:2';
  patch=document.createElement('img');patch.src=PATCH;patch.draggable=false;patch.style.cssText='position:absolute;left:0;top:0;width:100%;height:100%;opacity:1;transition:opacity 1.6s ease';
  fl=document.createElement('canvas');fl.width=BOX.w;fl.height=BOX.h;fl.style.cssText='position:absolute;left:0;top:0;width:100%;height:100%';fc=fl.getContext('2d');
  root.appendChild(patch);root.appendChild(fl);sc0.appendChild(root);
  // the smoke has its own canvas, it goes up above the grill
  sm=document.createElement('canvas');sm.width=BOX.w;sm.height=BOX.y+BOX.h;sm.style.cssText='position:absolute;left:'+BOX.x+'px;top:0;width:'+BOX.w+'px;height:'+sm.height+'px;pointer-events:none;z-index:3';sc=sm.getContext('2d');sc0.appendChild(sm);
  mask=document.createElement('canvas');mask.width=BOX.w;mask.height=BOX.h;mk=mask.getContext('2d');
  var pick=function(){
    mk.clearRect(0,0,BOX.w,BOX.h);mk.drawImage(mimg,0,0,BOX.w,BOX.h);
    var d=mk.getImageData(0,0,BOX.w,BOX.h).data,tries=0;cells=[];
    while(cells.length<90&&tries<6000){tries++;var x=Math.floor(Math.random()*BOX.w),y=Math.floor(Math.random()*BOX.h);if(d[(y*BOX.w+x)*4+3]>110)cells.push({x:x,y:y,f:.7+Math.random()*2.6,p:Math.random()*6.28,n:Math.random(),r:6+Math.random()*7});}
  };
  if(mimg.complete&&mimg.naturalWidth)pick();else mimg.addEventListener('load',pick);
  return true;
}
var off=null,ox=null;
function blots(hot){
  if(!off){off=document.createElement('canvas');off.width=BOX.w;off.height=BOX.h;ox=off.getContext('2d');}
  ox.globalCompositeOperation='source-over';ox.clearRect(0,0,BOX.w,BOX.h);
  for(var i=0;i<cells.length;i++){var c=cells[i];
    c.n+=(Math.random()-.5)*.12;c.n=Math.max(0,Math.min(1,c.n));
    var I=.5+.34*Math.sin(t*c.f+c.p)+.5*(c.n-.5);        // 0 = dark, 1 = bright
    var a=hot?(I-.55)*1.15:(.42-I)*1.5;if(a<=.02)continue;a=Math.min(.9,a)*level;
    var g=ox.createRadialGradient(c.x,c.y,0,c.x,c.y,c.r*(hot?1.25:1));
    if(hot){g.addColorStop(0,'rgba(255,196,90,'+a.toFixed(3)+')');g.addColorStop(.5,'rgba(255,120,30,'+(a*.55).toFixed(3)+')');g.addColorStop(1,'rgba(255,80,10,0)');}
    else{g.addColorStop(0,'rgba(40,10,2,'+a.toFixed(3)+')');g.addColorStop(1,'rgba(40,10,2,0)');}
    ox.fillStyle=g;ox.fillRect(c.x-c.r*1.3,c.y-c.r*1.3,c.r*2.6,c.r*2.6);
  }
  ox.globalCompositeOperation='destination-in';ox.drawImage(mask,0,0);
}
function frame(now){
  var dt=Math.min(.05,(now-last)/1000||.016);last=now;t+=dt;
  if(left>0){left-=dt;if(left<=0){left=0;target=0;}else if(left<25)target=Math.max(.0,left/25);}
  level+=(target-level)*Math.min(1,dt*(target>level?1.4:.6));if(Math.abs(target-level)<.004)level=target;
  patch.style.opacity=String(Math.max(0,1-Math.min(1,level*1.25)));
  fc.clearRect(0,0,BOX.w,BOX.h);
  if(level>.01&&cells.length){
    var pulse=.5+.5*Math.sin(t*.8)+.25*Math.sin(t*2.3+1);
    blots(false);fc.globalCompositeOperation='source-over';fc.drawImage(off,0,0);
    blots(true);fc.globalCompositeOperation='lighter';fc.drawImage(off,0,0);
    // the whole pit breathes a little (the light of the embers on the grate and on the stones around)
    var g=fc.createRadialGradient(BOX.w*.5,BOX.h*.52,10,BOX.w*.5,BOX.h*.52,BOX.w*.46);g.addColorStop(0,'rgba(255,120,30,'+((.05+.05*pulse)*level).toFixed(3)+')');g.addColorStop(1,'rgba(255,90,10,0)');
    fc.globalCompositeOperation='lighter';fc.fillStyle=g;fc.fillRect(0,0,BOX.w,BOX.h);fc.globalCompositeOperation='source-over';
  }
  // smoke
  if(level>.05&&Math.random()<dt*(1.2+3*level)){smoke.push({x:60+Math.random()*(BOX.w-120),y:BOX.y+36+Math.random()*20,vx:6+Math.random()*10,vy:-(14+Math.random()*14),a:0,life:0,max:3.6+Math.random()*2.6,r:7+Math.random()*7,k:level});}
  sc.clearRect(0,0,sm.width,sm.height);
  for(var i=smoke.length-1;i>=0;i--){var p=smoke[i];p.life+=dt;if(p.life>=p.max){smoke.splice(i,1);continue;}
    p.x+=(p.vx+Math.sin(p.life*1.7+i)*6)*dt;p.y+=p.vy*dt;var f=p.life/p.max,rr=p.r*(1+f*2.8),al=.24*p.k*Math.sin(Math.min(1,f*3)*Math.PI/2)*(1-f);
    var gg=sc.createRadialGradient(p.x,p.y,0,p.x,p.y,rr);gg.addColorStop(0,'rgba(215,210,205,'+al.toFixed(3)+')');gg.addColorStop(1,'rgba(215,210,205,0)');sc.fillStyle=gg;sc.beginPath();sc.arc(p.x,p.y,rr,0,Math.PI*2);sc.fill();}
  if(level>0||smoke.length||target>0)requestAnimationFrame(frame);else run=false;
}
function kick(){if(!run){run=true;last=performance.now();requestAnimationFrame(frame);}}
function set(on,sec){
  if(!root&&!build())return;
  if(on){target=1;left=Math.min(MAXB,(left>0?left:0)+(sec||BURN));}else{target=0;left=0;}
  kick();
}
function start(){if(!root)build();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else setTimeout(start,0);
setInterval(function(){if(root&&!root.isConnected)root=null;if(!root)build();},2000);
/* a firewood log from the hand on the grill: lights it */
window.addEventListener('pointerdown',function(e){
  if(e.button!==0||typeof holding==='undefined'||!holding||!holding.dataset)return;
  if(holding.dataset.itemId!=='drvo'&&holding.dataset.basketWoodLog!=='1')return;
  var p;try{p=screenToScene(e.clientX,e.clientY);}catch(x){return;}
  if(p.x<GRILL_RECT.l||p.x>GRILL_RECT.r||p.y<GRILL_RECT.t||p.y>GRILL_RECT.b)return;
  e.stopImmediatePropagation();e.preventDefault();
  try{CooksterPantryBridge.detachHeld();}catch(x){return;}
  set(true);try{showToast(left>BURN+5?'Roštilj gori još jače.':'Roštilj je zapaljen.');}catch(x){}
},true);
window.CooksterGrill={set:set,lit:function(){return target>0;},left:function(){return left;}};
})();
