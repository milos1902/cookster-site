(function(){
'use strict';
var SRC='assets/pantry/pantry-room.png';
var DUR=700,EASE='cubic-bezier(.45,.05,.25,1)';
var viewport=document.getElementById('viewport');
var scene=document.getElementById('scene');
if(!viewport||!scene||window.CooksterPantry)return;

var state='kitchen',busy=false,loaded=false,loading=null,lastFocus=null;
var saved=null,animations=[];
var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)');

function mk(tag,cls){var e=document.createElement(tag);if(cls)e.className=cls;return e}
function navBtn(label,dir){
  var b=mk('button','pantry-nav');b.type='button';
  var t=mk('span');t.textContent=label;
  var a=mk('span','pn-arrow '+(dir==='r'?'r':'l'));a.setAttribute('aria-hidden','true');
  a.textContent=dir==='r'?'\u2192':'\u2190';
  if(dir==='r'){b.appendChild(t);b.appendChild(a)}else{b.appendChild(a);b.appendChild(t)}
  return b;
}

var openBtn=navBtn('\u0161pajz','r');
openBtn.id='pantryOpenBtn';
openBtn.style.left='1540px';openBtn.style.top='265px';
openBtn.setAttribute('aria-label','\u0160pajz, desno');
scene.appendChild(openBtn);

var room=mk('div');room.id='pantryScene';
room.setAttribute('role','dialog');room.setAttribute('aria-modal','true');
room.setAttribute('aria-label','\u0160pajz');room.setAttribute('aria-hidden','true');
var backdrop=mk('div','ps-backdrop');
var art=mk('img','ps-art');art.alt='\u0160pajz';art.draggable=false;
var backBtn=navBtn('Kuhinja','l');backBtn.setAttribute('aria-label','Kuhinja, nazad levo');
room.appendChild(backdrop);room.appendChild(art);room.appendChild(backBtn);
document.body.appendChild(room);

var status=mk('span');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
status.style.cssText='position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)';
openBtn.appendChild(status);
function say(msg){
  openBtn.title=msg||'';status.textContent=msg||'';
  if(msg)openBtn.setAttribute('data-blocked','1');else openBtn.removeAttribute('data-blocked');
}

['pointerdown','pointerup','pointermove','mousedown','mouseup','mousemove','click','dblclick','contextmenu','touchstart','touchmove','touchend','touchcancel','wheel'].forEach(function(n){
  room.addEventListener(n,function(e){e.stopPropagation()},{passive:true});
  openBtn.addEventListener(n,function(e){e.stopPropagation()},{passive:true});
});

function preload(){
  if(loaded)return Promise.resolve(true);
  if(loading)return loading;
  loading=new Promise(function(res){
    var im=new Image();
    im.onload=function(){loaded=true;art.src=SRC;backdrop.style.backgroundImage='url("'+SRC+'")';loading=null;res(true)};
    im.onerror=function(){loading=null;res(false)};
    im.src=SRC;
  });
  return loading;
}

function held(){
  try{return !!(window.CooksterBackpackController&&window.CooksterBackpackController.hasHeldItem&&window.CooksterBackpackController.hasHeldItem())}catch(_){return true}
}

function run(el,fr){
  if(typeof el.animate!=='function')return Promise.resolve();
  var a=el.animate(fr,{duration:(reduce&&reduce.matches)?220:DUR,easing:EASE,fill:'both'});
  animations.push(a);
  return a.finished;
}
function turnCamera(direction){
  if(reduce&&reduce.matches){
    var outgoing=direction===1?viewport:room;
    var incoming=direction===1?room:viewport;
    return Promise.all([
      run(outgoing,[{opacity:1},{opacity:0}]),
      run(incoming,[{opacity:0},{opacity:1}])
    ]);
  }
  if(!window.CooksterPantryCamera)throw new Error('Panoramic camera module is missing');
  var animation=window.CooksterPantryCamera.turn({
    kitchen:viewport,pantry:room,direction:direction,duration:DUR
  });
  animations.push(animation);
  return animation.finished;
}

function setInert(el,v){try{el.inert=v}catch(_){}if(v)el.setAttribute('inert','');else el.removeAttribute('inert')}
function cancelAnimations(){
  animations.forEach(function(a){a.cancel()});
  animations=[];
}
function restoreKitchen(){
  room.classList.remove('is-active');room.setAttribute('aria-hidden','true');
  room.style.opacity='';
  if(saved){
    viewport.style.visibility=saved.vis;
    viewport.style.pointerEvents=saved.pe;
    setInert(viewport,saved.hadInert);
    if(saved.cursorEl)saved.cursorEl.style.display=saved.cur;
    if(saved.labEl)saved.labEl.style.display=saved.lab;
  }
  document.body.classList.remove('pantry-open');
  saved=null;state='kitchen';busy=false;
  cancelAnimations();
}

function open(){
  if(busy||state==='pantry')return Promise.resolve(false);
  if(held()){say('Prvo spusti predmet iz ruke.');return Promise.resolve(false)}
  busy=true;say('');
  return preload().then(function(ok){
    if(!ok){say('Slika \u0161pajza nije u\u010ditana.');busy=false;return false}
    if(held()){say('Prvo spusti predmet iz ruke.');busy=false;return false}
    lastFocus=document.activeElement;
    var cur=document.getElementById('cursor'),lab=document.getElementById('label');
    saved={vis:viewport.style.visibility,pe:viewport.style.pointerEvents,
      cur:cur&&cur.style.display,lab:lab&&lab.style.display,
      hadInert:viewport.hasAttribute('inert'),cursorEl:cur,labEl:lab};
    if(cur)cur.style.display='none';if(lab)lab.style.display='none';
    viewport.style.pointerEvents='none';
    setInert(viewport,true);
    document.body.classList.add('pantry-open');
    room.classList.add('is-active');room.setAttribute('aria-hidden','false');
    room.style.opacity='0';
    state='opening';
    return turnCamera(1).then(function(){
      viewport.style.visibility='hidden';
      room.style.opacity='';
      state='pantry';busy=false;
      cancelAnimations();
      backBtn.focus({preventScroll:true});
      return true;
    });
  }).catch(function(){
    restoreKitchen();say('Prelaz nije uspeo. Pokušaj ponovo.');return false;
  });
}

function close(){
  if(busy||state!=='pantry')return Promise.resolve(false);
  busy=true;state='closing';
  viewport.style.visibility=saved?saved.vis:'';
  var movement;
  try{movement=turnCamera(-1)}
  catch(error){
    restoreKitchen();say('Prelaz nije uspeo. Kuhinja je ponovo dostupna.');
    return Promise.resolve(false);
  }
  return movement.then(function(){
    restoreKitchen();
    var f=lastFocus&&document.contains(lastFocus)?lastFocus:openBtn;
    try{f.focus({preventScroll:true})}catch(_){}
    return true;
  }).catch(function(){
    restoreKitchen();say('Prelaz je prekinut. Kuhinja je ponovo dostupna.');return false;
  });
}

openBtn.addEventListener('click',function(e){e.stopPropagation();open()});
openBtn.addEventListener('pointerenter',function(){if(!busy&&!held())say('')});
openBtn.addEventListener('focus',function(){if(!busy&&!held())say('')});
backBtn.addEventListener('click',function(e){e.stopPropagation();close()});

function onKey(e){
  if(state==='kitchen')return;
  if(e.type==='keydown'){
    if(e.key==='Escape'){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();close();return}
    if(e.key==='Tab'){
      e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
      if(state==='pantry')backBtn.focus({preventScroll:true});
      return;
    }
  }
  e.stopPropagation();e.stopImmediatePropagation();
}
window.addEventListener('keydown',onKey,true);
window.addEventListener('keyup',onKey,true);
window.addEventListener('keypress',onKey,true);

window.CooksterPantry={
  open:open,close:close,
  get current(){return state==='pantry'?'pantry':state==='kitchen'?'kitchen':state},
  get isOpen(){return state==='pantry'},
  get busy(){return busy}
};
})();
