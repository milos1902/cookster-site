/* Cookster: the window of the kitchen opens with a click. By day a short clip plays (assets/effects/prozor_otvaranje.mp4, made in Higgsfield from the closed and the open picture of the kitchen):
   the sash swings open, pushes the flowerpot off the sill, it falls and breaks (soil, shards, petals) and the mess is gone after a few seconds. The clip lies over the kitchen only around the window
   (the mask prozor_otvaranje_maska.png feathers its edges) and fades out into the still picture of the open window (below). Closing the window brings the flowerpot back (it is a part of the kitchen picture).
   assets/effects/prozor_otvoren.webp is a piece of the picture with the window wide open, laid over the kitchen only around the window (the rest of the scene is untouched).
   At night the window is shown closed (the night picture of js/day-light.js has no open version), so the piece fades with the "night" value of the clock. */
(function(){
if(window.CooksterWindow)return;
var KEY='cooksterWindowOpen',W=176,H=440,open=false,anim=null,box=null,inner=null,hot=null,lvl=open?1:0,vid=null,vidT=0,CLIP_W=380,CLIP_H=500,BREAK_AT=2.15;
try{open=localStorage.getItem(KEY)==='1';}catch(e){}
function build(){
  var sc=document.getElementById('scene');if(!sc)return false;
  if(box&&box.parentNode===sc)return true;
  box=document.createElement('div');box.id='windowOpen';
  box.style.cssText='position:absolute;left:0;top:0;width:'+W+'px;height:'+H+'px;pointer-events:none;z-index:1;transform-origin:0 40%;will-change:transform,opacity;opacity:'+(open?1:0);
  inner=document.createElement('div');inner.style.cssText='position:absolute;inset:0;background:url(assets/effects/prozor_otvoren.webp?v=4) 0 0/100% 100% no-repeat';
  box.appendChild(inner);
  sc.appendChild(box);
  vid=document.createElement('video');vid.id='windowOpenClip';vid.muted=true;vid.playsInline=true;vid.preload='auto';vid.setAttribute('playsinline','');
  [['assets/effects/prozor_otvaranje.webm?v=1','video/webm'],['assets/effects/prozor_otvaranje.mp4?v=1','video/mp4']].forEach(function(x){var so=document.createElement('source');so.src=x[0];so.type=x[1];vid.appendChild(so);});
  vid.style.cssText='position:absolute;left:0;top:0;width:'+CLIP_W+'px;height:'+CLIP_H+'px;object-fit:fill;pointer-events:none;z-index:2;opacity:0;-webkit-mask-image:url(assets/effects/prozor_otvaranje_maska.png);mask-image:url(assets/effects/prozor_otvaranje_maska.png);-webkit-mask-size:100% 100%;mask-size:100% 100%';
  sc.appendChild(vid);
  vid.addEventListener('timeupdate',function(){if(open&&!broke&&vid.currentTime>=BREAK_AT){broke=true;try{if(typeof playImpactSound==='function'&&hot)playImpactSound(hot,'break');}catch(e){}}});
  vid.addEventListener('ended',endClip);
  hot=document.createElement('div');hot.id='windowHot';hot.title='Otvori / zatvori prozor';
  hot.dataset.soundTarget='windowHot';hot.dataset.soundActions='open,close,break';hot.dataset.label='Prozor';
  hot.style.cssText='position:absolute;left:0;top:0;width:112px;height:300px;z-index:6;cursor:pointer;clip-path:polygon(0 0,100% 0,100% 62%,60% 100%,0 100%)';
  hot.addEventListener('click',function(e){e.stopPropagation();toggle();});
  sc.appendChild(hot);return true;
}
function toggle(){set(!open,true);}
function endClip(){if(!vid)return;clearTimeout(vidT);vid.style.transition='opacity .45s ease';vid.style.opacity='0';}
function stopClip(){if(!vid)return;clearTimeout(vidT);try{vid.pause();}catch(e){}vid.style.transition='none';vid.style.opacity='0';}
function night(){var D=window.CooksterDay;try{return D&&D.phase?D.phase().nw:0;}catch(e){return 0;}}
function set(v,animate){
  if(!build())return;var was=open;open=!!v;try{localStorage.setItem(KEY,open?'1':'0');}catch(e){}
  stopClip();broke=false;
  box.style.opacity=open?1:0;box.style.transform='';
  try{if(typeof playImpactSound==='function'&&hot)playImpactSound(hot,open?'open':'close');}catch(e){}
  if(open&&!was&&animate&&night()<.3){      // by day: the clip with the flowerpot; at night the window is only switched (the night picture has no clip)
    try{vid.currentTime=0;}catch(e){}
    vid.style.transition='none';vid.style.opacity='1';
    var pr=vid.play();if(pr&&pr.catch)pr.catch(function(){endClip();});
    vidT=setTimeout(endClip,4800);      // in case "ended" does not come
  }
}
function tick(){      // at night the window is closed on the picture
  if(!build())return;var D=window.CooksterDay,nw=0;try{nw=D&&D.phase?D.phase().nw:0;}catch(e){}
  inner.style.opacity=String(Math.max(0,Math.min(1,1-nw)).toFixed(2));
}
setInterval(tick,400);
setInterval(function(){var t=open?1:0;if(Math.abs(t-lvl)>.001){lvl+=(t-lvl)*.06;if(Math.abs(t-lvl)<.01)lvl=t;}},40);      // the light of the room follows the window slowly (about 1.5 s)
window.addEventListener('load',function(){setTimeout(function(){build();tick();},300);});
window.CooksterWindow={toggle:toggle,set:function(v){set(v,true);},isOpen:function(){return open;},level:function(){return lvl;}};
})();
