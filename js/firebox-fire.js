/* Cookster: the fire in the firebox (the stove) is a short video (Higgsfield), cut into three parts (assets/effects/loziste/):
   fire_start (.webm / .mp4) - the wood catches (plays once when the fire is lit), fire_loop - the fire burns (seamless loop), fire_end - the flames die down and only the embers stay.
   The picture is put over the firebox opening only (a little bigger than the opening, soft edges, so the glow of the fire is also seen on the edge of the firebox; the frame itself stays as it is). After the fire is out the last picture (the embers) stays (it is kept in localStorage, so a new visit shows it too).
   js/game.js calls CooksterFireboxFire.set(true/false) whenever the fire is lit / put out (updateFireboxEffects). No sound: the sound is made elsewhere. */
(function(){
if(window.CooksterFireboxFire)return;
var POLY='polygon(1285.246px 444.038px,1359.308px 445.600px,1352.121px 534.975px,1281.183px 536.225px)',
    X=1281.67,Y=440.56,W=80.67,H=98.9,EMB='cooksterFireEmbers',
    FE='4px',MASK='-webkit-mask-image:linear-gradient(to right,transparent,#000 '+'4px'+',#000 calc(100% - 4px),transparent),linear-gradient(to bottom,transparent,#000 4px,#000 calc(100% - 4px),transparent);-webkit-mask-composite:source-in;mask-image:linear-gradient(to right,transparent,#000 4px,#000 calc(100% - 4px),transparent),linear-gradient(to bottom,transparent,#000 4px,#000 calc(100% - 4px),transparent);mask-composite:intersect;',mode='',box=null,V={};
function mk(name,file,loop){
  var v=document.createElement('video'),base='assets/effects/loziste/'+file;[['webm','video/webm'],['mp4','video/mp4']].forEach(function(t){var so=document.createElement('source');so.src=base+'.'+t[0]+'?v=1';so.type=t[1];v.appendChild(so);});v.muted=true;v.defaultMuted=true;v.playsInline=true;v.loop=!!loop;v.preload='auto';v.setAttribute('aria-hidden','true');
  v.style.cssText='position:absolute;left:'+X+'px;top:'+Y+'px;width:'+W+'px;height:'+H+'px;pointer-events:none;opacity:0;transition:opacity .35s ease-out;'+MASK;
  box.appendChild(v);V[name]=v;return v;
}
function build(){
  var sc=document.getElementById('scene');if(!sc)return false;
  if(box&&box.parentNode===sc)return true;
  box=document.createElement('div');box.id='fireboxVideoFire';box.setAttribute('aria-hidden','true');
  box.style.cssText='position:absolute;inset:0;pointer-events:none;z-index:1199;';      // above the picture of the firebox, under the door
  sc.appendChild(box);mk('start','fire_start',false);mk('loop','fire_loop',true);mk('end','fire_end',false);
  V.start.addEventListener('ended',function(){if(mode==='start')goLoop();});
  V.end.addEventListener('ended',function(){if(mode==='end'){mode='embers';try{localStorage.setItem(EMB,'1');}catch(e){}}});
  return true;
}
function show(name){for(var k in V)V[k].style.opacity=(k===name)?'1':'0';}
function play(v){try{var p=v.play();if(p&&p.catch)p.catch(function(){});}catch(e){}}
function goLoop(){mode='loop';V.loop.currentTime=0;play(V.loop);show('loop');setTimeout(function(){if(mode==='loop'){V.start.pause();}},400);}
function embersShow(){      // the fire has burnt out: the last picture of the last part (embers)
  var v=V.end,f=function(){try{v.currentTime=Math.max(0,(v.duration||3.5)-.04);}catch(e){}v.pause();show('end');};
  if(v.readyState>=1)f();else v.addEventListener('loadedmetadata',f,{once:true});
}
function set(live){
  if(!build())return;
  live=!!live;
  if(live){
    if(mode==='loop'||mode==='start')return;
    try{localStorage.removeItem(EMB);}catch(e){}
    if(mode===''){goLoop();return;}      // the page was opened with the fire already burning
    mode='start';V.start.currentTime=0;play(V.start);show('start');return;
  }
  if(mode==='loop'||mode==='start'){mode='end';V.end.currentTime=0;play(V.end);show('end');return;}
  if(mode===''){var e=false;try{e=localStorage.getItem(EMB)==='1';}catch(x){}
    if(e){mode='embers';embersShow();}else{mode='cold';show('');}}
}
window.CooksterFireboxFire={set:set,mode:function(){return mode;}};
})();
