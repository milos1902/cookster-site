/* Cookster: minced meat, the ball, the burger (pljeskavica) and the cevap.
   - The fridge (the dock) gives a bag of minced meat. It is poured into any bowl or "vangla" / basin (not on the board): 6 units of the ingredient `mleveno_meso`.
   - Chopped onion / garlic dropped into the bowl is mixed into the meat (flag minceLuk); the ground pepper from the jar (dataset.spices tucana / paprika) gives the red pepper.
     The picture of the heap follows what is in it: plain, onion, pepper, onion + pepper (assets/meat/mleveno_*.png), in whatever order they were added.
   - A click on the heap takes one ball (a unit) in the hand; on the board a right click on the ball: "Pljeskavica" (one) or "Ćevapi" (four). */
(function(){
'use strict';
if(window.CooksterMince)return;
var KEY='mleveno_meso',PER_BAG=6,CEVAPI=4;
var IMG={plain:'assets/meat/mleveno_gomila.png',luk:'assets/meat/mleveno_luk.png',pap:'assets/meat/mleveno_paprika.png',both:'assets/meat/mleveno_luk_paprika.png'};
var BAG_SRC='assets/meat/mleveno_kesa.png';
function toast(m){try{showToast(m);}catch(e){}}
function isBowl(v){return !!v&&/^(vangla_|lavor_|kal_02_cinija_)/.test((v.dataset&&v.dataset.itemId)||'');}
function heatable(v){try{return isHeatableCookwareItem(v);}catch(e){return false;}}
function units(v){
  try{
    if(heatable(v))return Math.max(0,+((CooksterPan.read(v).ingredients||{})[KEY])||0);
    var e=(CooksterContainer.read(v).items||{})[KEY];return e?Math.max(0,+e.count||0):0;
  }catch(e){return 0;}
}
function spiceDose(v){var sp={};try{sp=JSON.parse(v.dataset.spices||'{}');}catch(e){}return (+sp.tucana||0)+(+sp.paprika||0);}
function state(v){
  var luk=v.dataset.minceLuk==='1',pap=spiceDose(v)>0||v.dataset.mincePap==='1';
  var kk=luk&&pap?'both':(luk?'luk':(pap?'pap':'plain'));return {luk:luk,pap:pap,key:kk,src:IMG[kk],name:luk&&pap?'luk i paprika':luk?'luk':pap?'paprika':'obično'};
}
function metaFor(v){return {key:KEY,type:'ingredient',label:'Mleveno meso',src:state(v).src,form:'mince',baseKey:KEY,cutState:'whole'};}
function rerender(v){try{renderCookwareContents(v);}catch(e){}paint(v);try{CooksterSave.schedule();}catch(e){}}
function setUnits(v,n){
  n=Math.max(0,n);
  if(heatable(v)){
    var cur=units(v);
    if(n>cur){CooksterPan.addIngredient(v,KEY,n-cur);try{rememberPanIngredientMeta(v,metaFor(v));}catch(e){}}
    else if(n<cur){CooksterPan.removeIngredient(v,KEY,cur-n);}
  }else{
    var m=CooksterContainer.read(v);m.items=m.items||{};
    if(n<=0)delete m.items[KEY];else m.items[KEY]=Object.assign({},metaFor(v),{count:n});
    CooksterContainer.write(v,m);
  }
  if(n<=0){delete v.dataset.minceLuk;delete v.dataset.mincePap;}
  rerender(v);
}
function room(v){try{return Math.max(0,containerCapacity(v)-containerTotal(v));}catch(e){return PER_BAG;}}

// the bag from the fridge is in the hand: it is poured into the bowl
function pour(bag,v){
  if(!isBowl(v)){toast('Mleveno meso ide u vanglu ili činiju.');return true;}
  var left=Math.max(0,+bag.dataset.minceLeft||PER_BAG),r=Math.floor(room(v)),add=Math.min(left,r);
  if(add<1){toast('Nema mesta u posudi za meso.');return true;}
  setUnits(v,units(v)+add);
  try{playImpactSound(v,'drop');}catch(e){}
  left-=add;
  if(left<=0){try{removeItem(bag);}catch(e){}try{holding=null;hidePlacementGhost();hideOriginGhost();clearPanTargets();updateHover();}catch(e){}toast('Mleveno meso je u posudi.');}
  else{bag.dataset.minceLeft=String(left);toast('Posuda je puna — u kesi je ostalo još mesa.');}
  return true;
}
// chopped onion or garlic dropped into a bowl that has the meat: it is mixed in
function absorb(item,v){
  if(!isBowl(v)||units(v)<=0)return false;
  var k=item.dataset.vegKey;if((k!=='luk'&&k!=='beli_luk')||(item.dataset.cutState!=='diced'&&item.dataset.cutState!=='sliced'))return false;
  v.dataset.minceLuk='1';
  try{removeItem(item);}catch(e){}
  try{holding=null;hidePlacementGhost();hideOriginGhost();clearPanTargets();updateHover();}catch(e){}
  try{playImpactSound(v,'drop');}catch(e){}
  rerender(v);toast((k==='luk'?'Luk':'Beli luk')+' je umešan u meso.');return true;
}
function handle(item,v){
  if(!item||!item.dataset)return false;
  if(item.dataset.minceBag==='1')return pour(item,v);
  return absorb(item,v);
}

// the picture of the heap in the bowl (called while the food layer is built): placed by the mask of THIS vessel, like the ground pepper:
// it covers the blue floor first (2 units), and with the next ones it rises to the green food zone (6 units); the whole picture is scaled, never cut
var ART={"plain": [0.0273, 0.0456, 0.9705, 0.9544], "luk": [0.0295, 0.0417, 0.9705, 0.9583], "pap": [0.0295, 0.0413, 0.9705, 0.9587], "both": [0.0295, 0.0451, 0.9705, 0.9549]};
function layout(img,v,count){
  var g;try{g=groundPepperGeometry(v);}catch(e){return;}
  var uncal=!(g.visiblePoints&&g.visiblePoints.length>=3);
  if(uncal){      // a vessel without its drawn mask (tool "Maska posude"): a safe oval round the opening of a bowl
    g={bottom:{left:22,right:78,top:44,bottom:66},visible:{left:12,right:88,top:22,bottom:72},visibleClip:'ellipse(44% 31% at 50% 48%)'};
  }
  var s=state(v),a=ART[s.key],floorT=Math.min(1,count/2),riseT=Math.max(0,Math.min(1,(count-2)/4));
  var cx=(g.bottom.left+g.bottom.right)/2,cy=(g.bottom.top+g.bottom.bottom)/2,fw=(g.bottom.right-g.bottom.left)*floorT,fh=(g.bottom.bottom-g.bottom.top)*floorT;
  function lerp(x,y,t){return x+(y-x)*t;}
  var tl=lerp(cx-fw/2,g.visible.left,riseT),tr=lerp(cx+fw/2,g.visible.right,riseT),tt=lerp(cy-fh/2,g.visible.top,riseT),tb=lerp(cy+fh/2,g.visible.bottom,riseT);
  var W=(tr-tl)/(a[2]-a[0]),H=(tb-tt)/(a[3]-a[1]);
  img.style.left=(tl-a[0]*W).toFixed(3)+'%';img.style.top=(tt-a[1]*H).toFixed(3)+'%';img.style.width=Math.max(1,W).toFixed(3)+'%';img.style.height=Math.max(1,H).toFixed(3)+'%';
  var host=img.parentNode;if(host&&host.classList&&host.classList.contains('mince-host')){host.style.clipPath=g.visibleClip;host.style.webkitClipPath=g.visibleClip;}      // never outside of the green area the player drew for this vessel
}
function append(layer,v,count){
  if(!layer||!v)return;
  var s=state(v),img=document.createElement('img');
  img.className='whole-produce-piece mince-heap';img.dataset.entryKey=KEY;img.src=s.src;img.alt='';img.draggable=false;
  img.style.cssText='position:absolute;transform:none;object-fit:fill;pointer-events:none;filter:drop-shadow(0 1px 2px rgba(70,15,8,.22))';
  var host=document.createElement('div');host.className='mince-host';host.style.cssText='position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:30;overflow:visible';
  host.appendChild(img);layer.appendChild(host);layout(img,v,count);
}
function paint(v){var s=state(v),n=units(v);try{v.querySelectorAll('.mince-heap').forEach(function(i){if(i.getAttribute('src')!==s.src)i.src=s.src;layout(i,v,n);});}catch(e){}}

// a click on the heap: one ball in the hand
function takeBall(v,e){
  var n=units(v);if(n<=0)return false;
  var s=state(v),def=VEGETABLES.mleveno_loptica,p=screenToScene(e.clientX,e.clientY);
  setUnits(v,n-1);
  var w=def.w,h=def.h,ball=makeItem({id:'mleveno_loptica',label:def.label,src:def.src,x:p.x-w/2,y:p.y-h,w:w,h:h,z:++zCounter,snapProfile:'produce'});
  ball.dataset.vegetable='1';ball.dataset.collisionProfile='vegetable';ball.dataset.vegKey='mleveno_loptica';ball.dataset.cutState='whole';
  if(s.luk)ball.dataset.minceLuk='1';if(s.pap)ball.dataset.mincePap='1';
  ball.dataset.surfaceZone=v.dataset.surfaceZone==='stove'?'table':(v.dataset.surfaceZone||'table');
  setPose(ball,p.x,p.y,+v.dataset.vis||1);
  startHolding(ball);try{CooksterSave.schedule();}catch(x){}
  return true;
}

// the bag from the fridge
function fromFridge(){
  if(typeof holding!=='undefined'&&holding){toast('Ruke su ti pune — spusti prvo ono što držiš.');return;}
  var w=58,h=66,p=screenToScene(mouse.x,mouse.y);
  var bag=makeItem({id:'minceBag_'+Date.now(),label:'Mleveno meso (kesa)',src:BAG_SRC,x:p.x-w/2,y:p.y-h,w:w,h:h,z:++zCounter,snapProfile:'produce'});
  bag.dataset.ingredient='1';bag.dataset.ingredientKey='mleveno_meso_kesa';bag.dataset.minceBag='1';bag.dataset.minceLeft=String(PER_BAG);
  bag.dataset.surfaceZone='table';setPose(bag,p.x,p.y,1);
  startHolding(bag);
}

// the ball becomes a burger or cevapi (right click on it)
var menu=null;
function closeMenu(){if(menu){menu.remove();menu=null;}}
function ballAt(x,y){
  var l=(window.items||items),best=null;
  for(var i=l.length-1;i>=0;i--){var el=l[i];if(!el||!el.dataset||el.dataset.vegKey!=='mleveno_loptica'||el===window.holding)continue;var r=el.getBoundingClientRect();if(x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom){best=el;break;}}
  return best;
}
function shape(ball,kind){
  var def=VEGETABLES[kind],n=kind==='cevap'?CEVAPI:1,cx=+ball.dataset.cx,by=+ball.dataset.by,vis=+ball.dataset.vis||1,zone=ball.dataset.surfaceZone||'table';
  var onBoard=ball.dataset.attachedToBoard==='1',board=null;try{board=getBoardEl();}catch(e){}
  var rx=+ball.dataset.boardRelX||0,ry=+ball.dataset.boardRelY||.55;
  try{removeItem(ball);}catch(e){}
  for(var i=0;i<n;i++){
    var dy=n>1?(i-(n-1)/2)*(def.h*vis*.8):0;
    var el=makeItem({id:kind,label:def.label,src:def.src,x:cx-def.w/2,y:by-def.h,w:def.w,h:def.h,z:++zCounter,snapProfile:'produce'});
    el.dataset.vegetable='1';el.dataset.collisionProfile='vegetable';el.dataset.vegKey=kind;el.dataset.cutState='whole';el.dataset.surfaceZone=zone;
    if(ball.dataset.minceLuk)el.dataset.minceLuk='1';if(ball.dataset.mincePap)el.dataset.mincePap='1';
    setPose(el,cx,by+dy,vis);
    if(onBoard&&board){el.dataset.attachedToBoard='1';el.dataset.boardRelX=String(rx);el.dataset.boardRelY=String(ry+(n>1?(i-(n-1)/2)*.2:0));el.dataset.boardRelAngle='0';try{syncOneBoardAttachment(el,board);}catch(e){}}
  }
  try{CooksterSave.schedule();}catch(e){}
  toast(kind==='cevap'?'Napravljeno je '+CEVAPI+' ćevapa.':'Napravljena je pljeskavica.');
}
function openMenu(ball,x,y){
  closeMenu();menu=document.createElement('div');
  Object.assign(menu.style,{position:'fixed',left:x+'px',top:y+'px',zIndex:'30000',display:'flex',flexDirection:'column',gap:'5px',padding:'7px',background:'rgba(39,28,19,.96)',border:'1px solid rgba(255,220,150,.75)',borderRadius:'7px',boxShadow:'0 5px 18px rgba(0,0,0,.45)',color:'#fff',font:'600 13px/1.2 system-ui,sans-serif'});
  menu.addEventListener('pointerdown',function(e){e.stopPropagation();});menu.addEventListener('contextmenu',function(e){e.preventDefault();});
  var t=document.createElement('strong');t.textContent='Oblikuj';t.style.padding='2px 5px 4px';menu.appendChild(t);
  [['Pljeskavica','pljeskavica'],['Ćevapi ('+CEVAPI+')','cevap']].forEach(function(o){
    var b=document.createElement('button');b.type='button';b.textContent=o[0];
    Object.assign(b.style,{border:'0',borderRadius:'5px',padding:'7px 10px',cursor:'pointer',background:'#f0c36a',color:'#2a1a0e',font:'700 13px system-ui'});
    b.onclick=function(){closeMenu();shape(ball,o[1]);};menu.appendChild(b);
  });
  document.body.appendChild(menu);
  var r=menu.getBoundingClientRect();menu.style.left=Math.max(6,Math.min(innerWidth-r.width-6,x))+'px';menu.style.top=Math.max(6,Math.min(innerHeight-r.height-6,y))+'px';
}
window.addEventListener('contextmenu',function(e){
  try{if(typeof holding!=='undefined'&&holding)return;}catch(x){}
  var b=ballAt(e.clientX,e.clientY);
  if(!b){closeMenu();return;}
  e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();openMenu(b,e.clientX,e.clientY);
},true);
window.addEventListener('pointerdown',function(e){if(menu&&!menu.contains(e.target))closeMenu();},true);

// stretching the ball with the mouse (like the dough): hold the left button on the ball and drag anywhere; the more you move the mouse the further the ball is pulled out:
// the pictures of the phases (ball -> flatter and flatter -> burger) follow one another; the last one is the raw burger. A plain click still picks the ball up.
// FRAMES: [picture, width, height] of every phase after the ball; put the drawn phases here (the same transparent canvas, in the order of stretching)
var FRAMES=[['assets/meat/mleveno_faza_1.png',54,36],['assets/meat/mleveno_faza_2.png',68,29],['assets/meat/mleveno_faza_3.png',78,24]];
var STEP=60;      // pixels of dragging for one phase
var st=null;
function setFrame(el,i){      // i: 0 = the ball, 1..FRAMES.length = the phases
  var f=i<=0?[VEGETABLES.mleveno_loptica.src,VEGETABLES.mleveno_loptica.w,VEGETABLES.mleveno_loptica.h]:FRAMES[Math.min(i,FRAMES.length)-1];
  var bd=el.querySelector('.body');if(bd)bd.src=f[0];
  el.dataset.baseW=f[1];el.dataset.baseH=f[2];el.dataset.minceStage=String(i);
  try{setPose(el,+el.dataset.cx,+el.dataset.by,+el.dataset.vis||1);if(el.dataset.attachedToBoard==='1'){var bd2=getBoardEl();if(bd2)syncOneBoardAttachment(el,bd2);}}catch(e){}
}
function toBurger(el){
  var def=VEGETABLES.pljeskavica,bd=el.querySelector('.body');if(bd)bd.src=def.src;
  el.dataset.vegKey='pljeskavica';el.dataset.itemId='pljeskavica';el.dataset.baseW=def.w;el.dataset.baseH=def.h;el.dataset.label=def.label;delete el.dataset.minceStage;
  try{setPose(el,+el.dataset.cx,+el.dataset.by,+el.dataset.vis||1);if(el.dataset.attachedToBoard==='1'){var b=getBoardEl();if(b)syncOneBoardAttachment(el,b);}}catch(e){}
  try{CooksterSave.schedule();}catch(e){}toast('Napravljena je pljeskavica.');
}
window.addEventListener('pointerdown',function(e){
  if(e.button!==0)return;try{if(typeof holding!=='undefined'&&holding)return;}catch(x){}
  var b=ballAt(e.clientX,e.clientY);if(!b)return;
  st={ball:b,x:e.clientX,y:e.clientY,x0:e.clientX,y0:e.clientY,path:0,s0:+b.dataset.minceStage||0,moved:false};
  e.preventDefault();e.stopImmediatePropagation();
},true);
window.addEventListener('pointermove',function(e){
  if(!st)return;
  if(!st.moved&&Math.hypot(e.clientX-st.x0,e.clientY-st.y0)<7)return;
  st.moved=true;st.path+=Math.hypot(e.clientX-st.x,e.clientY-st.y);st.x=e.clientX;st.y=e.clientY;
  var stage=st.s0+Math.floor(st.path/STEP);
  if(stage>FRAMES.length){var b=st.ball;st=null;toBurger(b);return;}
  if(stage!==(+st.ball.dataset.minceStage||0))setFrame(st.ball,stage);
  e.preventDefault();
},true);
function endStretch(){
  if(!st)return;var s0=st;st=null;
  if(!s0.moved&&s0.ball.isConnected){try{startHolding(s0.ball);}catch(x){}}      // a plain click: the ball (or the half-pulled meat) is picked up
}
window.addEventListener('pointerup',endStretch,true);
window.addEventListener('pointercancel',endStretch,true);

// onion / pepper dropped or shaken in later: the bowl is drawn again (every 0.7 s only when something changed)
setInterval(function(){
  try{(window.items||items).forEach(function(v){
    if(!isBowl(v)||!v.isConnected)return;
    var n=units(v);if(n<=0){v._minceSig=null;return;}
    var sig=n+'|'+state(v).src;
    if(v._minceSig!==sig){v._minceSig=sig;rerender(v);}
  });}catch(e){}
},700);

window.CooksterMince={handle:handle,append:append,takeBall:takeBall,fromFridge:fromFridge,units:units,state:state,shape:shape,KEY:KEY};
})();
