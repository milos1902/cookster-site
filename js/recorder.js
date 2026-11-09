/* Cookster: snimanje recepta (telefon). Korak 1.
   Dugme sa telefonom (levo dole, desno od menija): klik otvori mali meni "Snimaj". Dok se snima, gore desno stoji crvena tačka REC sa tajmerom,
   a igra beleži šta igrač radi: sastojak u posudu, seckanje, začin, jačina vatre. "Gotovo" zatvara snimak i pokazuje karticu recepta (sastojci + koraci).
   Poslednji snimak je u window.CooksterRecorder.last (i u localStorage 'cookster.recorder.last.v1') - koristi ga kasnije ekran objave.
   Ikonica dugmeta: assets/ui/recorder/phone.webp ako postoji, inače nacrtana u kodu. */
(function(){
'use strict';
if(window.CooksterRecorder)return;
var KEY='cookster.recorder.last.v1';
var rec=null;            // {t0, steps:[]}
var last=null;
try{last=JSON.parse(localStorage.getItem(KEY)||'null');}catch(e){}

function toast(m){try{showToast(m);}catch(e){}}
function fmt(ms){var s=Math.max(0,Math.round(ms/1000)),m=Math.floor(s/60);return (m<10?'0':'')+m+':'+(s%60<10?'0':'')+(s%60);}
function esc(t){return String(t).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function itemsList(){try{return typeof items!=='undefined'?items:(window.items||[]);}catch(e){return window.items||[];}}

/* ---------- beleženje ---------- */
function log(type,what,where,extra){
  if(!rec)return;
  var t=Date.now()-rec.t0,steps=rec.steps,p=steps[steps.length-1];
  // isto što i malopre (isti tip, ista stvar, ista posuda): samo uvećaj broj (npr. 3 mere soli)
  if(p&&p.type===type&&p.what===what&&p.where===where&&(t-p.tLast)<12000&&type!=='fire'){p.n=(p.n||1)+1;p.tLast=t;refreshBadge();return;}
  steps.push({t:t,tLast:t,type:type,what:what,where:where||'',n:1,extra:extra||null});
  refreshBadge();
}
function labelOfItem(it){
  var l='';try{l=it.dataset.label||'';}catch(e){}
  try{if(!l&&typeof ingredientVisualMeta==='function'){var m=ingredientVisualMeta(it);l=(m&&m.label)||'';}}catch(e){}
  l=String(l||'sastojak').replace(/ · .*/,'');
  var m=/^sitno seckan[a-z]* (.+)$/i.exec(l);if(m)l=m[1]+' (seckan)';
  return l;
}
function labelOfVessel(v){var l='';try{l=v.dataset.label||'posuda';}catch(e){l='posuda';}return String(l).replace(/ · .*/,'');}
function wrapGlobals(){
  // sastojak u posudu
  try{
    var orig=window.addIngredientToContainer;
    if(typeof orig==='function'&&!orig.__rec){
      var w=function(item,vessel){
        if(!rec)return orig.apply(this,arguments);
        var before=null,uses=0,had=false,lab='';
        try{before=containerTotal(vessel);uses=+item.dataset.uses||0;had=itemsList().indexOf(item)>=0;lab=labelOfItem(item);}catch(e){}
        var oil=false;try{oil=!!isSceneOilBottle(item);}catch(e){}
        var r=orig.apply(this,arguments);
        try{
          var changed=oil||(before!==null&&containerTotal(vessel)!==before)||((+item.dataset.uses||0)!==uses)||(had&&itemsList().indexOf(item)<0);
          if(r&&changed)log('add',lab,labelOfVessel(vessel));
        }catch(e){}
        return r;
      };
      w.__rec=true;window.addIngredientToContainer=w;
    }
  }catch(e){}
  // seckanje
  try{
    var o2=window.setVegetableDiced;
    if(typeof o2==='function'&&!o2.__rec){
      var w2=function(el){
        var r=o2.apply(this,arguments);
        try{if(rec&&el&&el.dataset&&el.dataset.cutState==='diced')log('cut',String(el.dataset.label||'povrće').replace(/^sitno seckan[a-z]* /i,''),'');}catch(e){}
        return r;
      };
      w2.__rec=true;window.setVegetableDiced=w2;
    }
  }catch(e){}
}
// začini (js/spices.js šalje događaj)
window.addEventListener('cookster:spice',function(e){var d=e.detail||{};log('spice',d.name||d.kind||'začin',d.vessel||'');});
// jačina vatre (proverava se par puta u sekundi)
var lastFire=null,lastDamper=null;
setInterval(function(){
  if(!rec)return;
  try{
    var on=!!stoveState.fireOn&&(+stoveState.fireLevel||0)>0,lv=on?(+stoveState.fireLevel||1):0;
    var dm=(stoveState.damper==='closed')?'closed':'open';
    if(lastDamper===null)lastDamper=dm;else if(dm!==lastDamper){lastDamper=dm;log('fire',dm==='closed'?'Zatvorio šiber (tiha vatra)':'Otvorio šiber',''+'',{damper:dm});}
    if(lastFire===null){lastFire=lv;return;}
    if(lv!==lastFire){
      var txt=lv===0?'Vatra se ugasila':(lastFire===0?'Naložio vatru':(lv>lastFire?'Pojačao vatru':'Vatra je slabija'));
      log('fire',txt,'',{level:lv});lastFire=lv;
    }
  }catch(e){}
},400);

/* ---------- izgled ---------- */
var css=document.createElement('style');
css.textContent=[
'#recBtn{position:fixed;left:14px;bottom:262px;width:62px;height:62px;z-index:1901;border:0;padding:0;border-radius:50%;cursor:pointer;background:transparent;user-select:none;-webkit-user-select:none;filter:drop-shadow(0 3px 5px rgba(40,20,6,.5));transition:transform .12s,filter .12s}',
'#recBtn:hover{transform:scale(1.08);filter:drop-shadow(0 0 8px rgba(255,214,90,.9)) drop-shadow(0 3px 5px rgba(40,20,6,.5))}',
'#recBtn img,#recBtn svg{width:100%;height:100%;display:block;pointer-events:none}',
'#recBtn.rec-on{animation:recPulse 1.1s ease-in-out infinite}',
'@keyframes recPulse{0%,100%{box-shadow:0 0 0 0 rgba(230,30,30,.0)}50%{box-shadow:0 0 0 7px rgba(230,30,30,.45),0 0 18px 8px rgba(230,30,30,.45)}}',
'#recBadge{position:absolute;right:-4px;top:-4px;min-width:20px;height:20px;padding:0 5px;border-radius:10px;background:#c92121;color:#fff;font:800 12px/20px system-ui,sans-serif;text-align:center;display:none;box-sizing:border-box;border:2px solid #fff3d6}',
'body.pantry-open #recBtn,body.garden-open #recBtn,body.market-open #recBtn{display:none}',
'#recMenu{position:fixed;left:14px;bottom:332px;z-index:1951;display:none;flex-direction:column;gap:6px;padding:8px;background:rgba(48,28,14,.96);border:2px solid #d9a441;border-radius:10px;box-shadow:0 6px 18px rgba(0,0,0,.5);min-width:176px}',
'#recMenu button{border:0;border-radius:7px;padding:8px 14px;cursor:pointer;background:#f0c36a;color:#2a1a0e;font:800 14px system-ui,sans-serif;text-align:left}',
'#recMenu button:hover{background:#ffd98a}#recMenu button[disabled]{opacity:.45;cursor:default}',
'#recMenu .rm-note{color:#ffeccb;font:600 12px system-ui,sans-serif;padding:0 4px}',
'#recHud{position:fixed;right:18px;top:58px;z-index:1952;display:none;align-items:center;gap:8px;padding:5px 12px;border-radius:16px;background:rgba(40,18,10,.9);border:2px solid #b02a2a;color:#fff3d6;font:800 15px system-ui,sans-serif;font-variant-numeric:tabular-nums;pointer-events:none}',
'#recHud i{width:12px;height:12px;border-radius:50%;background:#e22;animation:recBlink 1s steps(2,jump-none) infinite}',
'@keyframes recBlink{0%{opacity:1}50%{opacity:.15}100%{opacity:1}}',
'#recCard{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:1960;display:none;width:min(460px,92vw);max-height:80vh;overflow:auto;padding:18px 22px;background:#fbf0d6;border:3px solid #8a4a1c;border-radius:14px;box-shadow:0 14px 40px rgba(0,0,0,.55);color:#3b2412;font:500 15px/1.4 Georgia,"Times New Roman",serif}',
'#recCard h3{margin:0 0 4px;font:900 22px Georgia,serif;color:#7a2a12}',
'#recCard .rc-sub{color:#8a5a2c;font-style:italic;margin-bottom:10px}',
'#recCard h4{margin:12px 0 4px;font:800 14px system-ui,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#8a4a1c}',
'#recCard ul,#recCard ol{margin:0;padding-left:22px}#recCard li{margin:2px 0}',
'#recCard .rc-t{color:#a0743c;font:700 12px system-ui,sans-serif;margin-right:6px;font-variant-numeric:tabular-nums}',
'#recCard button{margin-top:14px;border:0;border-radius:8px;padding:9px 18px;cursor:pointer;background:#d9a441;color:#2a1a0e;font:800 14px system-ui,sans-serif}',
'#recCard button:hover{background:#f0c36a}'
].join('\n');
document.head.appendChild(css);

var btn=document.createElement('button');btn.id='recBtn';btn.type='button';btn.title='Telefon: snimanje recepta';
var FALLBACK='<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="47" fill="#7a4a22" stroke="#e0aa3a" stroke-width="4"/><circle cx="50" cy="50" r="35" fill="#f6e6bd"/><rect x="36" y="22" width="28" height="56" rx="6" fill="#fff3b8" stroke="#4a3426" stroke-width="4"/><circle cx="50" cy="28" r="1.8" fill="#222"/><circle cx="50" cy="52" r="6.5" fill="#d42a1c"/></svg>';
(function(){
  var img=new Image();img.alt='';img.draggable=false;
  img.onload=function(){btn.innerHTML='';btn.appendChild(img);btn.appendChild(badge);};
  img.onerror=function(){};
  img.src='assets/ui/recorder/phone.webp?v=1';
})();
var badge=document.createElement('span');badge.id='recBadge';
btn.innerHTML=FALLBACK;btn.appendChild(badge);
btn.style.setProperty('left','14px','important');btn.style.setProperty('bottom','262px','important');   // neki drugi skript postavlja inline 'left' svim dugmadima: ovo ima prednost
document.body.appendChild(btn);

var menu=document.createElement('div');menu.id='recMenu';document.body.appendChild(menu);
var hud=document.createElement('div');hud.id='recHud';hud.innerHTML='<i></i><span>REC</span><b id="recT">00:00</b>';document.body.appendChild(hud);
var card=document.createElement('div');card.id='recCard';document.body.appendChild(card);

function refreshBadge(){
  var n=rec?rec.steps.length:0;
  badge.style.display=n>0?'block':'none';badge.textContent=String(n);
}
function menuHtml(){
  menu.innerHTML='';
  function b(txt,fn,dis){var x=document.createElement('button');x.type='button';x.textContent=txt;if(dis)x.disabled=true;x.onclick=function(e){e.stopPropagation();fn();};menu.appendChild(x);return x;}
  if(rec){
    b('■ Gotovo',stop);
    var s=document.createElement('div');s.className='rm-note';s.textContent='Snima se… koraka: '+rec.steps.length;menu.appendChild(s);
  }else{
    b('● Snimaj',start);
    if(last&&last.steps&&last.steps.length)b('Poslednji recept',function(){hideMenu();showCard(last);});
    var s2=document.createElement('div');s2.className='rm-note';s2.textContent='Slikanje jela: uskoro';menu.appendChild(s2);
  }
}
function showMenu(){menuHtml();menu.style.display='flex';}
function hideMenu(){menu.style.display='none';}
btn.addEventListener('click',function(e){e.stopPropagation();if(menu.style.display==='flex')hideMenu();else showMenu();});
window.addEventListener('pointerdown',function(e){if(menu.style.display==='flex'&&!menu.contains(e.target)&&e.target!==btn&&!btn.contains(e.target))hideMenu();},true);

/* ---------- tok ---------- */
var tick=0;
function start(){
  if(rec)return;
  wrapGlobals();
  rec={t0:Date.now(),steps:[]};lastFire=null;lastDamper=null;
  btn.classList.add('rec-on');hud.style.display='flex';refreshBadge();
  clearInterval(tick);tick=setInterval(function(){var el=document.getElementById('recT');if(el&&rec)el.textContent=fmt(Date.now()-rec.t0);},500);
  document.getElementById('recT').textContent='00:00';
  hideMenu();toast('Snimanje je počelo. Kuvaj, a ja pamtim korake.');
}
function stop(){
  if(!rec)return;
  var r=rec;rec=null;clearInterval(tick);
  btn.classList.remove('rec-on');hud.style.display='none';refreshBadge();hideMenu();
  var dur=Date.now()-r.t0;
  if(!r.steps.length){toast('Nisi ništa uradio dok se snimalo, pa nema recepta.');return;}
  var ing={};
  r.steps.forEach(function(s){if(s.type==='add'||s.type==='cut'||s.type==='spice')ing[s.what]=(ing[s.what]||0)+(s.n||1);});
  last={id:'rec_'+Date.now(),savedAt:new Date().toISOString(),durationMs:dur,steps:r.steps.map(function(s){return{t:s.t,type:s.type,what:s.what,where:s.where,n:s.n,extra:s.extra};}),ingredients:ing};
  try{localStorage.setItem(KEY,JSON.stringify(last));}catch(e){}
  try{window.dispatchEvent(new CustomEvent('cookster:recipe-recorded',{detail:last}));}catch(e){}
  showCard(last);
}
function stepText(s){
  var n=s.n>1?' ×'+s.n:'';
  if(s.type==='add')return 'Stavio '+s.what+n+(s.where?' u '+s.where:'');
  if(s.type==='cut')return 'Iseckao '+s.what+n;
  if(s.type==='spice')return 'Dodao začin: '+s.what+n+(s.where?' ('+s.where+')':'');
  if(s.type==='fire')return s.what;
  return s.what;
}
function showCard(r){
  var ing=Object.keys(r.ingredients||{});
  var h='<h3>Snimljen recept</h3><div class="rc-sub">Trajanje snimka: '+fmt(r.durationMs)+' · koraka: '+r.steps.length+'</div>';
  if(ing.length)h+='<h4>Sastojci</h4><ul>'+ing.map(function(k){return '<li>'+esc(k)+(r.ingredients[k]>1?' ×'+r.ingredients[k]:'')+'</li>';}).join('')+'</ul>';
  h+='<h4>Koraci</h4><ol>'+r.steps.map(function(s){return '<li><span class="rc-t">'+fmt(s.t)+'</span>'+esc(stepText(s))+'</li>';}).join('')+'</ol>';
  h+='<button type="button" id="recCardX">Zatvori</button>';
  card.innerHTML=h;card.style.display='block';
  document.getElementById('recCardX').onclick=function(){card.style.display='none';};
}

window.CooksterRecorder={start:start,stop:stop,get recording(){return !!rec;},get last(){return last;},log:log,showCard:function(){if(last)showCard(last);}};
// funkcije igre se obmotavaju kad se igra učita; i pri samom startu snimanja (za slučaj da je nešto kasnije definisano)
window.addEventListener('load',wrapGlobals);
})();
