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
 '#ppLayer .pp-stream{position:absolute;width:4px;margin-left:-2px;border-radius:2px;background:repeating-linear-gradient(180deg,rgba(214,238,252,.95) 0 7px,rgba(150,205,235,.8) 7px 13px);background-size:100% 13px;animation:ppflow .35s linear infinite;box-shadow:0 0 3px rgba(255,255,255,.6)}'+
 '#ppLayer .pp-rip{position:absolute;width:26px;height:10px;margin:-5px 0 0 -13px;border:1.5px solid rgba(215,238,250,.9);border-radius:50%;animation:pprip .7s ease-out infinite}'+
 '@keyframes ppflow{to{background-position:0 13px}}@keyframes pprip{from{transform:scale(.3);opacity:.9}to{transform:scale(2.2);opacity:0}}';
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
  var st=document.createElement('div');st.className='pp-stream';var rp=document.createElement('div');rp.className='pp-rip';
  L.appendChild(st);L.appendChild(rp);L.appendChild(img);
  pour={el:el,tr:tr,W:W,img:img,stream:st,rip:rp,level:+el.dataset.water||0,used:0,last:performance.now(),acc:0,tilted:false};
  document.body.classList.add('pitcher-pouring');
  try{if(typeof playImpactSound==='function')playImpactSound(el,'pour');}catch(e){}
  place();requestAnimationFrame(frame);
}
function place(){
  var p=pour;if(!p)return;
  var x=mouse.x,y=mouse.y;                                     // the tip of the spout is at the mouse
  p.img.style.left=(x-SPOUT_X*p.W)+'px';p.img.style.top=(y-SPOUT_Y*p.W)+'px';
  if(!p.tilted){p.tilted=true;requestAnimationFrame(function(){if(pour===p)p.img.style.transform='rotate('+TILT+'deg)';});}
  var tr=p.tr,r=tr.getBoundingClientRect(),surf=r.top+r.height*.55,h=Math.max(8,surf-y);
  p.stream.style.left=x+'px';p.stream.style.top=y+'px';p.stream.style.height=h+'px';
  p.rip.style.left=x+'px';p.rip.style.top=surf+'px';
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
    if(p.acc>=1){try{CooksterFlour.addWater(tr,p.acc);}catch(e){}p.acc=0;}
  }
  if(p.used>=p.level-.0005){try{showToast('Bokal je prazan.');}catch(e){}stop();return;}
  place();requestAnimationFrame(frame);
}
function stop(){
  var p=pour;if(!p)return;pour=null;
  if(p.acc>0){try{CooksterFlour.addWater(p.tr,p.acc);}catch(e){}}
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
