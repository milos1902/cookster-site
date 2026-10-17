/* Cookster: the fire in the firebox (the stove) is a short video (Higgsfield), cut into three parts (assets/effects/loziste/):
   fire_start (.webm / .mp4) - the wood catches (plays once when the fire is lit), fire_loop - the fire burns (seamless loop), fire_end - the flames die down and only the embers stay.
   The picture is put over the firebox opening only (a little bigger than the opening, soft edges, so the glow of the fire is also seen on the edge of the firebox; the frame itself stays as it is). After the fire is out the last picture (the embers) stays (it is kept in localStorage, so a new visit shows it too).
   js/game.js calls CooksterFireboxFire.set(true/false) whenever the fire is lit / put out (updateFireboxEffects). No sound: the sound is made elsewhere. */
(function(){
if(window.CooksterFireboxFire)return;
var POLY='polygon(1285.246px 444.038px,1359.308px 445.600px,1352.121px 534.975px,1281.183px 536.225px)',
    X=1281.67,Y=440.56,W=80.67,H=98.9,EMB='cooksterFireEmbers',
    MASK=(function(){var g=function(d,f1,f2){return 'linear-gradient(to '+d+',transparent,#000 '+f1+'px,#000 calc(100% - '+f2+'px),transparent)';},
      mm=g('right',10,10)+','+g('bottom',9,7);      // soft edges (10 px): the picture melts into the painted firebox, no hard border
      return '-webkit-mask-image:'+mm+';-webkit-mask-composite:source-in;mask-image:'+mm+';mask-composite:intersect;filter:blur(.6px) saturate(.95);';})(),
    mode='',box=null,V={};
function mk(name,file,loop){
  var v=document.createElement('video'),base='assets/effects/loziste/'+file;[['webm','video/webm'],['mp4','video/mp4']].forEach(function(t){var so=document.createElement('source');so.src=base+'.'+t[0]+'?v=2';so.type=t[1];v.appendChild(so);});v.muted=true;v.defaultMuted=true;v.playsInline=true;v.loop=!!loop;v.preload='auto';v.setAttribute('aria-hidden','true');
  v.style.cssText='position:absolute;left:'+X+'px;top:'+Y+'px;width:'+W+'px;height:'+H+'px;pointer-events:none;opacity:0;transition:opacity .6s ease-in-out;'+MASK;
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
/* the little window of the closed door: the same fire (the loop) in it, ABOVE the dark of the night, so that it really shines at night (day: calmer) */
var GP='polygon(1299.860px 460.257px,1362.048px 459.945px,1358.923px 508.070px,1298.610px 507.445px)',gbox=null,gv=null,gOn=false;
function buildGlass(){var sc=document.getElementById('scene');if(!sc)return false;if(gbox&&gbox.parentNode===sc)return true;
  gbox=document.createElement('div');gbox.id='fireboxGlassVideo';gbox.setAttribute('aria-hidden','true');
  gbox.style.cssText='position:absolute;inset:0;pointer-events:none;z-index:90003;opacity:0;transition:opacity .5s ease-in-out;clip-path:'+GP;
  gv=document.createElement('video');[['webm','video/webm'],['mp4','video/mp4']].forEach(function(t){var so=document.createElement('source');so.src='assets/effects/loziste/fire_loop.'+t[0]+'?v=2';so.type=t[1];gv.appendChild(so);});
  gv.muted=true;gv.defaultMuted=true;gv.loop=true;gv.playsInline=true;gv.preload='auto';
  gv.style.cssText='position:absolute;left:'+X+'px;top:'+Y+'px;width:'+W+'px;height:'+H+'px;pointer-events:none';      // the same place and size as the fire in the open firebox: the window shows the real flame behind it
  gbox.appendChild(gv);sc.appendChild(gbox);return true;}
function glass(on){if(!buildGlass())return;on=!!on;if(on===gOn)return;gOn=on;gbox.style.opacity=on?'1':'0';if(on){try{var p=gv.play();if(p&&p.catch)p.catch(function(){});}catch(e){}}else setTimeout(function(){if(!gOn)try{gv.pause();}catch(e){}},600);}
(function gl(){requestAnimationFrame(gl);if(!gOn||!gv)return;var n=0;try{n=Math.max(0,Math.min(1,CooksterDay.phase().dark/.3));}catch(e){}
  var t=performance.now()/1000,f=1+.05*Math.sin(t*9.3)+.04*Math.sin(t*14.1+1.7);gv.style.filter='brightness('+((.62+.62*n)*f).toFixed(3)+') saturate('+(1+.15*n).toFixed(2)+')';})();
function show(name){for(var k in V)V[k].style.opacity=(k===name)?'1':'0';}
function play(v){try{var p=v.play();if(p&&p.catch)p.catch(function(){});}catch(e){}}
/* a very small flicker of the light on the burning fire, so that the short loop does not look like a loop */
(function fl(){requestAnimationFrame(fl);if(mode!=='loop'||!V.loop)return;var t=performance.now()/1000,b=1+.05*Math.sin(t*9.3)+.04*Math.sin(t*14.1+1.7)+.03*Math.sin(t*23.7+.4);V.loop.style.filter='blur(.6px) saturate(.95) brightness('+b.toFixed(3)+')';})();
function goLoop(){mode='loop';V.loop.currentTime=0;play(V.loop);show('loop');setTimeout(function(){if(mode==='loop'){V.start.pause();}},400);}
function embersShow(){      // the fire has burnt out: the last picture of the last part (embers)
  var v=V.end,f=function(){try{v.currentTime=Math.max(0,(v.duration||3.5)-.04);}catch(e){}v.pause();show('end');};
  if(v.readyState>=1)f();else v.addEventListener('loadedmetadata',f,{once:true});
}
function set(live,open){
  glass(!!live&&!open);
  if(!build())return;
  live=!!live;
  if(live){
    if(mode==='loop'||mode==='start')return;
    try{localStorage.removeItem(EMB);}catch(e){}
    if(mode===''){goLoop();return;}      // the page was opened with the fire already burning
    var warm=(mode==='embers'||mode==='end');      // the embers are already there: the wood catches without the cold start (the picture of the cold coals), the flames come up from the embers
    mode='start';try{V.start.currentTime=warm?.85:0;}catch(e){}play(V.start);show('start');return;
  }
  if(mode==='loop'||mode==='start'){mode='end';V.end.currentTime=0;play(V.end);show('end');return;}
  if(mode===''){var e=false;try{e=localStorage.getItem(EMB)==='1';}catch(x){}
    if(e){mode='embers';embersShow();}else{mode='cold';show('');}}
}
window.CooksterFireboxFire={set:set,mode:function(){return mode;}};
})();
