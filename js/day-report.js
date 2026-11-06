/* Završi dan: dugme + pregled dana (poslužena jela i pića, zarada, ocena gostiju).
   CooksterDayReport.record(kind, ev) zove konobar kad spusti jelo/piće (tavern-scene.js).
   Dan se završava dugmetom ili u ponoć (day-light.js, CooksterDay.isClosed()). "Novi dan" poziva CooksterDay.endDay(). */
(function(){
  'use strict';
  var KEY='cookster.day-report.v1',PRICE_FOOD=300,PRICE_DRINK=120,BONUS_PERFECT=50;
  function fresh(day){return{day:day,food:0,drinks:0,earned:0,sum:0,rated:0,perfect:0,rep0:null};}
  function dayNo(){try{return CooksterDay.day();}catch(e){return 1;}}
  function rep(){try{return CooksterQuality.reputation();}catch(e){return 0;}}
  var S=null;
  function load(){try{S=JSON.parse(localStorage.getItem(KEY));}catch(e){S=null;}
    if(!S||typeof S.food!=='number')S=fresh(dayNo());
    if(S.rep0==null)S.rep0=rep();}
  function save(){try{localStorage.setItem(KEY,JSON.stringify(S));}catch(e){}}
  function record(kind,ev){
    if(!S)load();
    var drink=kind==='drink',gain=drink?PRICE_DRINK:PRICE_FOOD;
    if(drink)S.drinks++;else S.food++;
    if(ev){S.sum+=ev.score;S.rated++;if(ev.perfect){S.perfect++;gain+=BONUS_PERFECT;}else if(ev.score<-2)gain=Math.round(gain*.5);}
    S.earned+=gain;
    try{if(window.CooksterAddMoney)CooksterAddMoney(gain);}catch(e){}
    save();
  }
  function stars(){if(!S.rated)return null;return Math.max(1,Math.min(5,Math.round(3+S.sum/S.rated)));}
  var ov=null;
  function css(){var s=document.createElement('style');s.textContent=
    '#drBtn{position:fixed;left:1062px;top:40px;z-index:2147483000;border:2px solid #351b0d;border-radius:12px;background:#e8c27a;color:#351b0d;font:700 12px/1 system-ui,sans-serif;padding:6px 10px;cursor:pointer}'+
    '#drBtn:hover{background:#f1d28f}'+
    '#drOv{position:fixed;inset:0;z-index:2147483600;background:rgba(20,10,4,.7);display:none;align-items:center;justify-content:center}'+
    '#drBox{background:#f1d9a0;color:#351b0d;border:3px solid #351b0d;border-radius:16px;padding:22px 28px;min-width:300px;max-width:90vw;font:600 16px/1.5 system-ui,sans-serif;box-shadow:0 10px 40px rgba(0,0,0,.5)}'+
    '#drBox h2{margin:0 0 10px;font-size:22px}#drBox .r{display:flex;justify-content:space-between;gap:30px;border-bottom:1px dashed #351b0d55;padding:4px 0}'+
    '#drBox .b{display:flex;gap:10px;margin-top:16px;justify-content:flex-end}'+
    '#drBox button{border:2px solid #351b0d;border-radius:10px;background:#e8c27a;color:#351b0d;font:700 14px system-ui,sans-serif;padding:9px 14px;cursor:pointer}';
    document.head.appendChild(s);}
  function row(a,b){return '<div class="r"><span>'+a+'</span><b>'+b+'</b></div>';}
  function show(){
    if(!S)load();
    var st=stars(),dRep=rep()-(S.rep0==null?rep():S.rep0);
    if(!ov){ov=document.createElement('div');ov.id='drOv';ov.setAttribute('data-tool-ui','1');document.body.appendChild(ov);}
    ov.innerHTML='<div id="drBox"><h2>Kraj dana '+S.day+'</h2>'+
      row('Poslužena jela',S.food)+row('Posluženo pića',S.drinks)+row('Zarada',S.earned+' din')+
      row('Ocena gostiju',st?('★'.repeat(st)+'☆'.repeat(5-st)+' ('+S.perfect+' savršenih)'):'nije bilo jela')+
      row('Ugled',(dRep>0?'+':'')+dRep+' (ukupno '+rep()+')')+
      '<div class="b"><button id="drBack">Nazad u kafanu</button><button id="drNew">Novi dan (06:00)</button></div></div>';
    ov.style.display='flex';
    document.getElementById('drBack').onclick=function(){ov.style.display='none';};
    document.getElementById('drNew').onclick=newDay;
  }
  function newDay(){
    ov.style.display='none';
    try{CooksterDay.endDay();}catch(e){}
    S=fresh(dayNo());S.rep0=rep();save();
  }
  function finish(){
    try{CooksterDay.pause(false);CooksterDay.setMinute(1440);}catch(e){}
    try{CooksterTavern.setOpenForGuests(false);}catch(e){}
    show();
  }
  var shownFor=-1;
  function init(){
    load();css();
    var b=document.createElement('button');b.id='drBtn';b.type='button';b.textContent='🌙 Završi dan';b.setAttribute('data-tool-ui','1');
    b.onclick=finish;document.body.appendChild(b);
    setInterval(function(){          // u ponoć se pregled otvara sam (jednom po danu)
      try{if(CooksterDay.isClosed()&&shownFor!==CooksterDay.day()){shownFor=CooksterDay.day();show();}}catch(e){}
    },1000);
  }
  window.CooksterDayReport={record:record,show:show,state:function(){return S;}};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
