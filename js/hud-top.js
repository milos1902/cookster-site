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
'#chud{--bw:clamp(280px,21.5vw,460px);position:fixed;left:6.9vw;top:3px;width:calc(var(--bw)*1.193);height:calc(var(--bw)*.16);z-index:1890;pointer-events:none;user-select:none;-webkit-user-select:none;container-type:inline-size;filter:drop-shadow(0 2px 3px rgba(30,14,4,.45))}',
'body.chud-on #saveTransfer{left:calc(6.9vw + clamp(280px,21.5vw,460px)*1.193 + 14px)!important}',
'body.pantry-open #chud,body.garden-open #chud,body.market-open #chud{display:none}',
'#chud .ch-p{position:absolute;top:0;height:100%;background-repeat:no-repeat;background-size:100% 100%}',
'#chud .ch-l{left:0;width:calc(var(--bw)*.515 + 1.5px);background-image:url('+BAR.replace('.png','_L.png')+')}',
'#chud .ch-m{left:calc(var(--bw)*.515);width:calc(var(--bw)*.343 + 1.5px);background-image:url('+BAR.replace('.png','_M.png')+')}',
'#chud .ch-ra{left:calc(var(--bw)*.858);width:calc(var(--bw)*.145 + 1.5px);background-image:url('+BAR.replace('.png','_Ra.png')+')}',
'#chud .ch-rb{left:calc(var(--bw)*1.003);width:calc(var(--bw)*.09 + 1.5px);background-image:url('+BAR.replace('.png','_Rb.png')+')}',
'#chud .ch-rc{left:calc(var(--bw)*1.093);width:calc(var(--bw)*.1);background-image:url('+BAR.replace('.png','_Rc.png')+')}',
'#chud .ch-c{position:absolute;top:0;height:100%;transform:translateX(-50%);display:flex;align-items:center;justify-content:center;gap:calc(var(--bw)*.012);white-space:nowrap;font-family:"Paytone One","CooksterSerif",Georgia,serif;font-weight:400;font-synthesis:none;color:#7a1e14;text-shadow:0 calc(var(--bw)*.0025) 0 rgba(255,236,200,.5);font-size:calc(var(--bw)*.043);line-height:1}',
'#chud .ch-c img{height:calc(var(--bw)*.082);width:auto;display:block;filter:drop-shadow(0 calc(var(--bw)*.003) calc(var(--bw)*.003) rgba(40,20,6,.35))}',
'#chud .ch-t{font-size:calc(var(--bw)*.056)}'
].join('\n');
document.head.appendChild(css);
var bar=document.createElement('div');bar.id='chud';['l','m','ra','rb','rc'].forEach(function(k){var p=document.createElement('div');p.className='ch-p ch-'+k;bar.appendChild(p);});
function cell(x){var c=document.createElement('div');c.className='ch-c';c.style.left='calc(var(--bw)*'+x+')';bar.appendChild(c);return c;}
var cDate=cell(.179),cTime=cell(.397),cMoney=cell(.686),cWx=cell(.9945);
var sDate=document.createElement('span'),sTime=document.createElement('span');sTime.className='ch-t';
cDate.appendChild(sDate);cTime.appendChild(sTime);
var iCoin=new Image();iCoin.src=IC+'ikona_novac.png';iCoin.alt='';var sMoney=document.createElement('span');cMoney.append(iCoin,sMoney);
var iWx=new Image();iWx.alt='';var sWx=document.createElement('span');cWx.append(iWx,sWx);
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
