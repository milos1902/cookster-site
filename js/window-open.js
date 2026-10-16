/* Cookster: the window of the kitchen opens with a click (an animation of the sash swinging into the room).
   assets/effects/prozor_otvoren.webp is a piece of the picture with the window wide open, laid over the kitchen only around the window (the rest of the scene is untouched).
   At night the window is shown closed (the night picture of js/day-light.js has no open version), so the piece fades with the "night" value of the clock. */
(function(){
if(window.CooksterWindow)return;
var KEY='cooksterWindowOpen',W=176,H=440,open=false,anim=null,box=null,inner=null,hot=null,sash2=null,S2X=-62;
try{open=localStorage.getItem(KEY)==='1';}catch(e){}
function build(){
  var sc=document.getElementById('scene');if(!sc)return false;
  if(box&&box.parentNode===sc)return true;
  box=document.createElement('div');box.id='windowOpen';
  box.style.cssText='position:absolute;left:0;top:0;width:'+W+'px;height:'+H+'px;pointer-events:none;z-index:1;transform-origin:0 40%;will-change:transform,opacity;opacity:'+(open?1:0);
  inner=document.createElement('div');inner.style.cssText='position:absolute;inset:0;background:url(assets/effects/prozor_otvoren.webp?v=1) 0 0/100% 100% no-repeat';
  box.appendChild(inner);
  /* the second sash: the same sash, mirrored, on the left side of the opening (so both wings are open) */
  sash2=document.createElement('div');
  sash2.style.cssText='position:absolute;left:'+S2X+'px;top:0;width:150px;height:250px;transform:scaleX(-1);transform-origin:50% 0;background:url(assets/effects/prozor_otvoren.webp?v=1) 0 0/'+W+'px '+H+'px no-repeat;clip-path:polygon(14px 0,118px 0,148px 238px,92px 216px,14px 24px);filter:brightness(.92)';
  box.appendChild(sash2);sc.appendChild(box);
  hot=document.createElement('div');hot.id='windowHot';hot.title='Otvori / zatvori prozor';
  hot.style.cssText='position:absolute;left:0;top:0;width:112px;height:300px;z-index:6;cursor:pointer;clip-path:polygon(0 0,100% 0,100% 62%,60% 100%,0 100%)';
  hot.addEventListener('click',function(e){e.stopPropagation();toggle();});
  sc.appendChild(hot);return true;
}
function toggle(){set(!open,true);}
function set(v,animate){
  if(!build())return;open=!!v;try{localStorage.setItem(KEY,open?'1':'0');}catch(e){}
  if(anim){try{anim.cancel();}catch(e){}anim=null;}
  if(!animate||!box.animate){box.style.opacity=open?1:0;box.style.transform='';return;}
  var from=open?{opacity:0,transform:'perspective(500px) rotateY(-75deg) scaleX(.6)'}:{opacity:1,transform:'none'},
      to=open?{opacity:1,transform:'none'}:{opacity:0,transform:'perspective(500px) rotateY(-75deg) scaleX(.6)'};
  box.style.opacity=open?1:0;box.style.transform='';
  anim=box.animate([from,to],{duration:open?750:600,easing:open?'cubic-bezier(.2,.8,.25,1)':'ease-in'});
}
function tick(){      // at night the window is closed on the picture
  if(!build())return;var D=window.CooksterDay,nw=0;try{nw=D&&D.phase?D.phase().nw:0;}catch(e){}
  inner.style.opacity=sash2.style.opacity=String(Math.max(0,Math.min(1,1-nw)).toFixed(2));
}
setInterval(tick,400);
window.addEventListener('load',function(){setTimeout(function(){build();tick();},300);});
window.CooksterWindow={toggle:toggle,set:function(v){set(v,true);},isOpen:function(){return open;}};
})();
