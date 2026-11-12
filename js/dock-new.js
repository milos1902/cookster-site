/* Cookster: the NEW corner dock (bottom left). The picture of the menu (assets/ui/dock/meni_ploca_2.webp, 887x1774: a linen panel with 2 x 4 round buttons) opens out of the round button that always stays in the corner
   (assets/ui/dock/glavno_dugme.png, cut from the same picture: the cream button with the dishes). Mouse OVER the button (or a click on it, which pins the menu) opens the panel; it closes when the mouse leaves.
   The panel is a picture; over each of its buttons lies an invisible round hotspot with the action: Snimanje (phone), Kuhinjski elementi, Frižider, Piće, Pijaca, Knjiga recepata, Sačuvaj / Učitaj.
   The old phone button at the left (#recBtn) is hidden: the phone is now in the menu. ?starihud in the address turns the whole new dock + top bar off. */
(function(){
'use strict';
if(window.CooksterDockNew||/[?&]starihud(=|&|$)/.test(location.search))return;
var A='assets/ui/dock/';
var IW=887,IH=1774,RING=316,BOX=90;      // the picture, the diameter of the ring of a button in the picture, the size of the main button on the screen (px)
var S=BOX/(RING+8);      // screen px per picture px
var MAIN=[272,1385],COL=[272,610],ROW=[397,727,1057];      // centre of the main button and of the other buttons in the picture
var BTNS=[
  {label:'Snimanje recepta',c:COL[0],r:ROW[0],act:function(){press('recBtn');}},
  {label:'Kuhinjski elementi',c:COL[1],r:ROW[0],act:function(){press('kitchenElementsBtn');}},
  {label:'Frižider',c:COL[0],r:ROW[1],act:function(){if(window.CooksterMince)CooksterMince.fromFridge();else toast('Frižider: uskoro.');}},
  {label:'Piće',c:COL[1],r:ROW[1],act:function(){press('drinksBtn');}},
  {label:'Pijaca',c:COL[0],r:ROW[2],act:function(){press('marketBtn');}},
  {label:'Knjiga recepata',c:COL[1],r:ROW[2],act:function(){var t=document.querySelector('#savkaBookRoot .savka-book-tab');if(t)t.click();else toast('Knjiga recepata nije dostupna ovde.');}},
  {label:'Podešavanja',c:COL[1],r:MAIN[1],act:function(b){gearMenu(b);}}
];
function toast(m){try{showToast(m);}catch(e){}}
function press(id){var b=document.getElementById(id);if(b)b.click();else toast('Nije dostupno.');}
var PX=function(v){return (v*S).toFixed(2)+'px';};
var css=document.createElement('style');
css.textContent=[
'body.cdock-on #cdock{display:none!important}',
'body.cdock-new #recBtn{opacity:0!important;pointer-events:none!important}',
'body.pantry-open #ndock,body.garden-open #ndock,body.market-open #ndock{display:none}',
'#ndock{position:fixed;left:27px;bottom:46px;width:'+BOX+'px;height:'+BOX+'px;z-index:1900;user-select:none;-webkit-user-select:none}',
'#ndock .nd-panel{position:absolute;left:'+PX(-(MAIN[0]-(RING+8)/2)-(RING+8)/2*0)+';top:0;width:'+PX(IW)+';height:'+PX(IH)+';background:url('+A+'meni_ploca_2.webp) 0 0/100% 100% no-repeat;transform-origin:'+PX(MAIN[0])+' '+PX(MAIN[1])+';transform:scale(.2);opacity:0;pointer-events:none;transition:transform .24s cubic-bezier(.3,.8,.3,1),opacity .18s;filter:drop-shadow(0 4px 8px rgba(30,14,4,.5));z-index:1}',
'#ndock.open .nd-panel{transform:scale(1);opacity:1;pointer-events:auto}',
'#ndock .nd-main{position:absolute;left:0;top:0;width:'+BOX+'px;height:'+BOX+'px;border:0;padding:0;border-radius:50%;background:url('+A+'glavno_dugme.png) 0 0/100% 100% no-repeat;background-color:transparent;outline:0;box-shadow:none;cursor:pointer;z-index:3;filter:drop-shadow(0 3px 4px rgba(30,14,4,.5))}',
'#ndock .nd-main:hover,#ndock.open .nd-main{background-image:url('+A+'glavno_dugme_h.png)}',
'#ndock .nd-h{position:absolute;border:0;padding:0;border-radius:50%;background:transparent;outline:0;box-shadow:none;cursor:pointer}',
'#ndock .nd-h:hover{box-shadow:0 0 0 3px rgba(255,214,90,.95),0 0 14px 4px rgba(255,196,60,.7);background:rgba(255,236,170,.12)}',
].join('\n');
document.head.appendChild(css);
var dock=document.createElement('div');dock.id='ndock';
var panel=document.createElement('div');panel.className='nd-panel';
// the panel is placed so that the centre of its bottom left button lies on the centre of the main button
panel.style.left=(BOX/2-MAIN[0]*S).toFixed(2)+'px';panel.style.top=(BOX/2-MAIN[1]*S).toFixed(2)+'px';
dock.appendChild(panel);
var main=document.createElement('button');main.type='button';main.className='nd-main';main.setAttribute('aria-label','Meni');dock.appendChild(main);
var pinned=false,closeT=0;
function setOpen(v){dock.classList.toggle('open',!!v);if(!v){hideGear();}}
function keep(){clearTimeout(closeT);setOpen(true);}
function later(){clearTimeout(closeT);if(pinned)return;closeT=setTimeout(function(){setOpen(false);},220);}
var hot=BTNS.map(function(d){
  var b=document.createElement('button');b.type='button';b.className='nd-h';b.setAttribute('aria-label',d.label);
  var r=RING/2;b.style.left=PX(d.c-r)+'';b.style.top=PX(d.r-r);b.style.width=PX(RING);b.style.height=PX(RING);
  b.addEventListener('click',function(e){e.stopPropagation();d.act(b);});
  b.addEventListener('mouseenter',keep);
  b.addEventListener('mouseleave',later);
  panel.appendChild(b);d.el=b;return d;
});
panel.addEventListener('mouseenter',keep);panel.addEventListener('mouseleave',later);
main.addEventListener('mouseenter',keep);main.addEventListener('mouseleave',later);
main.addEventListener('click',function(){pinned=!pinned;if(pinned)keep();else setOpen(false);});
window.addEventListener('keydown',function(e){if(e.key==='Escape'&&(pinned||dock.classList.contains('open'))){pinned=false;setOpen(false);}},true);
window.addEventListener('pointerdown',function(e){
  var inside=e.target.closest&&(e.target.closest('#ndock')||e.target.closest('#cdock-gear'));
  if(gear&&gear.style.display!=='none'&&!inside)hideGear();
  if(pinned&&!inside){pinned=false;setOpen(false);}
},true);
var gear=null;
function hideGear(){if(gear)gear.style.display='none';}
function gearMenu(anchor){
  if(!gear){gear=document.createElement('div');gear.id='cdock-gear';
    [['💾 Sačuvaj igru','saveBtn'],['📂 Učitaj poslednji save','loadBtn']].forEach(function(p){var b=document.createElement('button');b.type='button';b.textContent=p[0];b.onclick=function(){press(p[1]);hideGear();};gear.appendChild(b);});
    var tb=document.createElement('button');tb.type='button';tb.textContent='❓ Uputstvo (Baba Savka)';tb.onclick=function(){hideGear();try{CooksterTutorial.start(true);}catch(e){}};gear.appendChild(tb);
    document.body.appendChild(gear);}
  if(gear.style.display==='flex'){hideGear();return;}
  var r=anchor.getBoundingClientRect();gear.style.display='flex';
  var gw=gear.offsetWidth,gh=gear.offsetHeight;
  gear.style.left=Math.max(6,Math.min(innerWidth-gw-6,r.right+8))+'px';gear.style.top=Math.max(6,Math.min(innerHeight-gh-6,r.top+r.height/2-gh/2))+'px';
}
function btnRect(title){for(var i=0;i<hot.length;i++){if(hot[i].label.indexOf(title)>=0){var r=hot[i].el.getBoundingClientRect();return r.width>1?r:null;}}return null;}
document.body.appendChild(dock);document.body.classList.add('cdock-new');
// the developer buttons (Kutlača, Animacije gostiju, Kese...) are fixed at the bottom left: those that lie over the dock and its panel are moved to its right side
function clearTools(){
  try{
    var zone={l:0,t:innerHeight-IH*S-20,r:27+IW*S+20,b:innerHeight};
    document.querySelectorAll('button[data-tool-ui]').forEach(function(bt){
      if(bt.dataset.ndMoved||getComputedStyle(bt).position!=='fixed')return;
      var r=bt.getBoundingClientRect();if(!r.width||r.right<zone.l||r.left>zone.r||r.bottom<zone.t||r.top>zone.b)return;
      bt.style.left=Math.round(zone.r+10)+'px';bt.dataset.ndMoved='1';
    });
  }catch(e){}
}
[800,2500,6000].forEach(function(t){setTimeout(clearTools,t);});setInterval(clearTools,2000);
window.addEventListener('resize',function(){document.querySelectorAll('button[data-nd-moved]').forEach(function(b){delete b.dataset.ndMoved;});clearTools();});
window.CooksterDockNew={el:dock,main:main,isOpen:function(){return dock.classList.contains('open');},btnRect:btnRect,
  open:function(){pinned=true;keep();},close:function(){pinned=false;setOpen(false);}};
window.CooksterDock=window.CooksterDockNew;
})();
