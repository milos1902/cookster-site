/* Cookster: sarmas in VESSELS (bowls, deep plates, pots...). With a sarma in the hand (a rolled one from js/sarma.js, or a finished one taken out of the tray)
   a click on a vessel puts it there EXACTLY where the click is (no snapping, no pushing, no physics): it stays where it was put, turned the way it was turned in the hand.
   At most TEN sarmas fit into one vessel. With empty hands a click on a sarma in a vessel takes it out again (a click anywhere else on the vessel takes the whole vessel, with its sarmas).
   The sarmas are drawn on a canvas on top of the vessel (so they travel with it); doneness (colour / baked picture) is kept per sarma. The round tray (Okrugli pleh) has its own system (js/sarma-tray.js).
   Not saved in the save file yet. */
(function(){
'use strict';
if(window.CooksterSarmaVessel)return;
var MAXV=10,LEN={f:59,g:63},ASP={f:.46,g:.43},SC=2;      // local px of the vessel (the picture of the tray is 190 wide, a sarma is .31 / .33 of it)
function T(){return window.CooksterSarmaTray||null;}
function toast(m){try{showToast(m);}catch(e){}}
function isTray(it){return !!it&&it.dataset&&it.dataset.itemId==='kal_01_okrugli_pleh';}
function isVessel(it){try{return !!it&&!isTray(it)&&isContainerItem(it);}catch(e){return false;}}
function sys(el){return el._sarmaV||(el._sarmaV={list:[],cv:null});}
function heldInfo(){      // what sarma (if any) is in the hand: {el,set,d,rot}
  try{
    var h=holding;if(!h||!h.dataset)return null;
    if(h.dataset.sarmaRolled==='1'){return {el:h,set:(h._sm&&h._sm.set&&h._sm.set.pre)||'f',d:0,rot:h._rot||0};}
    var id=h.dataset.itemId;
    if(id==='sarma_debela'||id==='sarma_uska')return {el:h,set:id==='sarma_uska'?'g':'f',d:+h.dataset.sarmaCooked||0,rot:h._rot||0};
  }catch(e){}
  return null;
}
function vesselAt(e){var it=null;try{it=itemAt(e.clientX,e.clientY);}catch(x){}return isVessel(it)?it:null;}
function canvas(el){
  var st=sys(el);if(st.cv&&st.cv.isConnected)return st.cv;
  var c=document.createElement('canvas');c.className='sarma-vessel-cv';c.width=Math.max(8,Math.round((el.offsetWidth||100)*SC));c.height=Math.max(8,Math.round((el.offsetHeight||100)*SC));
  c.style.cssText='position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:7';el.appendChild(c);st.cv=c;return c;
}
function draw(el){
  var st=sys(el),c=canvas(el),g=c.getContext('2d'),tr=T();g.clearRect(0,0,c.width,c.height);
  if(!tr)return;
  st.list.slice().sort(function(a,b){return a.v-b.v;}).forEach(function(s){
    var im=tr.tinted(s.set,s.d);if(!im)return;
    var L=LEN[s.set]*SC,H=L*ASP[s.set];
    g.save();g.translate(s.u*c.width,s.v*c.height);g.rotate(s.a);
    g.shadowColor='rgba(20,10,0,.45)';g.shadowBlur=3;g.shadowOffsetY=2;g.drawImage(im,-L/2,-H/2,L,H);g.restore();
  });
}
function localUV(el,e){var r=el.getBoundingClientRect();return {u:(e.clientX-r.left)/Math.max(1,r.width),v:(e.clientY-r.top)/Math.max(1,r.height),w:r.width,h:r.height,r:r};}
function hitSarma(el,e){
  var st=sys(el);if(!st.list.length)return null;
  var p=localUV(el,e),best=null,bv=-1e9;
  st.list.forEach(function(s){
    var sc=p.w/Math.max(1,el.offsetWidth||p.w);      // screen px per local px
    var dx=(p.u-s.u)*p.w,dy=(p.v-s.v)*p.h,c=Math.cos(-s.a),sn=Math.sin(-s.a),x=dx*c-dy*sn,y=dx*sn+dy*c;
    var L=LEN[s.set]*sc,H=L*ASP[s.set];
    if(Math.abs(x)<=L/2&&Math.abs(y)<=H/2*1.1&&s.v>bv){bv=s.v;best=s;}
  });
  return best;
}
var swallow=false;
window.addEventListener('pointerdown',function(e){
  if(e.button!==0)return;
  var hi=heldInfo();
  if(hi){      // a sarma in the hand: a click on a vessel puts it there
    var el=vesselAt(e);if(!el)return;
    e.stopImmediatePropagation();e.preventDefault();swallow=true;
    var st=sys(el);
    if(st.list.length>=MAXV){toast('U posudu staje najviše deset sarmi.');return;}
    var p=localUV(el,e);
    st.list.push({u:p.u,v:p.v,a:(hi.rot||0)*Math.PI/180+(hi.rot?0:(Math.random()-.5)*.3),set:hi.set,d:hi.d});
    try{removeItem(hi.el);holding=null;hidePlacementGhost();hideOriginGhost();clearPourTarget();updateHover();}catch(x){}
    draw(el);try{playImpactSound(el,'drop');}catch(x){}
    return;
  }
  // empty hands: a click on a sarma in a vessel takes it out
  var emp=true;try{emp=!(holding&&!holding._mini);}catch(x){}
  if(!emp)return;
  var done=false;
  try{(window.items||items).forEach(function(it){
    if(done||!isVessel(it)||!it._sarmaV||!it._sarmaV.list.length)return;
    var s=hitSarma(it,e);if(!s)return;
    done=true;e.stopImmediatePropagation();e.preventDefault();swallow=true;
    var L=it._sarmaV.list;L.splice(L.indexOf(s),1);draw(it);
    if(T())T().holdFinished(s.set,s.d,e,it);
  });}catch(x){}
},true);
window.addEventListener('pointerup',function(e){if(swallow){e.stopImmediatePropagation();setTimeout(function(){swallow=false;},80);}},true);
['click','mouseup'].forEach(function(t){window.addEventListener(t,function(e){if(swallow)e.stopImmediatePropagation();},true);});
window.CooksterSarmaVessel={count:function(el){return sys(el).list.length;},draw:draw,sys:sys,max:MAXV};
})();
