/* Cookster: the NEW top bar (top left): date, clock, money, weather, in the picture assets/ui/hud/hud_top_bar.png (4 compartments).
   It shows the same live values that the old dock plate (bottom left, js/game-menu.js) shows: they are read from the dock texts, so nothing is calculated twice.
   The old small box "Dan 1 / Novac" is hidden. The dock plate stays for now (it carries the arc with the six round buttons); it goes away when the arc is redone.
   ?starihud in the address turns this bar off. */
(function(){
'use strict';
if(window.CooksterHudTop||/[?&]starihud(=|&|$)/.test(location.search))return;
var IC='assets/ui/napredak/ikone/',BAR='assets/ui/hud/hud_top_bar.png';
var css=document.createElement('style');
css.textContent=[
'body.chud-on #hud{visibility:hidden;pointer-events:none}',
'#chud{--bw:clamp(280px,21.5vw,460px);position:fixed;left:6.9vw;top:3px;width:calc(var(--bw)*1.193);height:calc(var(--bw)*1.193/7.866);z-index:1890;pointer-events:none;user-select:none;-webkit-user-select:none;container-type:inline-size;filter:drop-shadow(0 2px 3px rgba(30,14,4,.45))}',
'body.chud-on #saveTransfer{left:calc(6.9vw + clamp(280px,21.5vw,460px)*1.193 + 14px)!important}',
'body.pantry-open #chud,body.garden-open #chud,body.market-open #chud{display:none}',
'#chud .ch-bg{position:absolute;inset:0;background:url(assets/ui/hud/hud_top_bar_novi.png) no-repeat;background-size:100% 100%}',
'#chud .ch-c{position:absolute;top:0;height:100%;transform:translateX(-50%);display:flex;align-items:center;justify-content:center;gap:calc(var(--bw)*.012);white-space:nowrap;font-family:"Paytone One","CooksterSerif",Georgia,serif;font-weight:400;font-synthesis:none;color:#7a1e14;text-shadow:0 calc(var(--bw)*.0025) 0 rgba(255,236,200,.5);font-size:calc(var(--bw)*.043);line-height:1}',
'#chud .ch-c img{height:calc(var(--bw)*.082);width:auto;display:block;filter:drop-shadow(0 calc(var(--bw)*.003) calc(var(--bw)*.003) rgba(40,20,6,.35))}',
'#chud .ch-t{font-size:calc(var(--bw)*.056)}'
].join('\n');
document.head.appendChild(css);
var bar=document.createElement('div');bar.id='chud';var bgp=document.createElement('div');bgp.className='ch-bg';bar.appendChild(bgp);
function cell(x){var c=document.createElement('div');c.className='ch-c';c.style.left=(x*100)+'%';bar.appendChild(c);return c;}
var cDate=cell(.136),cTime=cell(.321),cMoney=cell(.478),cWx=cell(.768);
var sDate=document.createElement('span'),sTime=document.createElement('span');sTime.className='ch-t';
cDate.appendChild(sDate);cTime.appendChild(sTime);
cMoney.style.transform='none';cMoney.style.justifyContent='flex-start';      // the coins always stand at the left of their compartment, the same distance from the line (0.031 of the bar width) as the time is from its line
var sMoney=document.createElement('span');cMoney.append(sMoney);      // the coins are drawn in the picture
cWx.style.transform='translateX(-50%)';var iWx=new Image();iWx.alt='';var sWx=document.createElement('span');cWx.append(iWx,sWx);
document.body.appendChild(bar);document.body.classList.add('chud-on');
function txt(sel){var e=document.querySelector('#cdock .cd-t.'+sel);return e?e.textContent:'';}
var last='';
function icon(){
  try{var W=window.CooksterWeather,k=W&&W.kind?W.kind():'sunce',D=window.CooksterDay,m=D&&D.minute?((D.minute()%1440)+1440)%1440:720,night=m<330||m>=1140;
    if(k==='kisa'||k==='nevreme'||k==='sneg')return 'ikona_kisa.png';return night?'ikona_noc.png':'ikona_sunce.png';}catch(e){return 'ikona_sunce.png';}
}
function tick(){
  var d=txt('d'),t=txt('t'),m=txt('m'),w=txt('wt'),ic=icon(),s=[d,t,m,w,ic].join('|');
  if(s===last)return;last=s;
  sDate.textContent=d;sTime.textContent=t;sMoney.textContent=m.replace(/\s*дин\.?$/,'');sWx.textContent=w;
  var u=IC+ic;if(iWx.getAttribute('src')!==u)iWx.src=u;
}
setInterval(tick,300);tick();
window.CooksterHudTop={bar:bar};
})();
