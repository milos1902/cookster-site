/* Pouring from the pitcher (bokal_stari) into the kneading trough, written from the beginning in a simple way.
   With the pitcher in the hand: LEFT button held while the mouse is over the trough = the pitcher tilts and the water runs into the trough; release = stops.
   The RIGHT button puts the pitcher down as always.
   The picture of the pitcher in the hand is NOT touched (the game builds copies of it and that went wrong before): while pouring it is hidden and
   one separate tilted picture follows the mouse. The water stream is one thin strip falling straight down from the tip of the spout.
   The water of the pitcher is written once, when the pouring stops (so the game does not rebuild the pitcher in the hand 60 times a second). */
(function(){
'use strict';
if(window.CooksterPitcherPour)return;
var ID='bokal_stari',PIC='assets/antique_water_pitcher.png',RATE=.11,TILT=-62,SPOUT_X=.209,SPOUT_Y=.204;   // RATE: the part of the pitcher that runs out in one second
var mouse={x:0,y:0},pour=null,swallow=false;
var css=document.createElement('style');
css.textContent='body.pitcher-pouring .placement-ghost{clip-path:inset(50%)!important}'+
 '#ppLayer{position:fixed;left:0;top:0;width:0;height:0;pointer-events:none;z-index:2147483000}'+
 '#ppLayer img{position:absolute;transform-origin:30% 15%;transition:transform .22s ease;user-select:none;-webkit-user-drag:none}'+
 '#ppLayer canvas{position:fixed;left:0;top:0;pointer-events:none}';
document.head.appendChild(css);
function held(){return typeof holding!=='undefined'?holding:null;}
function isPitcher(el){return !!el&&el.dataset&&el.dataset.itemId===ID;}
function troughUnder(x,y){
  try{var s=screenToScene(x,y);return window.CooksterFlour&&CooksterFlour.troughAt?CooksterFlour.troughAt(s.x,s.y):null;}catch(e){return null;}
}
function layer(){var l=document.getElementById('ppLayer');if(!l){l=document.createElement('div');l.id='ppLayer';document.body.appendChild(l);}return l;}
function start(el,tr){
  var g=typeof placementGhost!=='undefined'?placementGhost:null,gr=g&&g.getBoundingClientRect(),W=(gr&&gr.width)||el.getBoundingClientRect().width||150;
  var L=layer(),img=document.createElement('img');img.src=PIC;img.draggable=false;img.style.width=W+'px';img.style.height=W+'px';
  var cv=document.createElement('canvas');cv.width=innerWidth;cv.height=innerHeight;L.appendChild(cv);L.appendChild(img);
  pour={el:el,tr:tr,W:W,img:img,cv:cv,cx:cv.getContext('2d'),parts:[],sx:0,sy:0,ly:0,t:0,level:+el.dataset.water||0,used:0,last:performance.now(),acc:0,tilted:false,dropAt:0};
  document.body.classList.add('pitcher-pouring');
  try{if(typeof playImpactSound==='function')playImpactSound(el,'pour');}catch(e){}
  place();requestAnimationFrame(frame);
}
function place(){
  var p=pour;if(!p)return;
  var x=mouse.x,y=mouse.y;                                     // the tip of the spout is at the mouse
  p.img.style.left=(x-SPOUT_X*p.W)+'px';p.img.style.top=(y-SPOUT_Y*p.W)+'px';
  if(!p.tilted){p.tilted=true;requestAnimationFrame(function(){if(pour===p)p.img.style.transform='rotate('+TILT+'deg)';});}
  var r=p.tr.getBoundingClientRect();p.sx=x;p.sy=y;p.ly=Math.max(y+10,r.top+r.height*.55);
}
/* the picture of the water: a stream that thins and wobbles with a moving shine, drops beside it, a splash and rings on the water of the trough */
function draw(p,dt){
  var c=p.cx;c.clearRect(0,0,p.cv.width,p.cv.height);
  if(!p.img.style.transform)return;
  p.t+=dt;var t=p.t,sx=p.sx,sy=p.sy,ly=p.ly,H=ly-sy,i,y,k;
  var grow=Math.min(1,t/.35);                                   // the stream grows out of the spout
  var yEnd=sy+H*grow;
  // the stream: a thin body that gets narrower while it falls
  var step=5,L=[],R=[],C=[];
  for(y=sy;y<=yEnd;y+=step){
    var f=(y-sy)/Math.max(1,H),w=(5.4-2*f)*(1+.1*Math.sin(y*.11-t*22)),x=sx+Math.sin(y*.045-t*9)*.7*f;
    L.push([x-w/2,y]);R.push([x+w/2,y]);C.push([x,y]);
  }
  if(L.length>1){
    c.save();c.shadowColor='rgba(120,185,225,.55)';c.shadowBlur=5;
    c.beginPath();c.moveTo(L[0][0],L[0][1]);for(i=1;i<L.length;i++)c.lineTo(L[i][0],L[i][1]);for(i=R.length-1;i>=0;i--)c.lineTo(R[i][0],R[i][1]);c.closePath();
    var g=c.createLinearGradient(sx-4,0,sx+4,0);g.addColorStop(0,'rgba(150,200,232,.78)');g.addColorStop(.45,'rgba(225,244,255,.92)');g.addColorStop(1,'rgba(120,175,215,.78)');
    c.fillStyle=g;c.fill();c.restore();
    // the shine: short bright streaks that run down
    c.save();c.lineCap='round';c.strokeStyle='rgba(255,255,255,.85)';c.lineWidth=1.2;c.setLineDash([9,16]);c.lineDashOffset=-t*210;
    c.beginPath();c.moveTo(C[0][0]-.8,C[0][1]);for(i=1;i<C.length;i++)c.lineTo(C[i][0]-.8,C[i][1]);c.stroke();c.restore();
    // the drop that hangs at the lip of the spout
    c.beginPath();c.ellipse(sx,sy+1,3.4,3,0,0,7);c.fillStyle='rgba(205,236,252,.95)';c.fill();
  }
  // drops that jump off the stream and fall beside it
  if(t-p.dropAt>.06&&p.parts.length<70){p.dropAt=t;var dy=sy+H*(.2+Math.random()*.7);p.parts.push({k:0,x:sx+(Math.random()-.5)*6,y:dy,vx:(Math.random()-.5)*26,vy:40+Math.random()*60,life:.55,r:1+Math.random()*.9});}
  // the splash where it lands: small drops jump up and fall back
  if(grow>=1&&p.parts.length<70){for(k=0;k<2;k++)p.parts.push({k:1,x:sx+(Math.random()-.5)*8,y:ly,vx:(Math.random()-.5)*95,vy:-(70+Math.random()*120),life:.5,r:1.1+Math.random()*1.3});}
  for(i=p.parts.length-1;i>=0;i--){
    var q=p.parts[i];q.life-=dt;if(q.life<=0){p.parts.splice(i,1);continue;}
    q.vy+=620*dt;q.x+=q.vx*dt;q.y+=q.vy*dt;
    c.globalAlpha=Math.min(1,q.life*2.2)*(q.k?.9:.7);c.fillStyle='rgb(222,243,255)';c.beginPath();c.arc(q.x,q.y,q.r,0,7);c.fill();
  }
  c.globalAlpha=1;
  // rings on the water of the trough
  if(grow>=1){for(k=0;k<3;k++){var ph=(t*1.5+k/3)%1,rx=6+38*ph;c.globalAlpha=(1-ph)*.75;c.strokeStyle='rgba(225,244,255,1)';c.lineWidth=1.4*(1-ph*.5);c.beginPath();c.ellipse(sx,ly,rx,rx*.36,0,0,7);c.stroke();}c.globalAlpha=1;}
}
function frame(now){
  var p=pour;if(!p)return;
  if(held()!==p.el){stop();return;}
  var tr=troughUnder(mouse.x,mouse.y);
  if(!tr){stop();return;}                                       // the spout is not over the trough any more: it stops
  p.tr=tr;
  var dt=Math.min(.05,(now-p.last)/1000);p.last=now;
  if(p.img.style.transform){                                     // the water runs only when the pitcher is tilted
    var use=Math.min(p.level-p.used,RATE*dt);p.used+=use;p.acc+=use*100;
    if(p.acc>=1){try{CooksterFlour.addWater(tr,p.acc,+p.el.dataset.waterTemp||15);}catch(e){}p.acc=0;}
  }
  if(p.used>=p.level-.0005){try{showToast('Bokal je prazan.');}catch(e){}stop();return;}
  place();draw(p,dt);requestAnimationFrame(frame);
}
function stop(){
  var p=pour;if(!p)return;pour=null;
  if(p.acc>0){try{CooksterFlour.addWater(p.tr,p.acc,+p.el.dataset.waterTemp||15);}catch(e){}}
  var l=document.getElementById('ppLayer');if(l)l.innerHTML='';
  document.body.classList.remove('pitcher-pouring');
  var left=Math.max(0,p.level-p.used);
  try{CooksterVesselWater.set(p.el,left);}catch(e){p.el.dataset.water=String(left);}
  try{CooksterSave.schedule();}catch(e){}
}
window.addEventListener('pointermove',function(e){mouse.x=e.clientX;mouse.y=e.clientY;},true);
window.addEventListener('pointerdown',function(e){
  var h=held();if(!isPitcher(h))return;
  if(e.button===2){stop();return;}                              // the game puts the pitcher down
  if(e.button!==0||pour)return;
  if(e.target&&e.target.closest&&e.target.closest('#hud,[data-tool-ui],.cookster-ctx,#toolDock'))return;
  mouse.x=e.clientX;mouse.y=e.clientY;
  var tr=troughUnder(e.clientX,e.clientY);if(!tr||(+h.dataset.water||0)<=.004)return;   // not over the trough or empty: the normal click
  e.stopImmediatePropagation();e.preventDefault();swallow=true;start(h,tr);
},true);
window.addEventListener('pointerup',function(e){if(pour&&e.button===0){e.stopImmediatePropagation();stop();}},true);
window.addEventListener('click',function(e){if(swallow&&e.button===0){swallow=false;e.stopImmediatePropagation();}},true);
window.addEventListener('blur',stop);
document.addEventListener('visibilitychange',function(){if(document.hidden)stop();});
window.CooksterPitcherPour={stop:stop,active:function(){return !!pour;}};
})();
