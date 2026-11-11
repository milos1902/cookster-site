/* Cookster: the finished sarmas are laid into the ROUND TRAY (Okrugli pleh) and arrange themselves like soft rolls.
   - with a finished sarma in the hand (js/sarma.js: data-sarma-rolled="1") a click on the tray puts it in at the cursor;
   - every sarma is a soft capsule (three overlapping circles along its axis): neighbours push each other away and turn, but may go a little into each other (the circles are only 80 % hard),
     so a full tray ends up packed tight, like real sarmas; the pushing is a short relaxation (position based) that stops by itself;
   - with EMPTY hands a press on a sarma in the tray takes it and moves it with the mouse: the others give way; let go to leave it there;
   - a right click on a sarma takes it back into the hand?  (not yet)  The state is kept on the tray (tray._sarmas); it is not saved yet (water, bacon and cooking come next).
   Simulation space: the unit is the width of the tray, y is stretched so that the floor of the tray is a circle (perspective of the picture). */
(function(){
'use strict';
if(window.CooksterSarmaTray)return;
var TRAY='kal_01_okrugli_pleh',MAXN=50;
var FLOOR={cx:.50,cy:.50,rx:.45,ry:.315};      // the floor of the tray in the picture (fractions of its box)
var SOFT=.72,PUSH=.42,MAXSTEP=.0045;      // heavy and soft: a weak push, divided by the weight of the sarma, and a small cap of the move in one step (nothing jumps away)
var SETS={f:{src:'assets/sarma/f8.webp',len:.31,asp:.46},g:{src:'assets/sarma3/g8.webp',len:.33,asp:.43}};
var spr={};
Object.keys(SETS).forEach(function(k){var im=new Image();im.onload=function(){      // crop to the solid part (the rolled sarma is a small part of the picture)
  var c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;var g=c.getContext('2d');g.drawImage(im,0,0);
  var d=g.getImageData(0,0,c.width,c.height).data,x0=c.width,y0=c.height,x1=0,y1=0;
  for(var y=0;y<c.height;y+=2)for(var x=0;x<c.width;x+=2)if(d[(y*c.width+x)*4+3]>40){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;}
  var o=document.createElement('canvas');o.width=Math.max(2,x1-x0);o.height=Math.max(2,y1-y0);o.getContext('2d').drawImage(c,x0,y0,o.width,o.height,0,0,o.width,o.height);spr[k]=o;};im.src=SETS[k].src+'?v=3';});
// the DONENESS of the sarmas (d: 0 raw, 1 light, 2 golden, 3 burnt) tints the sprite: the placed sarmas themselves change phase (temporary colouring, until Miloš makes pictures of baked sarmas)
function donenessOf(tr){return cookOf(tr)*2+burnOf(tr);}
var TINTS=[[0,[255,255,255,1]],[1,[235,228,150,1]],[2,[225,150,70,1]],[3,[70,48,34,1]]];      // multiplied over the sprite (keeps its texture)
function tintCol(d){var i=0;while(i<TINTS.length-2&&d>TINTS[i+1][0])i++;var a=TINTS[i],b=TINTS[i+1],t=Math.max(0,Math.min(1,(d-a[0])/(b[0]-a[0])));return a[1].map(function(v,k){return v+(b[1][k]-v)*t;});}
var tintCache={};
function tinted(set,d){
  var im=spr[set];if(!im)return null;var q=Math.round(d*12);if(q<=0)return im;
  var key=set+q;if(tintCache[key]&&tintCache[key].src===im)return tintCache[key].c;
  var c=document.createElement('canvas');c.width=im.width;c.height=im.height;var g=c.getContext('2d');
  var col=tintCol(q/12);g.fillStyle='rgb('+Math.round(col[0])+','+Math.round(col[1])+','+Math.round(col[2])+')';g.fillRect(0,0,c.width,c.height);
  g.globalCompositeOperation='multiply';g.drawImage(im,0,0);g.globalCompositeOperation='destination-in';g.drawImage(im,0,0);
  tintCache[key]={src:im,c:c};return c;
}
function emptyHands(){try{return !(typeof holding!=='undefined'&&holding&&!holding._mini);}catch(e){return true;}}
function toast(m){try{showToast(m);}catch(e){}}
function isTray(it){return !!it&&it.dataset&&it.dataset.itemId===TRAY;}
function K(){return FLOOR.ry/FLOOR.rx*0.668/0.668;}      // (box ratio is folded into local())
function boxRatio(el){var r=el.getBoundingClientRect();return r.height/Math.max(1,r.width);}
// local simulation coordinates of a screen point: X in tray widths, Y stretched so the floor is round
function local(el,cx,cy){
  var r=el.getBoundingClientRect(),u=(cx-r.left)/Math.max(1,r.width),v=(cy-r.top)/Math.max(1,r.height),br=r.height/Math.max(1,r.width);
  var kk=(FLOOR.ry*br)/FLOOR.rx;      // y-squash of the floor in tray widths
  return {x:(u-FLOOR.cx),y:(v-FLOOR.cy)*br/kk,k:kk,br:br};
}
function sys(el){return el._sarmas||(el._sarmas={list:[],cv:null,active:0,drag:null,raf:0});}
function body(s){var h=s.len*.5-s.r;return {h:Math.max(0,h)};}
function pts(s){var h=body(s).h,c=Math.cos(s.a),sn=Math.sin(s.a);return [{x:s.x-c*h,y:s.y-sn*h},{x:s.x,y:s.y},{x:s.x+c*h,y:s.y+sn*h}];}
// the wall: every one of the three circles of a sarma (its two ends and its middle) stays inside the floor of the tray with its WHOLE size; the end of the sarma touches the wall and stops
function wallFix(s){
  var R=FLOOR.rx;
  for(var pass=0;pass<4;pass++){
    var P=pts(s),mx=0,my=0,worst=0;
    for(var m=0;m<3;m++){var dd=Math.hypot(P[m].x,P[m].y),lim=R-s.r*.96;if(dd>lim){var o=(dd-lim)/(dd||1e-6);var ox=-P[m].x*o,oy=-P[m].y*o;if(Math.hypot(ox,oy)>worst){worst=Math.hypot(ox,oy);mx=ox;my=oy;}}}
    if(worst<1e-5)break;
    s.x+=mx;s.y+=my;
  }
}
function relax(st,iters){
  var L=st.list,R=FLOOR.rx;
  for(var it=0;it<iters;it++){
    for(var i=0;i<L.length;i++)for(var j=i+1;j<L.length;j++){
      var a=L[i],b=L[j],pa=pts(a),pb=pts(b);
      if(Math.hypot(a.x-b.x,a.y-b.y)>a.len*.5+b.len*.5)continue;
      // neighbours turn parallel (rolls lie side by side) and spread out evenly over the whole floor (a weak push at a longer range)
      var cd=Math.hypot(a.x-b.x,a.y-b.y);
      if(cd<(a.len+b.len)*.38){var da=b.a-a.a;da-=Math.PI*Math.round(da/Math.PI);var wa0=(a.pin>0||st.drag===a)?0:1,wb0=(b.pin>0||st.drag===b)?0:1;a.a+=da*.03*wa0;b.a-=da*.03*wb0;}
      for(var p=0;p<3;p++)for(var q=0;q<3;q++){
        var dx=pb[q].x-pa[p].x,dy=pb[q].y-pa[p].y,d=Math.hypot(dx,dy)||1e-4,min=(a.r+b.r)*SOFT;
        if(d<min){
          var f=(min-d)*PUSH,nx=dx/d,ny=dy/d,wa=(st.drag===a||a.pin>0)?0:1,wb=(st.drag===b||b.pin>0)?0:1,tot=(wa+wb)||1;
          var sa=wa/tot*f,sb=wb/tot*f;
          // move + turn: the displacement at a point moves the centre and turns the body round it
          var ma=a.m||1,mb=b.m||1,ca=Math.min(MAXSTEP,sa*.6/ma),cb=Math.min(MAXSTEP,sb*.6/mb);      // a heavy sarma gives way less; a light one more
          a.x-=nx*ca;a.y-=ny*ca;a.a-=((pa[p].x-a.x)*(-ny)-(pa[p].y-a.y)*(-nx))*sa*.5/ma/(a.len*a.len*.2+.01)*.35;
          b.x+=nx*cb;b.y+=ny*cb;b.a+=((pb[q].x-b.x)*(ny)-(pb[q].y-b.y)*(nx))*sb*.5/mb/(b.len*b.len*.2+.01)*.35;
        }
      }
    }
    for(var k=0;k<L.length;k++)wallFix(L[k]);      // the wall of the tray: a sarma can never go through it (also not the one in the hand)
  }
}
function tick(el){
  var st=sys(el);st.raf=0;
  var before=st.list.map(function(s){return [s.x,s.y,s.a];});
  if(st.drag){var d=st.drag,t=st.target;if(t){d.x+=Math.max(-.02,Math.min(.02,(t.x-d.x)*.45));d.y+=Math.max(-.02,Math.min(.02,(t.y-d.y)*.45));wallFix(d);}}
  var x0=st.list.map(function(q){return [q.x,q.y,q.a];});
  relax(st,8);
  // heavy: in one frame a sarma that is pushed may only go a very little way and turn a little (nothing jumps away), only the sarma in the hand follows the mouse freely
  st.list.forEach(function(q,i){
    if(q.pin>0)q.pin--;if(st.drag===q)return;
    var dx=q.x-x0[i][0],dy=q.y-x0[i][1],dd=Math.hypot(dx,dy),cap=.0034/(q.m||1);
    if(dd>cap){q.x=x0[i][0]+dx*cap/dd;q.y=x0[i][1]+dy*cap/dd;}
    q.a=Math.max(-.07,Math.min(.07,q.a*.9));      // locked: horizontal
    wallFix(q);
  });
  var mv=0;st.list.forEach(function(s,i){mv=Math.max(mv,Math.abs(s.x-before[i][0])+Math.abs(s.y-before[i][1])+Math.abs(s.a-before[i][2])*.05);});
  draw(el);
  if(mv>.0006||st.drag||st.active>0){st.active=Math.max(0,st.active-1);st.raf=requestAnimationFrame(function(){tick(el);});}
}
function kick(el,n){var st=sys(el);st.active=Math.max(st.active,n||40);if(!st.raf)st.raf=requestAnimationFrame(function(){tick(el);});}
function canvas(el){
  var st=sys(el);if(st.cv&&st.cv.isConnected)return st.cv;
  var c=document.createElement('canvas');c.className='sarma-tray-cv';c.style.cssText='position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:6';el.appendChild(c);st.cv=c;return c;
}
function draw(el){
  var st=sys(el),c=canvas(el),w=el.clientWidth||el.offsetWidth,h=el.clientHeight||el.offsetHeight;if(!w||!h)return;
  var dpr=Math.min(2,window.devicePixelRatio||1);if(c.width!==Math.round(w*dpr)||c.height!==Math.round(h*dpr)){c.width=Math.round(w*dpr);c.height=Math.round(h*dpr);}
  var g=c.getContext('2d');g.setTransform(dpr,0,0,dpr,0,0);g.clearRect(0,0,w,h);
  var br=h/w,kk=(FLOOR.ry*br)/FLOOR.rx;
  // the mask of the tray: only what is inside the opening of the tray is seen (the front wall and the rim hide the rest, nothing goes over the edge)
  g.save();g.beginPath();g.ellipse(.5*w,.455*h,.462*w,.355*h,0,0,Math.PI*2);g.clip();
  var wl=waterOf(el);
  if(wl>.002){      // the water: a layer on the floor of the tray that rises with the amount, round the sarmas
    var wf=.1+.9*wl,top=h*(.80-.42*wf);
    // the juice of the sarma: opaque, yellowish-reddish (the colour of the cooking liquid with paprika and fat), a little lighter on top, with a soft shine of the fat
    var gr=g.createLinearGradient(0,top,0,h*.82);gr.addColorStop(0,'rgba(196,118,52,.94)');gr.addColorStop(.5,'rgba(176,86,38,.97)');gr.addColorStop(1,'rgba(136,58,26,.98)');
    g.fillStyle=gr;g.fillRect(0,top,w,h);
    g.fillStyle='rgba(255,226,160,.32)';g.fillRect(0,top,w,Math.max(1.6,h*.014));
  }
  var ck=cookOf(el);
  var list=st.list.slice().sort(function(a,b){return a.y-b.y;});
  var dn=donenessOf(el);
  list.forEach(function(s){
    var im=tinted(s.set,dn);if(!im)return;
    var dxs=Math.cos(s.a),dys=kk*Math.sin(s.a),ls=Math.hypot(dxs,dys),ang=Math.atan2(dys,dxs);
    var sx=(FLOOR.cx+s.x)*w,sy=(FLOOR.cy*br+s.y*kk)*w;      // screen position (px)
    // every sarma keeps its OWN exact size: the length and the width in pixels depend only on the sarma and on the size of the tray, never on how it lies or on the others
    var lenPx=s.len*w,hh=s.len*w*SETS[s.set].asp;
    g.save();g.translate(sx,sy);g.rotate(ang);
    g.shadowColor='rgba(20,10,0,.45)';g.shadowBlur=3;g.shadowOffsetY=2;
    g.drawImage(im,-lenPx/2,-hh/2,lenPx,hh);g.restore();
  });
  if(wl>.45){var tint=Math.min(.3,(wl-.45)*.55);g.fillStyle='rgba(150,70,30,'+tint.toFixed(3)+')';g.fillRect(0,0,w,h);}
  g.restore();
}
function hit(el,cx,cy){
  var st=sys(el),p=local(el,cx,cy),best=null,bd=1e9;
  st.list.forEach(function(s){var P=pts(s);for(var i=0;i<3;i++){var d=Math.hypot(P[i].x-p.x,P[i].y-p.y);if(d<s.r*1.25&&d<bd){bd=d;best=s;}}});
  return best;
}
function add(el,set,cx,cy,rotDeg){
  var st=sys(el);if(st.list.length>=MAXN){toast('Pleh je pun.');return false;}
  var S=SETS[set]||SETS.f,len=S.len,p=cx==null?{x:0,y:0}:local(el,cx,cy);
  var rr=Math.hypot(p.x,p.y),lim=FLOOR.rx-len*S.asp*.5*.3;if(rr>lim){p.x*=lim/rr;p.y*=lim/rr;rr=lim;}
  var tang=0;      // horizontal only      // along the circle round the middle of the tray (the first rings round the edge, then inwards); the middle one lies freely
  var ang=(Math.random()-.5)*.1;      // every sarma lies flat on the bottom, horizontally (a few degrees of wobble at most); the turning of the wheel in the hand does not count in the tray
  var ns={x:p.x,y:p.y,a:ang,len:len,r:len*S.asp*.5,set:set,pin:90,m:.8+Math.random()*1.7};wallFix(ns);st.list.push(ns);      // m: the weight (a light one .8 ... a heavy one 2.5)
  kick(el,60);return true;
}
function takeOut(tr,s,e){
  var id=s.set==='g'?'sarma_uska':'sarma_debela',def=null;try{def=(CooksterCatalog.CALIBRATION_ONLY_ITEMS||[]).find(function(x){return x.id===id;})||kitchenDefForId(id);}catch(x){}if(!def)return;
  var st=sys(tr),ix=st.list.indexOf(s);if(ix<0)return;st.list.splice(ix,1);kick(tr,20);
  var d=donenessOf(tr),im=tinted(s.set,d),S=SETS[s.set],w=def.w,h=Math.round(w*S.asp);
  var p0=screenToScene(e.clientX,e.clientY);
  var el=makeItem({...def,w:w,h:h,instanceId:nextItemInstanceId(def.id),x:p0.x-w/2,y:p0.y-h/2,z:++zCounter});
  if(!el)return;
  try{var img=el.querySelector('img');if(img&&im){img.src=im.toDataURL('image/png');}}catch(x){}
  el.dataset.sarmaCooked=d.toFixed(2);el.dataset.surfaceZone='table';
  try{setPose(el,p0.x,p0.y,+tr.dataset.vis||1);}catch(x){}try{startHolding(el);}catch(x){}
}
function trayAt(e){var it=(typeof itemAt==='function')?itemAt(e.clientX,e.clientY):null;return isTray(it)?it:null;}
function heldSarma(){try{var h=holding;return h&&h.dataset&&h.dataset.sarmaRolled==='1'?h:null;}catch(e){return null;}}
var gestureSwallow=false;
function applyRot(hs){
  var d=(hs._rot||0),tf=function(h){var sc=1;try{sc=(hs._sm&&hs._sm.set&&hs._sm.set.scale)||1;}catch(e){}h.style.transform='scale('+sc+') rotate('+d+'deg)';h.style.transformOrigin='50% 50%';};
  document.querySelectorAll('.placement-ghost .sarma-frames').forEach(tf);var own=hs.querySelector('.sarma-frames');if(own)tf(own);
}
window.addEventListener('wheel',function(e){
  var hs=heldSarma();if(!hs)return;
  e.preventDefault();e.stopImmediatePropagation();
  var dy=e.deltaMode===1?e.deltaY*33:e.deltaY;hs._rot=((hs._rot||0)+(dy<0?-1:1)*Math.min(30,Math.max(8,Math.abs(dy)*.12)))%360;applyRot(hs);
},{capture:true,passive:false});
setInterval(function(){var hs=heldSarma();if(hs&&hs._rot)applyRot(hs);},120);
window.addEventListener('pointerdown',function(e){
  if(e.button!==0)return;
  var tr=trayAt(e);
  var hs=heldSarma();
  if(hs){      // a finished sarma in the hand: a click on the tray lays it in
    var t=tr;if(!t)return;
    var set=(hs._sm&&hs._sm.set&&hs._sm.set.pre)||'f';
    e.stopImmediatePropagation();e.preventDefault();gestureSwallow=true;
    if(add(t,set,e.clientX,e.clientY)){
      try{removeItem(hs);holding=null;hidePlacementGhost();hideOriginGhost();clearPourTarget();updateHover();}catch(x){}
      try{playImpactSound(t,'drop');}catch(x){}
    }
    return;
  }
  if(!emptyHands())return;
  var done=false;
  if(tr&&tr._lid)return;      // under the lid nothing can be touched (a click on the handle takes the lid off, elsewhere it takes the whole tray)
  // COOKED sarmas (cooking finished): a click on a sarma TAKES IT OUT of the tray into the hand
  try{(window.items||items).forEach(function(it){if(done)return;if(isTray(it)&&!it._lid&&it._sarmas&&it._sarmas.list.length&&cookOf(it)>=1){var ts=hit(it,e.clientX,e.clientY);if(ts){done=true;e.stopImmediatePropagation();e.preventDefault();gestureSwallow=true;takeOut(it,ts,e);}}});}catch(x){}
  if(done)return;
  // empty hands: a press on a sarma in the tray takes it
  var cand=null;
  try{(window.items||items).forEach(function(it){if(isTray(it)&&it._sarmas&&it._sarmas.list.length){var s=hit(it,e.clientX,e.clientY);if(s&&!cand)cand={tray:it,s:s};}});}catch(x){}
  if(cand){
    e.stopImmediatePropagation();e.preventDefault();gestureSwallow=true;
    var st=sys(cand.tray);st.drag=cand.s;st.target=local(cand.tray,e.clientX,e.clientY);st.dragTray=cand.tray;kick(cand.tray,10);
  }
},true);
window.addEventListener('pointermove',function(e){
  var any=null;try{(window.items||items).forEach(function(it){if(isTray(it)&&it._sarmas&&it._sarmas.drag)any=it;});}catch(x){}
  if(!any)return;var st=sys(any);st.target=local(any,e.clientX,e.clientY);kick(any,5);
},true);
function endDrag(){
  try{(window.items||items).forEach(function(it){if(isTray(it)&&it._sarmas&&it._sarmas.drag){var st=it._sarmas;st.drag=null;st.target=null;kick(it,30);}});}catch(x){}
}
window.addEventListener('pointerup',function(e){if(gestureSwallow){e.stopImmediatePropagation();gestureSwallow=false;}endDrag();},true);
['click','mouseup','mousedown'].forEach(function(t){window.addEventListener(t,function(e){if(gestureSwallow&&t!=='mousedown'){e.stopImmediatePropagation();}},true);});
// ---- the LID of the tray (assets/calibration_props/okrugli_pleh_poklopac.webp, the item "Poklopac za okrugli pleh" of the Kitchen elements) ----
// with the lid in the hand a click on the tray puts it on (it covers the sarmas); with empty hands a click on a covered tray takes the lid off (it goes into the hand).
var LID_ID='kal_01_okrugli_pleh_poklopac';
function lidOn(tr){
  if(tr._lidEl&&tr._lidEl.isConnected)return;
  var im=document.createElement('img');im.className='sarma-tray-lid';im.src='assets/calibration_props/okrugli_pleh_poklopac.webp?v=1';im.draggable=false;im.alt='';
  im.style.cssText='position:absolute;left:-1.5%;top:-4%;width:103%;pointer-events:none;z-index:9;filter:drop-shadow(0 2px 3px rgba(20,10,0,.5))';
  tr.appendChild(im);tr._lidEl=im;tr._lid=true;
  var cv=sys(tr).cv;if(cv)cv.style.opacity='1';
}
function lidOff(tr){if(tr._lidEl&&tr._lidEl.parentNode)tr._lidEl.parentNode.removeChild(tr._lidEl);tr._lidEl=null;tr._lid=false;}
function onHandle(tr,e){var r=tr.getBoundingClientRect(),u=(e.clientX-r.left)/Math.max(1,r.width),v=(e.clientY-r.top)/Math.max(1,r.height);return u>.3&&u<.7&&v>.05&&v<.42;}
function heldLid(){try{return holding&&holding.dataset&&holding.dataset.itemId===LID_ID?holding:null;}catch(e){return null;}}
window.addEventListener('pointerdown',function(e){
  if(e.button!==0)return;
  var hl=heldLid(),tr=trayAt(e);
  if(hl&&tr&&!tr._lid){
    e.stopImmediatePropagation();e.preventDefault();gestureSwallow=true;
    try{removeItem(hl);holding=null;hidePlacementGhost();hideOriginGhost();clearPourTarget();updateHover();}catch(x){}
    lidOn(tr);try{playImpactSound(tr,'drop');}catch(x){}return;
  }
  if(!hl&&emptyHands()&&tr&&tr._lid&&onHandle(tr,e)){      // only a click on the HANDLE of the lid takes the lid off; a click anywhere else takes the whole tray (with the lid and the sarmas) in the hand and it is moved with them
    var def=null;try{def=kitchenDefForId(LID_ID);}catch(x){}if(!def)return;
    e.stopImmediatePropagation();e.preventDefault();gestureSwallow=true;
    lidOff(tr);
    var p0=screenToScene(e.clientX,e.clientY),w=def.w,h=def.h;
    var el=makeItem({...def,instanceId:nextItemInstanceId(def.id),x:p0.x-w/2,y:p0.y-h,z:++zCounter});
    if(el){el.dataset.surfaceZone='table';try{setPose(el,p0.x,p0.y,+tr.dataset.vis||1);}catch(x){}try{startHolding(el);}catch(x){}}
    try{playImpactSound(tr,'pickup');}catch(x){}
  }
},true);
// ---- WATER: poured from the pitcher (js/pitcher-pour.js) into the tray with sarmas (no lid on it). The water stands round the sarmas and rises (the sarmas stay on top, a little darker where the water is) ----
var WATER_FULL=100;      // 100 units of the pitcher fill the tray to the top of the sarmas (a full pitcher is 100 units)
function trayWithSarmasAt(x,y){
  var found=null;try{(window.items||items).forEach(function(it){if(!isTray(it)||it._lid||!it._sarmas||!it._sarmas.list.length)return;var r=it.getBoundingClientRect();
    var u=(x-r.left)/Math.max(1,r.width),v=(y-r.top)/Math.max(1,r.height);if(u>-.15&&u<1.15&&v>-.3&&v<1.12)found=it;});}catch(e){}      // a big target: also next to the tray and above it (the spout of the pitcher is over the tray, the water falls in)
  return found;
}
function waterOf(tr){return Math.max(0,Math.min(1,(tr._water||0)));}
function addWater(tr,units){tr._water=Math.min(1,waterOf(tr)+units/WATER_FULL);tr.dataset.sarmaWater=tr._water.toFixed(3);kick(tr,4);try{CooksterSave.schedule();}catch(e){}}
// ---- COOKING (game time, 1 real minute = 1 game hour): the sarmas need 3 HOURS of game time on a QUIET fire (the damper closed): 2.5 hours COVERED with the lid, then the last 30 minutes UNCOVERED (they go golden).
// The pictures (assets/sarma/pleh_kuvane_1..3.webp, made in ChatGPT): raw -> light (covered time) -> golden (uncovered time) -> burnt (only when the juice is gone and the tray still stands on the fire).
// Only the time with the fire ON counts; the lid must be on for the first 2.5 h (the lid taken off early stops the cooking and the juice boils away faster), and for the browning (the last 30 min) it must be off.
// The juice boils away slowly (lid on) or faster (lid off); an OPEN damper (strong fire) boils it away 4 times faster. No juice -> after about 20 game minutes the sarmas burn. ----
var COVER_MIN=150,OPEN_MIN=30,BURN_MIN=20;
function cookOf(tr){return Math.max(0,Math.min(1,tr._cook||0));}
function burnOf(tr){return Math.max(0,Math.min(1,tr._burn||0));}
var lastGM=null,lastReal=Date.now();
function gameMin(){try{if(window.CooksterDay&&CooksterDay.minute)return CooksterDay.minute();}catch(e){}return Date.now()/1000;}
function fireState(){      // {on, quiet}
  var on=false,quiet=false;
  try{on=!!(stoveState&&stoveState.fireOn&&(+stoveState.fireLevel||0)>0);}catch(e){}
  try{quiet=!!damperClosed();}catch(e){}
  return {on:on,quiet:quiet};
}
setInterval(function(){
  try{
    var gm=gameMin(),dm=lastGM==null?0:gm-lastGM;lastGM=gm;
    if(!(dm>0&&dm<30))dm=0;      // the clock stands (pause, the end of the day) or jumps (a new day): nothing happens
    if(!dm)return;
    var fs=fireState();if(!fs.on)return;
    (window.items||items).forEach(function(tr){
      if(!isTray(tr)||!tr._sarmas||!tr._sarmas.list.length||tr.dataset.inOven!=='1')return;
      var cov=tr._cov||0,unc=tr._unc||0,lid=!!tr._lid,w=waterOf(tr),heat=fs.quiet?1:4;
      if(w>0){      // the juice boils away
        var use=(lid?1/450:1/110)*dm*heat;tr._water=Math.max(0,w-use);tr.dataset.sarmaWater=tr._water.toFixed(3);w=tr._water;
        if(cov<COVER_MIN&&lid)cov=Math.min(COVER_MIN,cov+dm);
        else if(cov>=COVER_MIN&&!lid)unc=Math.min(OPEN_MIN,unc+dm);
        tr._cov=cov;tr._unc=unc;tr._cook=.5*cov/COVER_MIN+.5*unc/OPEN_MIN;tr.dataset.sarmaCook=tr._cook.toFixed(3);
      }else if(burnOf(tr)<1){      // no juice: they burn
        tr._burn=Math.min(1,burnOf(tr)+dm/BURN_MIN);tr.dataset.sarmaBurn=tr._burn.toFixed(3);
      }
      kick(tr,3);
    });
  }catch(e){}
},500);
window.CooksterSarmaTray={cook:cookOf,burn:burnOf,trayWithSarmasAt:trayWithSarmasAt,addWater:addWater,water:waterOf,lidOn:lidOn,lidOff:lidOff,add:add,sys:sys,kick:kick,hit:hit,count:function(el){return sys(el).list.length;}};
})();
