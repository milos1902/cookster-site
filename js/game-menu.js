/* Cookster: the corner dock (bottom left). A wooden quarter-circle plate with the date, the time, the money and the weather; when the mouse is over it, six round buttons come out
   of it along an arc: the dishes (kitchen elements), the fridge, the drinks, the market, the recipe book and the settings (save / load).
   It does not do anything by itself: it presses the buttons that already exist in the game (the old HUD buttons are hidden while the dock is on). */
(function(){
'use strict';
if(window.CooksterDock)return;
var BASE='assets/ui/dock/';
var MONTHS=['JAN','FEB','MAR','APR','MAJ','JUN','JUL','AVG','SEP','OKT','NOV','DEC'];
var TEMP_BASE=[0,2,7,12,17,21,24,23,18,12,6,1];
// the places of the texts on the plate (fractions of the picture of the plate, 1309 x 1201)
var OLD=[1309,1201],BB=[32,10,1113,1145];      // the picture of the plate was cut to its visible part (BB inside of OLD): the plate lies exactly on the left and the bottom edge
function cv(a){return [(a[0]*OLD[0]-BB[0])/BB[2],(a[1]*OLD[1]-BB[1])/BB[3],a[2]*OLD[0]/BB[2]];}
var T={date:cv([.330,.254,.066]),time:cv([.370,.387,.146]),money:cv([.483,.541,.056]),wname:cv([.428,.673,.047]),wtemp:cv([.657,.678,.050]),sun:cv([.21,.675,.17])};
var W_H=BB[3]/BB[2];      // height of the plate in widths
var CORNER=[(35-BB[0])/BB[2],(1150-BB[1])/BB[3]];      // the middle of the arc (the bottom left corner of the plate), fractions of the plate
var RADIUS=.99*OLD[0]/BB[2],BTN=.235*OLD[0]/BB[2];      // in widths of the plate
var BUTTONS=[
  {id:'posudje',label:'Kuhinjski elementi',act:function(){press('kitchenElementsBtn');}},
  {id:'frizider',label:'Frižider',act:function(){toast('Frižider: uskoro.');}},
  {id:'pice',label:'Piće',act:function(){press('drinksBtn');}},
  {id:'pijaca',label:'Pijaca',act:function(){press('marketBtn');}},
  {id:'recepti',label:'Knjiga recepata',act:function(){var t=document.querySelector('#savkaBookRoot .savka-book-tab');if(t)t.click();else toast('Knjiga recepata nije dostupna ovde.');}},
  {id:'podesavanja',label:'Sačuvaj / Učitaj',act:function(b){gearMenu(b);}}
];
function toast(m){try{showToast(m);}catch(e){}}
function press(id){var b=document.getElementById(id);if(b)b.click();else toast('Nije dostupno.');}

var css=document.createElement('style');
css.textContent=[
'@font-face{font-family:"CooksterSerif";src:url(assets/fonts/PlayfairDisplay-Variable.ttf) format("truetype");font-weight:400 900;font-display:swap}',
'body.cdock-on #hud #marketBtn,body.cdock-on #hud #kitchenElementsBtn,body.cdock-on #hud #drinksBtn,body.cdock-on #hud #saveBtn,body.cdock-on #hud #loadBtn{display:none!important}',
'body.cdock-on img.ui-overlay-element[src*="drvena_traka_krug"],body.cdock-on img.ui-overlay-element[src*="dva_polja"]{display:none!important}',
'body.cdock-on #savkaBookRoot:not(.savka-open) .savka-book-tab{opacity:0;pointer-events:none}',
'body.pantry-open #cdock,body.garden-open #cdock,body.market-open #cdock{display:none}',
'#cdock{position:fixed;left:0;bottom:0;--w:clamp(178px,14.9vw,281px);width:calc(var(--w)*1.7);height:calc(var(--w)*1.7);z-index:1900;pointer-events:none;user-select:none;-webkit-user-select:none}',
'#cdock .cd-panel{position:absolute;left:0;bottom:0;width:var(--w);height:calc(var(--w)*'+W_H.toFixed(4)+');pointer-events:auto;cursor:pointer}',
'#cdock .cd-panel img{position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none;filter:drop-shadow(0 3px 6px rgba(40,20,6,.45))}',
'#cdock .cd-panel img{transition:filter .18s}',
'#cdock.cd-open .cd-panel img{filter:drop-shadow(0 0 9px rgba(255,214,90,.85)) drop-shadow(0 3px 6px rgba(40,20,6,.45)) brightness(1.06)}',
'#cdock .cd-t{position:absolute;transform:translate(-50%,-50%);white-space:nowrap;font-family:"CooksterSerif",Georgia,serif;font-weight:900;font-variant-numeric:lining-nums;font-feature-settings:"lnum" 1;color:#5a2410;text-shadow:0 1px 0 rgba(255,236,200,.55);line-height:1;pointer-events:none}',
'#cdock .cd-wi{position:absolute;transform:translate(-50%,-50%);border-radius:50%;background:radial-gradient(circle,#fbe3c8 55%,#f6d4b0);display:none;align-items:center;justify-content:center;pointer-events:none}',
'#cdock .cd-btn{position:absolute;width:calc(var(--w)*'+BTN+');height:calc(var(--w)*'+BTN+');border:0;padding:0;background:none;cursor:pointer;pointer-events:none;opacity:0;transform:translate(var(--fx),var(--fy)) scale(.25);transition:transform .34s cubic-bezier(.2,1.25,.4,1) var(--dl),opacity .18s ease var(--dl),filter .12s}',
'#cdock .cd-btn img{width:100%;height:100%;display:block;pointer-events:none;filter:drop-shadow(0 3px 5px rgba(40,20,6,.5))}',
'#cdock.cd-open .cd-btn{opacity:1;pointer-events:auto;transform:translate(0,0) scale(1)}',
'#cdock .cd-btn:hover{filter:brightness(1.12) drop-shadow(0 0 7px rgba(255,214,90,.9));transform:translate(0,0) scale(1.1)!important}',
'#cdock .cd-btn:active{transform:translate(0,0) scale(.95)!important}',
'#cdock .cd-tip{position:absolute;transform:translate(-50%,0);padding:3px 9px;border-radius:7px;background:rgba(48,28,14,.94);color:#ffeccb;font:700 12px system-ui,sans-serif;white-space:nowrap;pointer-events:none;opacity:0;transition:opacity .12s}',
'#cdock .cd-tip.on{opacity:1}',
'#cdock-gear{position:fixed;z-index:1950;display:none;flex-direction:column;gap:6px;padding:8px;background:rgba(48,28,14,.96);border:2px solid #d9a441;border-radius:10px;box-shadow:0 6px 18px rgba(0,0,0,.5)}',
'#cdock-gear button{border:0;border-radius:7px;padding:8px 14px;cursor:pointer;background:#f0c36a;color:#2a1a0e;font:800 14px system-ui,sans-serif;text-align:left}',
'#cdock-gear button:hover{background:#ffd98a}'
].join('\n');
document.head.appendChild(css);

var dock=document.createElement('div');dock.id='cdock';
var panel=document.createElement('div');panel.className='cd-panel';
var pimg=document.createElement('img');pimg.src=BASE+'panel.webp';pimg.alt='';pimg.draggable=false;panel.appendChild(pimg);
function txt(cls,pos){var s=document.createElement('span');s.className='cd-t '+cls;s.style.left=(pos[0]*100)+'%';s.style.top=(pos[1]*100)+'%';s.style.fontSize='calc(var(--w)*'+pos[2]+')';panel.appendChild(s);return s;}
var tDate=txt('d',T.date),tTime=txt('t',T.time),tMoney=txt('m',T.money),tWn=txt('wn',T.wname),tWt=txt('wt',T.wtemp);
var wIc=document.createElement('span');wIc.className='cd-wi';wIc.style.left=(T.sun[0]*100)+'%';wIc.style.top=(T.sun[1]*100)+'%';wIc.style.width='calc(var(--w)*.176)';wIc.style.height='calc(var(--w)*.176)';wIc.style.fontSize='calc(var(--w)*.13)';panel.appendChild(wIc);
dock.appendChild(panel);

var tip=document.createElement('div');tip.className='cd-tip';dock.appendChild(tip);
var btns=BUTTONS.map(function(d,i){
  var ang=(82-i*14.4)*Math.PI/180,cx=CORNER[0]+RADIUS*Math.cos(ang),cy=CORNER[1]*W_H-RADIUS*Math.sin(ang);      // the middle of the button in widths (y measured from the top of the plate)
  var b=document.createElement('button');b.type='button';b.className='cd-btn';b.setAttribute('aria-label',d.label);b.title='';
  b.style.left='calc(var(--w)*'+(cx-BTN/2).toFixed(4)+')';
  b.style.bottom='calc(var(--w)*'+(W_H-cy-BTN/2).toFixed(4)+')';      // the plate is at the bottom: y from the top of the plate -> bottom
  b.style.setProperty('--fx','calc(var(--w)*'+(CORNER[0]-cx).toFixed(4)+')');
  b.style.setProperty('--fy','calc(var(--w)*'+(CORNER[1]*W_H-cy).toFixed(4)+')');
  b.style.setProperty('--dl',(i*38)+'ms');
  var im=document.createElement('img');im.src=BASE+d.id+'.webp';im.alt='';im.draggable=false;b.appendChild(im);
  b.addEventListener('click',function(e){e.stopPropagation();d.act(b);});
  b.addEventListener('mouseenter',function(){tip.textContent=d.label;tip.style.left=b.offsetLeft+b.offsetWidth/2+'px';tip.style.top=(b.offsetTop+b.offsetHeight+4)+'px';tip.classList.add('on');keep();});
  b.addEventListener('mouseleave',function(){tip.classList.remove('on');later();});
  dock.appendChild(b);return b;
});

var pinned=false,closeT=0;
function setOpen(v){dock.classList.toggle('cd-open',!!v);if(!v){tip.classList.remove('on');hideGear();}}
function keep(){clearTimeout(closeT);setOpen(true);}
function later(){clearTimeout(closeT);if(pinned)return;closeT=setTimeout(function(){setOpen(false);},550);}
panel.addEventListener('mouseenter',keep);panel.addEventListener('mouseleave',later);
panel.addEventListener('click',function(){pinned=!pinned;if(pinned)keep();else setOpen(false);});
window.addEventListener('keydown',function(e){if(e.key==='Escape'&&(pinned||dock.classList.contains('cd-open'))){pinned=false;setOpen(false);}},true);
window.addEventListener('pointerdown',function(e){
  if(gear&&gear.style.display!=='none'&&!gear.contains(e.target)&&!(e.target.closest&&e.target.closest('#cdock')))hideGear();
  if(pinned&&!(e.target.closest&&(e.target.closest('#cdock')||e.target.closest('#cdock-gear')))){pinned=false;setOpen(false);}
},true);

var gear=null;
function hideGear(){if(gear)gear.style.display='none';}
function gearMenu(anchor){
  if(!gear){gear=document.createElement('div');gear.id='cdock-gear';
    [['💾 Sačuvaj igru','saveBtn'],['📂 Učitaj poslednji save','loadBtn']].forEach(function(p){var b=document.createElement('button');b.type='button';b.textContent=p[0];b.onclick=function(){press(p[1]);hideGear();};gear.appendChild(b);});
    document.body.appendChild(gear);}
  if(gear.style.display==='flex'){hideGear();return;}
  var r=anchor.getBoundingClientRect();gear.style.display='flex';
  var gw=gear.offsetWidth,gh=gear.offsetHeight;
  gear.style.left=Math.max(6,Math.min(innerWidth-gw-6,r.right+8))+'px';gear.style.top=Math.max(6,Math.min(innerHeight-gh-6,r.top+r.height/2-gh/2))+'px';
}

function hhmm(m){m=((Math.round(m)%1440)+1440)%1440;var h=Math.floor(m/60),mm=m%60;return (h<10?'0':'')+h+':'+(mm<10?'0':'')+mm;}
function temp(kind,m,mon){var t=TEMP_BASE[mon%12]+4*Math.cos((m/60-15)*Math.PI/12);if(kind==='kisa')t-=3;else if(kind==='nevreme')t-=4;else if(kind==='sneg')t=Math.min(t-5,0);return Math.round(t);}
function fmtMoney(m){var n=String(m).replace(/[^\d-]/g,'');if(!n)return '∞';return n.replace(/\B(?=(\d{3})+(?!\d))/g,'.')+' дин.';}
var lastS='';
function update(){
  try{
    var Wt=window.CooksterWeather,D=window.CooksterDay;
    var dt=Wt&&Wt.date?Wt.date():{d:1,m:6},m=D&&D.minute?D.minute():360,kind=Wt&&Wt.kind?Wt.kind():'sunce';
    var night=(((m%1440)+1440)%1440)<330||(((m%1440)+1440)%1440)>=1140;
    var name=Wt&&Wt.name?Wt.name():'Sunčano',icon=Wt&&Wt.icon?Wt.icon():'☀️';
    if(kind==='sunce'&&night){name='Vedro';icon='🌙';}
    var mt=document.getElementById('money'),money=mt?((mt.textContent.match(/-?\d[\d\s.,]*/)||['∞'])[0]).trim():'0';
    var s=[dt.d,dt.m,hhmm(m),name,money,kind,night,temp(kind,m,dt.m)].join('|');
    if(s===lastS)return;lastS=s;
    tDate.textContent=dt.d+'. '+MONTHS[dt.m%12];tTime.textContent=hhmm(m);tMoney.textContent=fmtMoney(money);tWn.textContent=name;tWt.textContent=temp(kind,m,dt.m)+'°C';
    if(kind==='sunce'&&!night){wIc.style.display='none';}else{wIc.style.display='flex';wIc.textContent=icon;}
  }catch(e){}
}
// the developer tool buttons (Ladle, Guest animations...) are fixed at the bottom left: those that lie over the dock are moved to its right side
function clearTools(){
  try{
    var pr=panel.getBoundingClientRect();if(!pr.width)return;
    var zone={l:0,t:pr.top-pr.width*.25,r:pr.right+pr.width*.45,b:innerHeight};
    document.querySelectorAll('button[data-tool-ui]').forEach(function(bt){
      if(bt.dataset.cdMoved||getComputedStyle(bt).position!=='fixed')return;
      var r=bt.getBoundingClientRect();if(!r.width||r.right<zone.l||r.left>zone.r||r.bottom<zone.t||r.top>zone.b)return;
      bt.style.left=Math.round(zone.r+10)+'px';bt.dataset.cdMoved='1';
    });
  }catch(e){}
}
function start(){
  document.body.appendChild(dock);document.body.classList.add('cdock-on');
  update();setInterval(update,400);[800,2500,6000].forEach(function(t){setTimeout(clearTools,t);});setInterval(clearTools,2000);window.addEventListener('resize',function(){document.querySelectorAll('button[data-cd-moved]').forEach(function(b){delete b.dataset.cdMoved;});clearTools();});
}
window.CooksterDock={open:function(){pinned=true;keep();},close:function(){pinned=false;setOpen(false);},el:dock};
if(document.body)start();else document.addEventListener('DOMContentLoaded',start);
})();
