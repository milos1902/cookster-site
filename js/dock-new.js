/* Cookster: the NEW corner dock (bottom left) in the new UI style. Replaces the wooden plate with the arc of js/game-menu.js (the plate also showed the date, time, money and weather: those are in the new top bar, js/hud-top.js).
   One round button (assets/ui/hud/hud_round_cream_*) in the corner. Mouse over it, or a click on it, opens an arc of six round green buttons with icons; the same actions as before:
   Kuhinjski elementi, Frižider, Piće, Pijaca, Knjiga recepata, Sačuvaj / Učitaj. Esc or a click elsewhere closes a pinned dock.
   js/game-menu.js still runs (it keeps the old HUD buttons hidden and moves the developer buttons) but its plate is hidden. ?starihud in the address turns the whole new dock + top bar off. */
(function(){
'use strict';
if(window.CooksterDockNew||/[?&]starihud(=|&|$)/.test(location.search))return;
var H='assets/ui/hud/',H2='assets/ui/hud2/';
var BUTTONS=[
  {label:'Kuhinjski elementi',icon:H2+'icon_cookware.png',act:function(){press('kitchenElementsBtn');}},
  {label:'Frižider',icon:H2+'icon_fridge.png',act:function(){if(window.CooksterMince)CooksterMince.fromFridge();else toast('Frižider: uskoro.');}},
  {label:'Piće',icon:H+'icon_drink.png',act:function(){press('drinksBtn');}},
  {label:'Pijaca',icon:H+'icon_basket.png',act:function(){press('marketBtn');}},
  {label:'Knjiga recepata',icon:H+'icon_recipes.png',act:function(){var t=document.querySelector('#savkaBookRoot .savka-book-tab');if(t)t.click();else toast('Knjiga recepata nije dostupna ovde.');}},
  {label:'Sačuvaj / Učitaj',icon:H2+'icon_save.png',act:function(b){gearMenu(b);}}
];
function toast(m){try{showToast(m);}catch(e){}}
function press(id){var b=document.getElementById(id);if(b)b.click();else toast('Nije dostupno.');}
var MAIN=88,BTN=68,R=235;      // px: size of the main button, size of the small ones, radius of the arc
var css=document.createElement('style');
css.textContent=[
'body.cdock-on #cdock{display:none!important}',
'body.pantry-open #ndock,body.garden-open #ndock,body.market-open #ndock{display:none}',
'#ndock{position:fixed;left:14px;bottom:14px;width:'+MAIN+'px;height:'+MAIN+'px;z-index:1900;user-select:none;-webkit-user-select:none}',
'#ndock .nd-main,#ndock .nd-b{position:absolute;border:0;padding:0;border-radius:50%;cursor:pointer;background-size:100% 100%;background-repeat:no-repeat;filter:drop-shadow(0 3px 4px rgba(30,14,4,.5))}',
'#ndock .nd-main{left:0;top:0;width:'+MAIN+'px;height:'+MAIN+'px;background-image:url('+H+'hud_round_cream_n.png);z-index:3}',
'#ndock .nd-main:hover,#ndock.open .nd-main{background-image:url('+H+'hud_round_cream_h.png)}',
'#ndock .nd-main:active{background-image:url('+H+'hud_round_cream_p.png)}',
'#ndock .nd-main img,#ndock .nd-b img{position:absolute;left:19%;top:19%;width:62%;height:62%;object-fit:contain;pointer-events:none;filter:drop-shadow(0 1px 1px rgba(30,14,4,.4))}',
'#ndock .nd-b{width:'+BTN+'px;height:'+BTN+'px;background-image:url('+H+'hud_round_green_n.png);left:'+((MAIN-BTN)/2)+'px;top:'+((MAIN-BTN)/2)+'px;transform:translate(0,0) scale(.3);opacity:0;pointer-events:none;transition:transform .22s cubic-bezier(.3,.8,.3,1),opacity .18s;z-index:2}',
'#ndock.open .nd-b{opacity:1;pointer-events:auto;transform:translate(var(--dx),var(--dy)) scale(1)}',
'#ndock .nd-b:hover{background-image:url('+H+'hud_round_green_h.png)}#ndock .nd-b:active{background-image:url('+H+'hud_round_green_p.png)}',
'#ndock .nd-tip{position:absolute;left:0;top:0;padding:6px 14px;background:url('+H+'hud_toolbar_tooltip.png) 0 0/100% 100% no-repeat;font:700 15px Georgia,serif;color:#6a2a14;white-space:nowrap;display:none;pointer-events:none;z-index:4;filter:drop-shadow(0 2px 3px rgba(30,14,4,.4))}',
'#ndock .nd-tip.on{display:block}'
].join('\n');
document.head.appendChild(css);
var dock=document.createElement('div');dock.id='ndock';
var main=document.createElement('button');main.type='button';main.className='nd-main';main.setAttribute('aria-label','Meni');
var mi=new Image();mi.src=H+'icon_dishes.png';mi.alt='';main.appendChild(mi);dock.appendChild(main);
var tip=document.createElement('div');tip.className='nd-tip';dock.appendChild(tip);
var pinned=false,closeT=0;
function setOpen(v){dock.classList.toggle('open',!!v);if(!v){tip.classList.remove('on');hideGear();}}
function keep(){clearTimeout(closeT);setOpen(true);}
function later(){clearTimeout(closeT);if(pinned)return;closeT=setTimeout(function(){setOpen(false);},160);}
var btns=BUTTONS.map(function(d,i){
  var a=(i/(BUTTONS.length-1))*Math.PI/2;      // from straight up (0) to straight right (90 degrees)
  var b=document.createElement('button');b.type='button';b.className='nd-b';b.setAttribute('aria-label',d.label);b.title=d.label;
  b.style.setProperty('--dx',(Math.sin(a)*R)+'px');b.style.setProperty('--dy',(-Math.cos(a)*R)+'px');
  var im=new Image();im.src=d.icon;im.alt='';b.appendChild(im);
  b.addEventListener('click',function(e){e.stopPropagation();d.act(b);});
  b.addEventListener('mouseenter',function(){tip.textContent=d.label;tip.style.left=((MAIN-BTN)/2+Math.sin(a)*R+BTN+8)+'px';tip.style.top=((MAIN-BTN)/2-Math.cos(a)*R+BTN/2-16)+'px';tip.classList.add('on');keep();});
  b.addEventListener('mouseleave',function(){tip.classList.remove('on');later();});
  dock.appendChild(b);return b;
});
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
function btnRect(title){for(var i=0;i<btns.length;i++){if((btns[i].getAttribute('aria-label')||'').indexOf(title)>=0){var r=btns[i].getBoundingClientRect();return r.width>1?r:null;}}return null;}
document.body.appendChild(dock);
// the developer buttons (Kutlača, Animacije gostiju, Kese...) are fixed at the bottom left: those that lie over the new dock and its arc are moved to its right side
function clearTools(){
  try{
    var zone={l:0,t:innerHeight-(MAIN+R+BTN),r:MAIN+R+BTN,b:innerHeight};
    document.querySelectorAll('button[data-tool-ui]').forEach(function(bt){
      if(bt.dataset.ndMoved||getComputedStyle(bt).position!=='fixed')return;
      var r=bt.getBoundingClientRect();if(!r.width||r.right<zone.l||r.left>zone.r||r.bottom<zone.t||r.top>zone.b)return;
      bt.style.left=Math.round(zone.r+14)+'px';bt.dataset.ndMoved='1';
    });
  }catch(e){}
}
[800,2500,6000].forEach(function(t){setTimeout(clearTools,t);});setInterval(clearTools,2000);
window.addEventListener('resize',function(){document.querySelectorAll('button[data-nd-moved]').forEach(function(b){delete b.dataset.ndMoved;});clearTools();});
window.CooksterDockNew={el:dock,main:main,isOpen:function(){return dock.classList.contains('open');},btnRect:btnRect,
  open:function(){pinned=true;keep();},close:function(){pinned=false;setOpen(false);}};
window.CooksterDock=window.CooksterDockNew;
})();
