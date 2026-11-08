/* Cookster: the corner dock (bottom left). One picture (assets/ui/dock/menu.webp) holds the wooden plate AND the arc with the six round buttons.
   Closed: only the plate is seen (the picture through a mask of the plate). Open (mouse over the plate): the arc with the buttons comes out from behind the plate (a circular reveal).
   The date, the time, the money and the weather on the plate are live texts. The buttons press what already exists in the game (the old HUD buttons are hidden while the dock is on). */
(function(){
'use strict';
if(window.CooksterDock)return;
var BASE='assets/ui/dock/';
var IW=1304,IH=1206;      // the picture
var PB=[41,253,987,1161];      // the visible plate in the picture (left, top, right, bottom)
var PW=PB[2]-PB[0];      // width of the plate in picture pixels
var CORNER=[PB[0]/IW*100,PB[3]/IH*100];      // bottom left corner of the plate (percent of the picture): the arc comes out from there
var POLY=[[6.21, 23.8], [4.68, 26.2], [3.83, 31.18], [3.91, 86.48], [3.14, 89.55], [3.6, 92.04], [4.6, 93.78], [4.6, 96.19], [72.47, 96.19], [72.47, 94.53], [74.77, 91.87], [75.69, 88.39], [74.16, 87.4], [73.7, 85.99], [73.24, 77.03], [71.55, 68.41], [68.63, 59.87], [65.11, 52.65], [61.2, 46.52], [55.83, 39.97], [49.85, 34.41], [44.79, 30.76], [37.35, 26.7], [31.98, 24.88], [25.69, 23.38], [20.4, 22.8], [19.86, 22.22], [19.71, 21.23], [16.41, 20.98], [10.12, 21.39], [7.75, 22.47]];
var MONTHS=['JAN','FEB','MAR','APR','MAJ','JUN','JUL','AVG','SEP','OKT','NOV','DEC'];
var TEMP_BASE=[0,2,7,12,17,21,24,23,18,12,6,1];
// texts: [x, y, font size] in picture pixels
var T={date:[400,472,74],time:[450,600,150],money:[612,741,56],wname:[500,856,56],wtemp:[760,856,56],sun:[265,858,62]};
var BUTTONS=[
  {id:'posudje',label:'Kuhinjski elementi',c:[189.5,150,104],act:function(){press('kitchenElementsBtn');}},
  {id:'frizider',label:'Frižider',c:[451.3,174.6,104],act:function(){toast('Frižider: uskoro.');}},
  {id:'pice',label:'Piće',c:[705.3,265.3,105],act:function(){press('drinksBtn');}},
  {id:'pijaca',label:'Pijaca',c:[916.8,438.9,108],act:function(){press('marketBtn');}},
  {id:'recepti',label:'Knjiga recepata',c:[1056,668,111],act:function(){var t=document.querySelector('#savkaBookRoot .savka-book-tab');if(t)t.click();else toast('Knjiga recepata nije dostupna ovde.');}},
  {id:'podesavanja',label:'Sačuvaj / Učitaj',c:[1102.7,956.3,124],act:function(b){gearMenu(b);}}
];
function toast(m){try{showToast(m);}catch(e){}}
function press(id){var b=document.getElementById(id);if(b)b.click();else toast('Nije dostupno.');}
function pc(x,tot){return (x/tot*100).toFixed(3)+'%';}
function px(v){return 'calc(var(--w)*'+(v/PW).toFixed(5)+')';}      // picture pixels -> screen pixels

var css=document.createElement('style');
css.textContent=[
'@font-face{font-family:"CooksterSerif";src:url(assets/fonts/PlayfairDisplay-Variable.ttf) format("truetype");font-weight:400 900;font-display:swap}',
'body.cdock-on #hud #marketBtn,body.cdock-on #hud #kitchenElementsBtn,body.cdock-on #hud #drinksBtn,body.cdock-on #hud #saveBtn,body.cdock-on #hud #loadBtn{display:none!important}',
'body.cdock-on img.ui-overlay-element[src*="drvena_traka_krug"],body.cdock-on img.ui-overlay-element[src*="dva_polja"]{display:none!important}',
'body.cdock-on #savkaBookRoot:not(.savka-open) .savka-book-tab{opacity:0;pointer-events:none}',
'body.pantry-open #cdock,body.garden-open #cdock,body.market-open #cdock{display:none}',
'#cdock{position:fixed;left:0;bottom:0;--w:clamp(178px,14.9vw,281px);width:calc(var(--w)*1.05);height:calc(var(--w)*1.0);z-index:1900;pointer-events:none;user-select:none;-webkit-user-select:none}',
'#cdock .cd-stage{position:absolute;left:'+px(-PB[0])+';bottom:'+px(-(IH-PB[3]))+';width:'+px(IW)+';height:'+px(IH)+';pointer-events:none}',
'#cdock .cd-stage>img{position:absolute;left:0;top:0;width:100%;height:100%;display:block;pointer-events:none}',
'#cdock .cd-full{z-index:1;clip-path:circle(0px at '+CORNER[0].toFixed(2)+'% '+CORNER[1].toFixed(2)+'%);transition:clip-path .34s cubic-bezier(.3,.7,.3,1);filter:drop-shadow(0 3px 6px rgba(40,20,6,.45))}',
'#cdock.cd-open .cd-full{clip-path:circle(150% at '+CORNER[0].toFixed(2)+'% '+CORNER[1].toFixed(2)+'%)}',
'#cdock .cd-pan{z-index:2;-webkit-mask-image:url('+BASE+'menu_mask.png);mask-image:url('+BASE+'menu_mask.png);-webkit-mask-size:100% 100%;mask-size:100% 100%;transition:filter .18s}',
'#cdock .cd-panw{position:absolute;inset:0;z-index:2;pointer-events:none;filter:drop-shadow(0 3px 6px rgba(40,20,6,.45));transition:filter .18s}',
'#cdock.cd-open .cd-panw{filter:drop-shadow(0 0 9px rgba(255,214,90,.85)) drop-shadow(0 3px 6px rgba(40,20,6,.45))}',
'#cdock .cd-t{position:absolute;z-index:3;transform:translate(-50%,-50%);white-space:nowrap;font-family:"CooksterSerif",Georgia,serif;font-weight:900;font-variant-numeric:lining-nums;font-feature-settings:"lnum" 1;color:#5a2410;text-shadow:0 1px 0 rgba(255,236,200,.55);line-height:1;pointer-events:none}',
'#cdock .cd-wi{position:absolute;z-index:3;transform:translate(-50%,-50%);border-radius:50%;background:radial-gradient(circle,#fbe3c8 55%,#f6d4b0);display:none;align-items:center;justify-content:center;pointer-events:none}',
'#cdock .cd-hit{position:absolute;inset:0;z-index:5;pointer-events:auto;cursor:pointer;clip-path:polygon('+POLY.map(function(p){return p[0]+'% '+p[1]+'%';}).join(',')+')}',
'#cdock .cd-b{position:absolute;z-index:4;border:0;padding:0;border-radius:50%;background:transparent;cursor:pointer;pointer-events:none;aspect-ratio:1}',
'#cdock.cd-open .cd-b{pointer-events:auto}',
'#cdock .cd-b{transition:box-shadow .09s,background .09s}',
'#cdock .cd-b:hover{background:rgba(255,236,170,.16);box-shadow:0 0 0 '+px(5)+' rgba(255,226,120,.95),0 0 '+px(26)+' '+px(8)+' rgba(255,196,60,.8)}',
'#cdock .cd-b:active{background:rgba(255,236,170,.3)}',
'#cdock .cd-tip{z-index:6;position:absolute;transform:translate(-50%,0);padding:3px 9px;border-radius:7px;background:rgba(48,28,14,.94);color:#ffeccb;font:700 12px system-ui,sans-serif;white-space:nowrap;pointer-events:none;opacity:0;transition:opacity .12s}',
'#cdock .cd-tip.on{opacity:1}',
'#cdock .cd-box{position:absolute;pointer-events:none;left:'+pc(PB[0],IW)+';top:'+pc(PB[1],IH)+';width:'+pc(PW,IW)+';height:'+pc(PB[3]-PB[1],IH)+'}',
'#cdock-gear{position:fixed;z-index:1950;display:none;flex-direction:column;gap:6px;padding:8px;background:rgba(48,28,14,.96);border:2px solid #d9a441;border-radius:10px;box-shadow:0 6px 18px rgba(0,0,0,.5)}',
'#cdock-gear button{border:0;border-radius:7px;padding:8px 14px;cursor:pointer;background:#f0c36a;color:#2a1a0e;font:800 14px system-ui,sans-serif;text-align:left}',
'#cdock-gear button:hover{background:#ffd98a}'
].join('\n');
document.head.appendChild(css);

var dock=document.createElement('div');dock.id='cdock';
var stage=document.createElement('div');stage.className='cd-stage';dock.appendChild(stage);
function mkImg(cls){var i=document.createElement('img');i.className=cls;i.src=BASE+'menu.webp';i.alt='';i.draggable=false;return i;}
stage.appendChild(mkImg('cd-full'));
var panw=document.createElement('div');panw.className='cd-panw';panw.appendChild(mkImg('cd-pan'));
panw.firstChild.style.cssText='position:absolute;left:0;top:0;width:100%;height:100%';
stage.appendChild(panw);
function txt(cls,t){var s=document.createElement('span');s.className='cd-t '+cls;s.style.left=pc(t[0],IW);s.style.top=pc(t[1],IH);s.style.fontSize=px(t[2]);stage.appendChild(s);return s;}
var tDate=txt('d',T.date),tTime=txt('t',T.time),tMoney=txt('m',T.money),tWn=txt('wn',T.wname),tWt=txt('wt',T.wtemp);
var wIc=document.createElement('span');wIc.className='cd-wi';wIc.style.left=pc(T.sun[0],IW);wIc.style.top=pc(T.sun[1],IH);wIc.style.width=px(T.sun[2]*2);wIc.style.height=px(T.sun[2]*2);wIc.style.fontSize=px(T.sun[2]*1.4);stage.appendChild(wIc);
var tip=document.createElement('div');tip.className='cd-tip';stage.appendChild(tip);
var box=document.createElement('div');box.className='cd-box';stage.appendChild(box);      // only to measure where the plate is

var pinned=false,closeT=0;
function setOpen(v){dock.classList.toggle('cd-open',!!v);if(!v){tip.classList.remove('on');hideGear();}}
function keep(){clearTimeout(closeT);setOpen(true);}
function later(){clearTimeout(closeT);if(pinned)return;closeT=setTimeout(function(){setOpen(false);},90);}
var btns=BUTTONS.map(function(d){
  var b=document.createElement('button');b.type='button';b.className='cd-b';b.setAttribute('aria-label',d.label);
  b.style.left=pc(d.c[0]-d.c[2],IW);b.style.top=pc(d.c[1]-d.c[2],IH);b.style.width=pc(d.c[2]*2,IW);
  b.addEventListener('click',function(e){e.stopPropagation();d.act(b);});
  b.addEventListener('mouseenter',function(){tip.textContent=d.label;tip.style.left=pc(d.c[0],IW);tip.style.top='calc('+pc(d.c[1]+d.c[2]+6,IH)+')';tip.classList.add('on');keep();});
  b.addEventListener('mouseleave',function(){tip.classList.remove('on');later();});
  stage.appendChild(b);return b;
});
var hit=document.createElement('div');hit.className='cd-hit';stage.appendChild(hit);      // only the shape of the plate catches the mouse
hit.addEventListener('mouseenter',keep);hit.addEventListener('mouseleave',later);
hit.addEventListener('click',function(){pinned=!pinned;if(pinned)keep();else setOpen(false);});
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
    var mm=((m%1440)+1440)%1440,night=mm<330||mm>=1140;
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
    var pr=box.getBoundingClientRect();if(!pr.width)return;
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
  update();setInterval(update,400);[800,2500,6000].forEach(function(t){setTimeout(clearTools,t);});setInterval(clearTools,2000);
  window.addEventListener('resize',function(){document.querySelectorAll('button[data-cd-moved]').forEach(function(b){delete b.dataset.cdMoved;});clearTools();});
}
window.CooksterDock={open:function(){pinned=true;keep();},close:function(){pinned=false;setOpen(false);},el:dock};
if(document.body)start();else document.addEventListener('DOMContentLoaded',start);
})();
