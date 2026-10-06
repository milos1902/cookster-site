/* Cookster - the orders in the kitchen.
   When the waiter has taken an order in the tavern, he walks to the kitchen: the next time the kitchen is on the screen he walks in from the left,
   leaves a little paper on the table (the number of the table and what was ordered) and walks out again. A click on the paper opens it big.
   The papers are saved in the browser (cookster.kitchen-orders.v1), so they are there after a reload.
   The picture of the paper: assets/ui/order_note.webp (if it is missing, a plain paper drawn with CSS is used). */
(function(){
'use strict';
var scene=document.getElementById('scene');
if(!scene||window.CooksterOrders)return;
var W=1672,H=941,KEY='cookster.kitchen-orders.v1',WAITER='assets/tavern/waiter/waiter_walks',NOTE_IMG='assets/ui/order_note.webp?v=2';
var ITEM={name:'Kiseli kupus',extra:'ulje, tucana paprika',cyr:'Кисели купус',cyrExtra:'уље, туцана паприка'};           // the only dish for now
var TRIP_MS=3500;                                                      // how long the waiter needs from the tavern to the kitchen
var FLOOR_Y=705,STOP_X=560,SPEED=250,STAGE=120;                         // where he walks in the kitchen (scene pixels), how fast, the length of a step
var pending=[],notes=[],anim=null,uid=0,imgs=[];

function save(){try{localStorage.setItem(KEY,JSON.stringify({pending:pending,notes:notes,uid:uid}))}catch(_){}}
function load(){
  try{
    var o=JSON.parse(localStorage.getItem(KEY)||'null');
    if(o&&Array.isArray(o.pending)&&Array.isArray(o.notes)){
      pending=o.pending.filter(function(p){return p&&isFinite(p.id)&&isFinite(p.table)});
      notes=o.notes.filter(function(n){return n&&isFinite(n.id)&&isFinite(n.table)&&isFinite(n.x)&&isFinite(n.y)});
      uid=isFinite(o.uid)?o.uid:Math.max(0,pending.concat(notes).reduce(function(m,n){return Math.max(m,n.id)},0));
    }
  }catch(_){}
}
function mk(tag,cls){var e=document.createElement(tag);if(cls)e.className=cls;return e}

// ---------- looks ----------
var css=document.createElement('style');
css.textContent=
'#kitchenWaiter{position:absolute;left:0;top:0;width:'+W+'px;height:'+H+'px;pointer-events:none;z-index:46}'+
'.ko-note{position:absolute;height:var(--h,200px);aspect-ratio:820/1478;z-index:44;cursor:pointer;color:#17275c;font:700 calc(var(--h,200px)*.03)/1 "Segoe Print","Bradley Hand","Comic Sans MS",cursive;'+
  'background:url('+NOTE_IMG+') center/100% 100% no-repeat,linear-gradient(160deg,#f6e7c4,#e8cf9b);filter:drop-shadow(0 5px 7px rgba(40,20,5,.5));transition:transform .15s}'+
'.ko-note:hover{transform:scale(1.07) rotate(var(--r,0deg))}'+
// the handwriting goes into the rows of the table printed on the paper (row 1 and 2: the number of the table, the dish, the amount)
'.ko-c{position:absolute;white-space:nowrap;transform:translateY(-50%)}'+
'.ko-c.c1{left:5.1%;width:13.3%;text-align:center;top:39.6%;font-size:.86em}'+
'.ko-c.c2{left:20%;width:56%;text-align:left;top:39.6%}'+
'.ko-c.c3{left:77.7%;width:17%;text-align:center;top:39.6%}'+
'.ko-c.r2{top:44.1%;font-size:.82em;font-weight:600}'+
'.ko-drop{animation:koDrop .45s cubic-bezier(.3,.7,.3,1) both}'+
'@keyframes koDrop{from{opacity:0;translate:0 -70px}to{opacity:1;translate:0 0}}'+
'.ko-modal{position:fixed;inset:0;z-index:2147483000;background:rgba(10,5,2,.62);display:flex;align-items:center;justify-content:center;cursor:pointer}'+
'.ko-modal .ko-note{position:relative;--h:min(82vh,760px);--r:-1.5deg;cursor:default;transition:none;transform:rotate(-1.5deg)}'+
'.ko-modal .ko-note:hover{transform:rotate(-1.5deg)}'+
'.ko-done{position:absolute;left:50%;bottom:-54px;transform:translateX(-50%);padding:9px 18px;border:2px solid #351b0d;border-radius:9px;background:#e8c27a;color:#351b0d;font:700 15px system-ui,sans-serif;cursor:pointer;white-space:nowrap}';
document.head.appendChild(css);
var cv=mk('canvas');cv.id='kitchenWaiter';cv.width=W;cv.height=H;scene.appendChild(cv);
var X=cv.getContext('2d');
for(var i=1;i<=3;i++){var im=new Image();im.src=WAITER+i+'.webp?v=4';imgs[i]=im}

// stop the clicks on a paper from reaching the game
['pointerdown','pointerup','mousedown','mouseup','click','dblclick','contextmenu','touchstart','wheel'].forEach(function(n){
  scene.addEventListener(n,function(e){if(e.target&&e.target.closest&&e.target.closest('.ko-note'))e.stopPropagation()},false);
});

function noteEl(n,big){
  var d=mk('div','ko-note');d.dataset.id=n.id;
  d.innerHTML='<span class="ko-c c1">Сто '+n.table+'</span><span class="ko-c c2">'+ITEM.cyr+'</span><span class="ko-c c3">1</span><span class="ko-c c2 r2">'+ITEM.cyrExtra+'</span>';
  d.style.setProperty('--h',big?'':'200px');
  if(!big){d.style.left=n.x+'px';d.style.top=n.y+'px';d.style.transform='rotate('+n.rot+'deg)';d.style.setProperty('--r',n.rot+'deg')}
  return d;
}
function placeNote(n,drop){
  var d=noteEl(n,false);if(drop)d.classList.add('ko-drop');
  d.addEventListener('animationend',function(){d.classList.remove('ko-drop')});
  d.addEventListener('click',function(e){e.stopPropagation();openNote(n)});
  scene.appendChild(d);
}
function openNote(n){
  var m=mk('div','ko-modal'),d=noteEl(n,true),b=mk('button','ko-done');
  b.type='button';b.textContent='✓ Gotovo (ukloni papirić)';
  d.appendChild(b);m.appendChild(d);document.body.appendChild(m);
  function stop(e){e.stopPropagation()}
  ['pointerdown','pointerup','mousedown','mouseup','wheel','contextmenu','keydown'].forEach(function(t){m.addEventListener(t,stop)});
  m.addEventListener('click',function(e){e.stopPropagation();m.remove()});
  b.addEventListener('click',function(e){
    e.stopPropagation();m.remove();
    notes=notes.filter(function(q){return q.id!==n.id});save();
    var el=scene.querySelector('.ko-note[data-id="'+n.id+'"]');if(el)el.remove();
  });
}
function spotFor(i){return{x:Math.round(700+(i%4)*118+Math.random()*16),y:Math.round(330+Math.floor(i/4)*70+Math.random()*14),rot:Math.round((Math.random()*14-7)*10)/10}}

// ---------- the waiter walks in ----------
function kitchenVisible(){return !document.body.classList.contains('pantry-open')}
function drawWaiter(x,y,frame,flip,lean){
  var im=imgs[frame];if(!im||!im.complete||!im.naturalWidth)return;
  var w=im.naturalWidth,h=im.naturalHeight;
  X.save();
  X.fillStyle='rgba(20,8,2,.3)';X.beginPath();X.ellipse(x,y+3,95,18,0,0,Math.PI*2);X.fill();
  X.translate(x,y);if(lean)X.rotate(lean);if(flip)X.scale(-1,1);
  X.drawImage(im,-w/2,-h,w,h);
  X.restore();
}
function start(){
  var o=pending[0];if(!o)return;
  anim={o:o,t:0,x:-190,phase:'in',dropped:false,last:performance.now()};
  requestAnimationFrame(tick);
}
function tick(now){
  if(!anim)return;
  var dt=Math.min(.05,(now-anim.last)/1000);anim.last=now;anim.t+=dt;
  X.clearRect(0,0,W,H);
  var frame=2,flip=false,lean=0,SEQ=[1,2,3,2];
  if(anim.phase==='in'){
    anim.x+=SPEED*dt;frame=SEQ[Math.floor((anim.x+190)/STAGE)%4];
    if(anim.x>=STOP_X){anim.x=STOP_X;anim.phase='wait';anim.t=0}
  }else if(anim.phase==='wait'){
    if(anim.t>.35){anim.phase='put';anim.t=0}
  }else if(anim.phase==='put'){
    lean=Math.sin(Math.min(1,anim.t/.7)*Math.PI)*.07;
    if(!anim.dropped&&anim.t>.3){
      anim.dropped=true;
      var o=anim.o,sp=spotFor(notes.length),n={id:o.id,table:o.table,name:ITEM.name,extra:ITEM.extra,x:sp.x,y:sp.y,rot:sp.rot};
      notes.push(n);placeNote(n,true);save();
    }
    if(anim.t>.9){anim.phase='out';anim.t=0}
  }else if(anim.phase==='out'){
    flip=true;anim.x-=SPEED*dt;frame=SEQ[Math.floor((STOP_X-anim.x)/STAGE)%4];
    if(anim.x<-200){
      pending.shift();save();anim=null;X.clearRect(0,0,W,H);return;
    }
  }
  drawWaiter(anim.x,FLOOR_Y,frame,flip,lean);
  requestAnimationFrame(tick);
}
setInterval(function(){
  if(!anim&&pending.length&&Date.now()>=pending[0].readyAt&&kitchenVisible())start();
},300);

load();
notes.forEach(function(n){placeNote(n,false)});

window.CooksterOrders={
  // the waiter has taken an order at a table (1, 2, 3...): after a while he arrives in the kitchen
  add:function(table){pending.push({id:++uid,table:table,readyAt:Date.now()+TRIP_MS});save()},
  busy:function(){return pending.length>0||!!anim},          // the waiter is away from the tavern
  debug:function(){return{pending:pending.slice(),notes:notes.slice(),animating:!!anim}},
  reset:function(){pending=[];notes=[];anim=null;save();scene.querySelectorAll('.ko-note').forEach(function(e){e.remove()});X.clearRect(0,0,W,H)}
};
})();
