/* The stone grill (top left of the kitchen, and its close-up): it is OFF by default, only cold coals. The pictures have the glowing embers painted in, so for the kitchen a patch
   (assets/effects/grill_coals_off.webp) with the same picture but cold coals lies over them, and the close-up has a picture of its own with cold coals (assets/grill_zoom_off.webp).
   When the grill is lit the patch melts away and the painted embers show, and over them the embers twinkle (one brighter, one darker, all the time, each on its own rhythm) and a thin smoke rises.
   A firewood log from the hand on the grill lights it (it burns for a few minutes, then it dies down); CooksterGrill.set(true/false) does it from code. */
(function(){
'use strict';
if(window.CooksterGrill)return;
var BURN=240,MAXB=480,GRILL_RECT={l:225,t:20,r:760,b:235};
var level=0,target=0,left=0,last=0,run=false,t=0,effects=[];

/* one effect = a canvas over one picture of the grill: the twinkle of the embers (clipped by a mask) and the smoke.
   o: cx,cy,cw,ch = the canvas in the pixels of the scene picture (1672x941); mx,my = where the mask picture lies on the canvas; mask = its src; n = how many embers twinkle; k = the size (1 = the kitchen);
   sx0,sx1,sy = where the smoke starts (x range and y); patch = the cold coals patch (kitchen only) */
function makeEffect(o){
  var cv=document.createElement('canvas');cv.width=o.cw;cv.height=o.ch;cv.className=o.cls||'';
  var cx=cv.getContext('2d'),mimg=new Image(),mask=document.createElement('canvas'),cells=[],smoke=[],off=document.createElement('canvas'),ox;
  mimg.src=o.mask;off.width=o.cw;off.height=o.ch;ox=off.getContext('2d');
  var e={cv:cv,patch:o.patch||null};
  function pick(){
    mask.width=o.cw;mask.height=o.ch;var mk=mask.getContext('2d');mk.clearRect(0,0,o.cw,o.ch);mk.drawImage(mimg,o.mx,o.my);
    var d=mk.getImageData(0,0,o.cw,o.ch).data,tries=0;cells=[];
    while(cells.length<o.n&&tries<9000){tries++;var x=Math.floor(Math.random()*o.cw),y=Math.floor(Math.random()*o.ch);if(d[(y*o.cw+x)*4+3]>110)cells.push({x:x,y:y,f:.7+Math.random()*2.6,p:Math.random()*6.28,n:Math.random(),r:(6+Math.random()*7)*o.k});}
  }
  if(mimg.complete&&mimg.naturalWidth)pick();else mimg.addEventListener('load',pick);
  function blots(hot){
    ox.globalCompositeOperation='source-over';ox.clearRect(0,0,o.cw,o.ch);
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
  e.draw=function(dt){
    cx.clearRect(0,0,o.cw,o.ch);
    if(level>.01&&cells.length){
      var pulse=.5+.5*Math.sin(t*.8)+.25*Math.sin(t*2.3+1);
      blots(false);cx.globalCompositeOperation='source-over';cx.drawImage(off,0,0);
      blots(true);cx.globalCompositeOperation='lighter';cx.drawImage(off,0,0);
      var gx=o.mx+o.mw*.5,gy=o.my+o.mh*.52,g=cx.createRadialGradient(gx,gy,10*o.k,gx,gy,o.mw*.46);      // the whole pit breathes a little
      g.addColorStop(0,'rgba(255,120,30,'+((.05+.05*pulse)*level).toFixed(3)+')');g.addColorStop(1,'rgba(255,90,10,0)');
      cx.globalCompositeOperation='lighter';cx.fillStyle=g;cx.fillRect(o.mx,o.my,o.mw,o.mh);cx.globalCompositeOperation='source-over';
    }
    if(level>.05&&Math.random()<dt*(1.2+3*level))smoke.push({x:o.sx0+Math.random()*(o.sx1-o.sx0),y:o.sy+Math.random()*20*o.k,vx:(6+Math.random()*10)*o.k,vy:-(14+Math.random()*14)*o.k,life:0,max:3.6+Math.random()*2.6,r:(7+Math.random()*7)*o.k,k:level});
    for(var i=smoke.length-1;i>=0;i--){var p=smoke[i];p.life+=dt;if(p.life>=p.max){smoke.splice(i,1);continue;}
      p.x+=(p.vx+Math.sin(p.life*1.7+i)*6*o.k)*dt;p.y+=p.vy*dt;var f=p.life/p.max,rr=p.r*(1+f*2.8),al=.24*p.k*Math.sin(Math.min(1,f*3)*Math.PI/2)*(1-f);
      var gg=cx.createRadialGradient(p.x,p.y,0,p.x,p.y,rr);gg.addColorStop(0,'rgba(215,210,205,'+al.toFixed(3)+')');gg.addColorStop(1,'rgba(215,210,205,0)');cx.fillStyle=gg;cx.beginPath();cx.arc(p.x,p.y,rr,0,Math.PI*2);cx.fill();}
    return smoke.length>0;
  };
  return e;
}

var kitchen=null;
function build(){
  var sc0=document.getElementById('scene');if(!sc0)return false;
  var patch=document.createElement('img');patch.src='assets/effects/grill_coals_off.webp?v=1';patch.draggable=false;
  patch.style.cssText='position:absolute;left:230px;top:18px;width:540px;height:147px;opacity:1;transition:opacity 1.6s ease;pointer-events:none;z-index:2';
  kitchen=makeEffect({cx:230,cy:0,cw:540,ch:165,mx:0,my:18,mw:540,mh:147,mask:'assets/effects/grill_embers_mask.png?v=1',n:90,k:1,sx0:60,sx1:480,sy:54,patch:patch});
  kitchen.cv.style.cssText='position:absolute;left:230px;top:0;width:540px;height:165px;pointer-events:none;z-index:3';
  sc0.appendChild(patch);sc0.appendChild(kitchen.cv);effects.push(kitchen);return true;
}
/* the close-up of the grill: the canvas goes into the view (kitchen-fixtures.js) and follows the picture of the grill (same transform and opacity) */
function zoomEffect(){
  var e=makeEffect({cx:190,cy:0,cw:1220,ch:500,mx:15,my:322,mw:1187,mh:160,mask:'assets/effects/grill_zoom_mask.png?v=1',n:170,k:2.3,sx0:150,sx1:1100,sy:330,cls:'gz-fx'});
  e.cv.style.cssText='position:absolute;left:'+(190/1672*100)+'%;top:0;width:'+(1220/1672*100)+'%;height:'+(500/941*100)+'%;pointer-events:none;opacity:0';
  e.zoom=true;effects.push(e);kick();return e.cv;
}

function frame(now){
  var dt=Math.min(.05,(now-last)/1000||.016);last=now;t+=dt;
  if(left>0){left-=dt;if(left<=0){left=0;target=0;}else if(left<25)target=Math.max(0,left/25);}
  level+=(target-level)*Math.min(1,dt*(target>level?1.4:.6));if(Math.abs(target-level)<.004)level=target;
  var more=false;
  effects=effects.filter(function(e){return !e.zoom||e.cv.isConnected;});
  effects.forEach(function(e){if(e.patch)e.patch.style.opacity=String(Math.max(0,1-Math.min(1,level*1.25)));if(e.draw(dt))more=true;});
  if(level>0||target>0||more||effects.some(function(e){return e.zoom;}))requestAnimationFrame(frame);else run=false;
}
function kick(){if(!run){run=true;last=performance.now();requestAnimationFrame(frame);}}
function set(on,sec){
  if(!kitchen&&!build())return;
  if(on){target=1;left=Math.min(MAXB,(left>0?left:0)+(sec||BURN));}else{target=0;left=0;}
  kick();
}
function start(){if(!kitchen)build();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else setTimeout(start,0);
setInterval(function(){if(kitchen&&!kitchen.cv.isConnected){effects=effects.filter(function(e){return e!==kitchen;});kitchen=null;}if(!kitchen)build();},2000);
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
window.CooksterGrill={set:set,lit:function(){return target>0;},left:function(){return left;},zoomCanvas:zoomEffect,zoomSrc:function(lit){return lit?'assets/grill_zoom.webp?v=2':'assets/grill_zoom_off.webp?v=1';}};
})();
