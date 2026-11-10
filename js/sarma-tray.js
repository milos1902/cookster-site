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
var TRAY='kal_01_okrugli_pleh',MAXN=16;
var FLOOR={cx:.50,cy:.50,rx:.45,ry:.315};      // the floor of the tray in the picture (fractions of its box)
var SOFT=.72,PUSH=1.1;
var SETS={f:{src:'assets/sarma/f8.webp',len:.255,asp:.42},g:{src:'assets/sarma3/g8.webp',len:.275,asp:.39}};
var spr={};
Object.keys(SETS).forEach(function(k){var im=new Image();im.onload=function(){      // crop to the solid part (the rolled sarma is a small part of the picture)
  var c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;var g=c.getContext('2d');g.drawImage(im,0,0);
  var d=g.getImageData(0,0,c.width,c.height).data,x0=c.width,y0=c.height,x1=0,y1=0;
  for(var y=0;y<c.height;y+=2)for(var x=0;x<c.width;x+=2)if(d[(y*c.width+x)*4+3]>40){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;}
  var o=document.createElement('canvas');o.width=Math.max(2,x1-x0);o.height=Math.max(2,y1-y0);o.getContext('2d').drawImage(c,x0,y0,o.width,o.height,0,0,o.width,o.height);spr[k]=o;};im.src=SETS[k].src+'?v=3';});
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
          a.x-=nx*sa*.6;a.y-=ny*sa*.6;a.a-=((pa[p].x-a.x)*(-ny)-(pa[p].y-a.y)*(-nx))*sa*1.2/(a.len*a.len*.2+.01)*.5;
          b.x+=nx*sb*.6;b.y+=ny*sb*.6;b.a+=((pb[q].x-b.x)*(ny)-(pb[q].y-b.y)*(nx))*sb*1.2/(b.len*b.len*.2+.01)*.5;
        }
      }
    }
    for(var k=0;k<L.length;k++){var s=L[k];if(st.drag===s)continue;      // the wall of the tray
      var P=pts(s),mx=0,my=0;
      for(var m=0;m<3;m++){var dd=Math.hypot(P[m].x,P[m].y),lim=R-s.r*.3;if(dd>lim){var o=(dd-lim)/dd;mx-=P[m].x*o;my-=P[m].y*o;}}
      s.x+=mx*.5;s.y+=my*.5;}
  }
}
function tick(el){
  var st=sys(el);st.raf=0;
  var before=st.list.map(function(s){return [s.x,s.y,s.a];});
  if(st.drag){var d=st.drag,t=st.target;if(t){d.x+= (t.x-d.x)*.55;d.y+=(t.y-d.y)*.55;var lim=FLOOR.rx-d.r*.3,rr=Math.hypot(d.x,d.y);if(rr>lim){d.x*=lim/rr;d.y*=lim/rr;}}}
  relax(st,8);st.list.forEach(function(q){if(q.pin>0)q.pin--;});
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
  var list=st.list.slice().sort(function(a,b){return a.y-b.y;});
  list.forEach(function(s){
    var im=spr[s.set];if(!im)return;
    var dxs=Math.cos(s.a),dys=kk*Math.sin(s.a),ls=Math.hypot(dxs,dys),ang=Math.atan2(dys,dxs);
    var sx=(FLOOR.cx+s.x)*w,sy=(FLOOR.cy*br+s.y*kk)*w;      // screen position (px)
    var lenPx=s.len*w*ls,widPx=s.len*w*SETS[s.set].asp*(.55+.45*(1-Math.abs(Math.sin(ang-Math.atan2(dys,dxs)))))*(0.8+.2*(1/ls));
    var hh=s.len*w*SETS[s.set].asp*Math.max(.62,Math.min(1.05,Math.sqrt(Math.sin(s.a)*Math.sin(s.a)*kk*kk+Math.cos(s.a)*Math.cos(s.a))));
    g.save();g.translate(sx,sy);g.rotate(ang);
    g.shadowColor='rgba(20,10,0,.45)';g.shadowBlur=3;g.shadowOffsetY=2;
    g.drawImage(im,-lenPx/2,-hh/2,lenPx,hh);g.restore();
  });
  g.restore();
}
function hit(el,cx,cy){
  var st=sys(el),p=local(el,cx,cy),best=null,bd=1e9;
  st.list.forEach(function(s){var P=pts(s);for(var i=0;i<3;i++){var d=Math.hypot(P[i].x-p.x,P[i].y-p.y);if(d<s.r*1.25&&d<bd){bd=d;best=s;}}});
  return best;
}
function add(el,set,cx,cy,rotDeg){
  var st=sys(el);if(st.list.length>=MAXN){toast('Pleh je pun.');return false;}
  var S=SETS[set]||SETS.f,len=S.len*(.94+Math.random()*.12),p=cx==null?{x:0,y:0}:local(el,cx,cy);
  var rr=Math.hypot(p.x,p.y),lim=FLOOR.rx-len*S.asp*.5*.3;if(rr>lim){p.x*=lim/rr;p.y*=lim/rr;rr=lim;}
  var tang=Math.atan2(p.y,p.x)+Math.PI/2;      // along the circle round the middle of the tray (the first rings round the edge, then inwards); the middle one lies freely
  var ang=rr<FLOOR.rx*.22?(Math.random()-.5)*1.2:tang+(Math.random()-.5)*.25;
  if(typeof rotDeg==='number'){var kk=(FLOOR.ry*boxRatio(el))/FLOOR.rx,rs=rotDeg*Math.PI/180;ang=Math.atan2(Math.sin(rs)/kk,Math.cos(rs));}      // the player turned it with the wheel: it goes in exactly like that
  st.list.push({x:p.x,y:p.y,a:ang,len:len,r:len*S.asp*.5,set:set,pin:90});
  kick(el,60);return true;
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
    if(add(t,set,e.clientX,e.clientY,hs._rot!==undefined?hs._rot:undefined)){
      try{removeItem(hs);holding=null;hidePlacementGhost();hideOriginGhost();clearPourTarget();updateHover();}catch(x){}
      try{playImpactSound(t,'drop');}catch(x){}
    }
    return;
  }
  if(!emptyHands())return;
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
function heldLid(){try{return holding&&holding.dataset&&holding.dataset.itemId===LID_ID?holding:null;}catch(e){return null;}}
window.addEventListener('pointerdown',function(e){
  if(e.button!==0)return;
  var hl=heldLid(),tr=trayAt(e);
  if(hl&&tr&&!tr._lid){
    e.stopImmediatePropagation();e.preventDefault();gestureSwallow=true;
    try{removeItem(hl);holding=null;hidePlacementGhost();hideOriginGhost();clearPourTarget();updateHover();}catch(x){}
    lidOn(tr);try{playImpactSound(tr,'drop');}catch(x){}return;
  }
  if(!hl&&emptyHands()&&tr&&tr._lid){
    var def=null;try{def=kitchenDefForId(LID_ID);}catch(x){}if(!def)return;
    e.stopImmediatePropagation();e.preventDefault();gestureSwallow=true;
    lidOff(tr);
    var p0=screenToScene(e.clientX,e.clientY),w=def.w,h=def.h;
    var el=makeItem({...def,instanceId:nextItemInstanceId(def.id),x:p0.x-w/2,y:p0.y-h,z:++zCounter});
    if(el){el.dataset.surfaceZone='table';try{setPose(el,p0.x,p0.y,+tr.dataset.vis||1);}catch(x){}try{startHolding(el);}catch(x){}}
    try{playImpactSound(tr,'pickup');}catch(x){}
  }
},true);
window.CooksterSarmaTray={lidOn:lidOn,lidOff:lidOff,add:add,sys:sys,kick:kick,hit:hit,count:function(el){return sys(el).list.length;}};
})();
