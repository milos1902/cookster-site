/* Cookster: minced meat, the ball, the burger (pljeskavica) and the cevap.
   - The fridge (the dock) gives a bag of minced meat. It is poured into any bowl or "vangla" / basin (not on the board): 6 units of the ingredient `mleveno_meso`.
   - Chopped onion / garlic dropped into the bowl is mixed into the meat (flag minceLuk); the ground pepper from the jar (dataset.spices tucana / paprika) gives the red pepper.
     The picture of the heap follows what is in it: plain, onion, pepper, onion + pepper (assets/meat/mleveno_*.png), in whatever order they were added.
   - A click on the heap takes one ball (a unit) in the hand; on the board a right click on the ball: "Pljeskavica" (one) or "Ćevapi" (four). */
(function(){
'use strict';
if(window.CooksterMince)return;
var KEY='mleveno_meso',NK='mleveno_nadev_diced',NADEV_ID='kal_01_mleveno_nadev',RK='pirinac_diced',RICE_ID='kal_01_pirinac',PER_BAG=6,CEVAPI=4;      // NK: the minced meat for the filling (sarma, peppers): comes without the bag, never makes a ball
var IMG={plain:'assets/meat/mleveno_gomila.png',luk:'assets/meat/mleveno_luk.png',pap:'assets/meat/mleveno_paprika.png',both:'assets/meat/mleveno_luk_paprika.png'};
var BAG_SRC='assets/meat/mleveno_kesa.png';
function toast(m){try{showToast(m);}catch(e){}}
function isBowl(v){return !!v&&/^(vangla_|lavor_|kal_02_cinija_)/.test((v.dataset&&v.dataset.itemId)||'');}
function heatable(v){try{return isHeatableCookwareItem(v);}catch(e){return false;}}
function unitsOf(v,key){
  try{
    if(heatable(v))return Math.max(0,+((CooksterPan.read(v).ingredients||{})[key])||0);
    var e=(CooksterContainer.read(v).items||{})[key];return e?Math.max(0,+e.count||0):0;
  }catch(e){return 0;}
}
function units(v){return unitsOf(v,KEY)+unitsOf(v,NK);}
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
function addNadev(item,v){
  if(!(heatable(v)||isBowl(v))){toast('Nadev ide u tiganj, šerpu ili vanglu.');return true;}
  try{if(heatable(v)&&CooksterPan.read(v).burnt){toast('Posuđe je zagorelo — operi ga pre nove ture.');return true;}}catch(e){}
  try{if(containerTotal(v)>=containerCapacity(v)){toast('Posuda je puna.');return true;}}catch(e){}
  var meta={key:NK,type:'ingredient',label:'Mleveno meso (nadev)',src:window.CooksterMinceAtlas||IMG.plain,form:'diced',baseKey:'mleveno_nadev',cutState:'diced'};      // src = the atlas of single crumbs: every crumb is a piece of the simulation, like the chopped onion
  if(heatable(v)){CooksterPan.addIngredient(v,NK,1);try{rememberPanIngredientMeta(v,meta);}catch(e){}}
  else{var m=CooksterContainer.read(v);m.items=m.items||{};var cur=m.items[NK]?Math.max(0,+m.items[NK].count||0):0;m.items[NK]=Object.assign({},meta,{count:cur+1});CooksterContainer.write(v,m);}
  try{removeItem(item);}catch(e){}
  try{holding=null;hidePlacementGhost();hideOriginGhost();clearPanTargets();updateHover();}catch(e){}
  try{playImpactSound(v,'drop');}catch(e){}
  try{rerender(v);}catch(e){}return true;
}
function addRice(item,v){
  if(!(heatable(v)||isBowl(v))){toast('Pirinač ide u tiganj, šerpu ili vanglu.');return true;}
  try{if(heatable(v)&&CooksterPan.read(v).burnt){toast('Posuđe je zagorelo — operi ga pre nove ture.');return true;}}catch(e){}
  try{if(containerTotal(v)>=containerCapacity(v)){toast('Posuda je puna.');return true;}}catch(e){}
  var meta={key:RK,type:'ingredient',label:'Pirinač',src:window.CooksterRiceAtlas||'assets/ingredients/pirinac_diced.webp',form:'diced',baseKey:'pirinac',cutState:'diced'};      // every grain is a piece of the simulation (like the chopped onion)
  if(heatable(v)){CooksterPan.addIngredient(v,RK,1);try{rememberPanIngredientMeta(v,meta);}catch(e){}}
  else{var m=CooksterContainer.read(v);m.items=m.items||{};var cur=m.items[RK]?Math.max(0,+m.items[RK].count||0):0;m.items[RK]=Object.assign({},meta,{count:cur+1});CooksterContainer.write(v,m);}
  try{removeItem(item);}catch(e){}
  try{holding=null;hidePlacementGhost();hideOriginGhost();clearPanTargets();updateHover();}catch(e){}
  try{playImpactSound(v,'drop');}catch(e){}
  try{rerender(v);}catch(e){}return true;
}
// the rice in a vessel: the white grains cover the floor (a few grains with one dose, more layers with the next ones), above the meat; drawn after the meat
function appendRice(layer,v,count){
  if(!layer||!v)return;var host=document.createElement('div');host.className='rice-host';host.style.cssText='position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:31;overflow:visible';
  var n=Math.max(1,Math.min(4,Math.round(count))),rots=[0,180,0,180],sc=[1,1,1.03,1.03],tx=[0,2,-3,3],ty=[0,-2,3,-3];      // turned by 180 degrees only: the oval of the grains stays an oval (other angles made a star)
  for(var i=0;i<n;i++){var im=document.createElement('img');im.className='whole-produce-piece rice-grains';im.dataset.entryKey=RK;im.src='assets/ingredients/pirinac_diced.webp?v=1';im.draggable=false;im.alt='';
    im.style.cssText='position:absolute;pointer-events:none;object-fit:fill;transform:translate('+tx[i]+'%,'+ty[i]+'%) rotate('+rots[i]+'deg) scale('+sc[i]+');filter:drop-shadow(0 1px 1px rgba(40,20,5,.35))';
    host.appendChild(im);layout(im,v,Math.max(2,count));}
  layer.appendChild(host);
}
function handle(item,v){
  if(!item||!item.dataset)return false;
  if(item.dataset.itemId===RICE_ID)return addRice(item,v);
  if(item.dataset.itemId===NADEV_ID)return addNadev(item,v);
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
  var s=state(v),a=ART[s.key],floorT=heatable(v)?1:Math.min(1,count/2),riseT=Math.max(0,Math.min(1,(count-2)/4));
  var cx=(g.bottom.left+g.bottom.right)/2,cy=(g.bottom.top+g.bottom.bottom)/2,fw=(g.bottom.right-g.bottom.left)*floorT,fh=(g.bottom.bottom-g.bottom.top)*floorT;
  function lerp(x,y,t){return x+(y-x)*t;}
  var tl=lerp(cx-fw/2,g.visible.left,riseT),tr=lerp(cx+fw/2,g.visible.right,riseT),tt=lerp(cy-fh/2,g.visible.top,riseT),tb=lerp(cy+fh/2,g.visible.bottom,riseT);
  var W=(tr-tl)/(a[2]-a[0]),H=(tb-tt)/(a[3]-a[1]);
  img.style.left=(tl-a[0]*W).toFixed(3)+'%';img.style.top=(tt-a[1]*H).toFixed(3)+'%';img.style.width=Math.max(1,W).toFixed(3)+'%';img.style.height=Math.max(1,H).toFixed(3)+'%';
  var host=img.parentNode;if(host&&host.classList&&host.classList.contains('mince-host')){host.style.clipPath=g.visibleClip;host.style.webkitClipPath=g.visibleClip;}      // never outside of the green area the player drew for this vessel
}
var CR={raw:'assets/meat/mleveno_meso_diced.webp?v=1',fried:'assets/meat/mleveno_meso_diced_fried.webp?v=1'};[CR.raw,CR.fried].forEach(function(u){var i=new Image();i.src=u;});
function crumbOf(v){return Math.max(0,Math.min(1,+v._crumb||0));}
function doneOf(v){      // cooked meat never goes back to raw: its own clock grows while the pan is hot (about 70 s of a good heat), and the game's doneness can only push it up
  try{var m=CooksterPan.read(v),d=Math.max(0,Math.min(1,(+m.doneness||0)/.9)),t=performance.now();
    if(units(v)<=0){v._doneMax=0;v._doneT=t;return 0;}
    var dt=Math.min(1,(t-(v._doneT||t))/1000);v._doneT=t;var hot=+m.heat||0;
    if(hot>.3)v._doneMax=Math.min(1,(v._doneMax||0)+dt*hot/70);
    if(d>(v._doneMax||0))v._doneMax=d;return v._doneMax||0;
  }catch(e){return v._doneMax||0;}
}
// the crumbs fill the floor of the pan like the heap does (same layout, a little wider); the raw and the fried picture cross-fade with the doneness
function paintCrumbs(v){
  if(!heatable(v))return;var hosts=v.querySelectorAll('.mince-host');if(!hosts.length)return;for(var hi=0;hi<hosts.length-1;hi++){if(hosts[hi].parentNode)hosts[hi].parentNode.removeChild(hosts[hi]);}var host=hosts[hosts.length-1];var c=crumbOf(v),d=doneOf(v),n=units(v);
  var heap=host.querySelector('.mince-heap');
  // one dose: the crumbs cover the whole floor but the floor is seen between them; the SECOND dose fills these gaps, every next dose fills more (a heap under the crumbs): a heap of meat under the crumbs (it goes brown as the meat fries)
  // and several layers of crumbs one over another, turned and shifted, so no gap is left
  if(heap){heap.style.transform='rotate(var(--stir-turn,0deg))';heap.style.opacity=(n>=2?1:1-c).toFixed(2);heap.style.filter=n>=2?'brightness('+(1-.5*d).toFixed(2)+') saturate('+(1-.35*d).toFixed(2)+') drop-shadow(0 1px 2px rgba(70,15,8,.22))':'drop-shadow(0 1px 2px rgba(70,15,8,.22))';}
  var layers=Math.max(1,Math.min(3,n)),rots=[0,63,-41],sc=[1,1.08,1.05],tx=[0,5,-4],ty=[0,-4,5];
  ['raw','fried'].forEach(function(k){
    for(var i=0;i<3;i++){
      var im=host.querySelector('.mince-crumbs-'+k+'-'+i);
      if(i>=layers){if(im)im.style.opacity='0';continue;}
      if(!im){im=document.createElement('img');im.className='mince-crumbs-'+k+'-'+i;im.src=CR[k];im.draggable=false;im.alt='';im.style.cssText='position:absolute;pointer-events:none;object-fit:fill;opacity:0';host.appendChild(im);}
      layout(im,v,Math.max(2,n));      // the crumbs cover the whole floor of the pan already with ONE dose (with gaps between them); every next dose makes the heap higher
      im.style.transform='translate('+tx[i]+'%,'+ty[i]+'%) rotate(calc('+rots[i]+'deg + var(--stir-turn,0deg))) scale('+sc[i]+')';
      im.style.opacity=(k==='raw'?c*(1-d):c*d).toFixed(2);
    }
  });
}
function append(layer,v,count,key){
  if(!layer||!v)return;
  var s=state(v),img=document.createElement('img');
  img.className='whole-produce-piece mince-heap';img.dataset.entryKey=key||KEY;img.src=s.src;img.alt='';img.draggable=false;
  img.style.cssText='position:absolute;transform:none;object-fit:fill;pointer-events:none;filter:drop-shadow(0 1px 2px rgba(70,15,8,.22))';
  var host=document.createElement('div');host.className='mince-host';host.style.cssText='position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:30;overflow:visible';
  host.appendChild(img);layer.appendChild(host);layout(img,v,count);try{paintCrumbs(v);}catch(e){}
}
function paint(v){var s=state(v),n=units(v);paintCrumbs(v);try{v.querySelectorAll('.mince-heap').forEach(function(i){if(i.getAttribute('src')!==s.src)i.src=s.src;layout(i,v,n);});}catch(e){}}

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
  var bag=makeItem({id:'minceBag',label:'Mleveno meso (kesa)',src:BAG_SRC,x:p.x-w/2,y:p.y-h,w:w,h:h,z:++zCounter,snapProfile:'produce'});
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
    var bf=null,sp0=ball.dataset.minceLuk==='1'||ball.dataset.mincePap==='1';if(kind==='pljeskavica')bf=sp0?BURGER.spiced:BURGER.plain;else if(kind==='cevap')bf=sp0?CEVAP.spiced:CEVAP.plain;
    var el=makeItem({id:kind,label:def.label,src:bf?bf[0]:def.src,x:cx-def.w/2,y:by-def.h,w:bf?bf[1]:def.w,h:bf?bf[2]:def.h,z:++zCounter,snapProfile:'produce'});
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

// shaping the ball like with the palms: hold the left button on the meat and go ROUND in a circle over it. The meat is spread out slowly while you circle: the pictures
// (ball -> flatter -> flatter -> burger) melt one into the other and the size grows with them; going in a line does nothing to the shape, but where you pull the meat it
// stretches a little towards the mouse (like the dough) and springs back. A plain click picks the meat up.
// KF: [picture, width, height] of the key pictures after the ball's own one; BURGER: the last picture depends on what is in the meat
var KF=[['assets/meat/mleveno_loptica.png',48,44],['assets/meat/mleveno_faza_2.png',62,45],['assets/meat/mleveno_faza_3.png',72,48]];
var BURGER={plain:['assets/meat/pljeskavica_obicna.png',80,61],spiced:['assets/meat/pljeskavica_zacinjena.png',80,68]};
// the cevap: the same, but rolled back and forth over the meat instead of circling
var KFC=[['assets/meat/mleveno_loptica.png',48,44],['assets/meat/cevap_faza_1.png',54,43],['assets/meat/cevap_faza_2.png',60,46],['assets/meat/cevap_faza_3.png',66,47]];
var CEVAP={plain:['assets/meat/cevap_obican.png',70,46],spiced:['assets/meat/cevap_zacinjen.png',70,46]};
var TOTAL_ROLL=1100;      // pixels of rolling for the whole way from the ball to the cevap
var TOTAL_RAD=12;      // radians of circling for the whole way from the ball to the burger (about two full turns)
var st=null;
(function(){KF.concat(KFC,[BURGER.plain,BURGER.spiced,CEVAP.plain,CEVAP.spiced]).forEach(function(f){var im=new Image();im.src=f[0];});})();
function lerp(a,b,t){return a+(b-a)*t;}
function cevapFor(el){return (el.dataset.minceLuk==='1'||el.dataset.mincePap==='1')?CEVAP.spiced:CEVAP.plain;}
function burgerFor(el){return (el.dataset.minceLuk==='1'||el.dataset.mincePap==='1')?BURGER.spiced:BURGER.plain;}
function fadeOf(el){
  if(!el._fade||!el._fade.isConnected){var im=document.createElement('img');im.className='mince-fade';im.alt='';im.draggable=false;im.style.cssText='position:absolute;left:0;top:0;width:100%;height:100%;object-fit:fill;pointer-events:none;opacity:0';el.appendChild(im);el._fade=im;}
  return el._fade;
}
function setSrc(img,src){if(img.getAttribute('src')!==src)img.src=src;}
function applyPhase(el,p){      // p: 0 = the ball ... 1 = the burger
  p=Math.max(0,Math.min(.999,p));el.dataset.mincePhase=String(p);
  var C=el.dataset.minceTrack==='cevap',K=C?KFC:KF,x=p*3,i=Math.min(2,Math.floor(x)),t=x-i,A=K[i],B=i<2?K[i+1]:(C?cevapFor(el):burgerFor(el)),bd=el.querySelector('.body'),fd=fadeOf(el);
  if(bd)setSrc(bd,A[0]);setSrc(fd,B[0]);fd.style.opacity=t.toFixed(3);
  el.dataset.baseW=lerp(A[1],B[1],t).toFixed(1);el.dataset.baseH=lerp(A[2],B[2],t).toFixed(1);
  try{setPose(el,+el.dataset.cx,+el.dataset.by,+el.dataset.vis||1);if(el.dataset.attachedToBoard==='1'){var b2=getBoardEl();if(b2)syncOneBoardAttachment(el,b2);}}catch(e){}
}
function toBurger(el){
  var f=burgerFor(el),bd=el.querySelector('.body');
  if(bd)setSrc(bd,f[0]);if(el._fade){el._fade.remove();el._fade=null;}
  el.dataset.vegKey='pljeskavica';el.dataset.itemId='pljeskavica';el.dataset.baseW=f[1];el.dataset.baseH=f[2];el.dataset.label=VEGETABLES.pljeskavica.label;delete el.dataset.mincePhase;delete el.dataset.minceTrack;
  stretchTo(el,0,0,1,true);
  try{setPose(el,+el.dataset.cx,+el.dataset.by,+el.dataset.vis||1);if(el.dataset.attachedToBoard==='1'){var b=getBoardEl();if(b)syncOneBoardAttachment(el,b);}}catch(e){}
  try{CooksterSave.schedule();}catch(e){}toast('Napravljena je pljeskavica.');
}
function toCevap(el){
  var f=cevapFor(el),bd=el.querySelector('.body');
  if(bd)setSrc(bd,f[0]);if(el._fade){el._fade.remove();el._fade=null;}
  el.dataset.vegKey='cevap';el.dataset.itemId='cevap';el.dataset.baseW=f[1];el.dataset.baseH=f[2];el.dataset.label=VEGETABLES.cevap.label;delete el.dataset.mincePhase;delete el.dataset.minceTrack;
  stretchTo(el,0,0,1,true);
  try{setPose(el,+el.dataset.cx,+el.dataset.by,+el.dataset.vis||1);if(el.dataset.attachedToBoard==='1'){var b=getBoardEl();if(b)syncOneBoardAttachment(el,b);}}catch(e){}
  try{CooksterSave.schedule();}catch(e){}toast('Napravljen je ćevap.');
}
// where the meat is pulled it stretches a little towards the mouse; let go: it springs back
function stretchTo(el,dx,dy,r,release){
  var els=[el.querySelector('.body'),el._fade].filter(Boolean),tf='none',sc=(typeof scale!=='undefined'&&+scale)||1;
  if(!release){var d=Math.hypot(dx,dy),s=Math.min(.32,d/(r*6)),ang=Math.atan2(dy,dx)*180/Math.PI;
    tf='translate('+(dx/sc*.1).toFixed(1)+'px,'+(dy/sc*.1).toFixed(1)+'px) rotate('+ang.toFixed(1)+'deg) scale('+(1+s).toFixed(3)+','+(1-s*.3).toFixed(3)+') rotate('+(-ang).toFixed(1)+'deg)';}
  els.forEach(function(n){n.style.transition=release?'transform .35s cubic-bezier(.3,1.5,.5,1)':'none';n.style.transformOrigin='50% 60%';n.style.transform=tf;});
}
function centerOf(el){var r=el.getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2,Math.max(r.width,r.height)/2];}
window.addEventListener('pointerdown',function(e){
  if(e.button!==0)return;try{if(typeof holding!=='undefined'&&holding)return;}catch(x){}
  var b=ballAt(e.clientX,e.clientY);if(!b)return;
  if(!window.__minceHint){window.__minceHint=1;toast('Drži klik i kruži mišem oko mesa da ga oblikuješ.');}
  st={ball:b,x0:e.clientX,y0:e.clientY,moved:false,ang:null,rot:0,p0:+b.dataset.mincePhase||0,track:b.dataset.minceTrack||'',px:e.clientX,py:e.clientY,path:0,rev:0,dirx:0,sx:e.clientX,roll:0};
  e.preventDefault();e.stopImmediatePropagation();
},true);
window.addEventListener('pointermove',function(e){
  if(!st)return;
  if(!st.moved&&Math.hypot(e.clientX-st.x0,e.clientY-st.y0)<7)return;
  st.moved=true;
  var c=centerOf(st.ball),dx=e.clientX-c[0],dy=e.clientY-c[1],d=Math.hypot(dx,dy);
  stretchTo(st.ball,dx,dy,c[2]);
  st.x1=Math.min(st.x1==null?e.clientX:st.x1,e.clientX);st.x2=Math.max(st.x2==null?e.clientX:st.x2,e.clientX);st.y1=Math.min(st.y1==null?e.clientY:st.y1,e.clientY);st.y2=Math.max(st.y2==null?e.clientY:st.y2,e.clientY);
  if(d<5||d>Math.max(c[2]*6,150)){st.ang=null;}      // right on the middle or very far from the meat: no circling is counted (a big circle round a small ball is fine)
  else{var a=Math.atan2(dy,dx);
    if(st.ang!=null){var da=a-st.ang;while(da>Math.PI)da-=2*Math.PI;while(da<-Math.PI)da+=2*Math.PI;if(Math.abs(da)<2.4){st.rot+=Math.abs(da);st.sig=(st.sig||0)+da;}}      // the angle travelled round the meat (either way); sig = the net turn (going back and forth cancels out)
    st.ang=a;}
  // rolling back and forth (the cevap): the path of the mouse counts, with changes of direction
  st.path+=Math.hypot(e.clientX-st.px,e.clientY-st.py);
  var ddx=e.clientX-st.sx;if(Math.abs(ddx)>14){var dr=ddx>0?1:-1;if(st.dirx&&dr!==st.dirx)st.rev++;st.dirx=dr;st.sx=e.clientX;}
  st.px=e.clientX;st.py=e.clientY;
  if(!st.track){      // the way of moving decides what is made: going round = a burger, back and forth = a cevap
    var xr=st.x2-st.x1,yr=st.y2-st.y1;      // the shape of the way of the mouse: flat (left-right) = a cevap, round = a burger
    if(xr>=28&&yr<=xr*.5&&st.rev>=1)st.track='cevap';else if(Math.abs(st.sig||0)>1.8&&yr>xr*.55&&xr>=20)st.track='burger';
    if(st.track){st.ball.dataset.minceTrack=st.track;st.rot=Math.min(st.rot,0);st.roll=0;st.pathAtLock=st.path;}
  }
  if(!st.track){e.preventDefault();return;}
  if(st.track==='cevap'){
    var p2=st.p0+(st.path-st.pathAtLock)/TOTAL_ROLL;
    if(p2>=1){var bc=st.ball;st=null;toCevap(bc);return;}
    applyPhase(st.ball,p2);e.preventDefault();return;
  }
  var p=st.p0+st.rot/TOTAL_RAD;
  if(p>=1){var bl=st.ball;st=null;toBurger(bl);return;}
  applyPhase(st.ball,p);
  e.preventDefault();
},true);
function endStretch(){
  if(!st)return;var s0=st;st=null;
  if(s0.ball.isConnected)stretchTo(s0.ball,0,0,1,true);
  if(!s0.moved&&s0.ball.isConnected){try{startHolding(s0.ball);}catch(x){}}      // a plain click: the meat is picked up
}
window.addEventListener('pointerup',endStretch,true);
window.addEventListener('pointercancel',endStretch,true);

setInterval(function(){      // the meat in a pan crumbles while it is stirred (about 10 s of stirring), and a little by itself in a hot pan
  try{(window.items||items).forEach(function(v){
    if(!v.isConnected||!heatable(v)||units(v)<=0){return;}
    var stir=false;try{stir=(typeof stirring!=='undefined'&&stirring&&typeof stirVessel!=='undefined'&&stirVessel===v);}catch(e){}
    var hot=0;try{hot=+CooksterPan.read(v).heat||0;}catch(e){}
    var c=crumbOf(v),before=c;
    var mix=0;try{mix=+CooksterPan.read(v).mix||0;}catch(e){}      // the game's own measure of how much the pan has been stirred (0..1)
    if(stir)c=Math.min(1,c+.25/10*(hot>.25?1:.4));else if(hot>.4)c=Math.min(1,c+.25/90);
    c=Math.max(c,Math.min(1,mix*1.25),Math.min(1,doneOf(v)*1.4));
    v._crumb=c;if(c!==before||c>0)paintCrumbs(v);
  });}catch(e){}
},250);
// onion / pepper dropped or shaken in later: the bowl is drawn again (every 0.7 s only when something changed)
setInterval(function(){
  try{(window.items||items).forEach(function(v){
    if(!isBowl(v)||!v.isConnected)return;
    var n=units(v);if(n<=0){v._minceSig=null;return;}
    var sig=n+'|'+state(v).src;
    if(v._minceSig!==sig){v._minceSig=sig;rerender(v);}
  });}catch(e){}
},700);

// pouring a pan into another pan: the meat keeps how crumbled and how fried it is (the state of the picture lives on the vessel, so it is carried over together with the food)
(function(){
  var last=null;
  try{
    var vtp=window.vesselTransferPayload,mph=window.mergePayloadIntoHeatable;
    if(typeof vtp==='function'&&!vtp.__mince){var w1=function(src){var r=vtp.apply(this,arguments);try{if(src&&src._crumb!=null||src&&src._doneMax!=null)last={crumb:+src._crumb||0,done:+src._doneMax||0,t:performance.now()};}catch(e){}return r;};w1.__mince=true;window.vesselTransferPayload=w1;}
    if(typeof mph==='function'&&!mph.__mince){var w2=function(target,payload){var r=mph.apply(this,arguments);try{if(last&&performance.now()-last.t<15000&&target&&unitsOf(target,KEY)+unitsOf(target,NK)>0){target._crumb=Math.max(+target._crumb||0,last.crumb);target._doneMax=Math.max(+target._doneMax||0,last.done);paintCrumbs(target);}}catch(e){}return r;};w2.__mince=true;window.mergePayloadIntoHeatable=w2;}
  }catch(e){}
})();
window.CooksterMince={appendRice:appendRice,NK:NK,NADEV_ID:NADEV_ID,handle:handle,append:append,takeBall:takeBall,fromFridge:fromFridge,units:units,state:state,shape:shape,KEY:KEY};
})();
