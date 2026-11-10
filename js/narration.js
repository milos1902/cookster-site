/* Cookster: the voice of the narrator (the heir of the house) in the first minutes of a new game.
   The kitchen starts dirty. When the game is shown (the menu is closed) and nothing has been cleaned yet, the narrator says:
     1. "Pre bilo čega... moram sve da očistim."   (assets/audio/narracija/ocistiti.mp3)
     2. after a pause, if the player still has not started to clean (does not hold the broom): "Negde je tu sigurno bila metla."   (metla.mp3)
   The words also appear as a subtitle at the bottom. Each line plays once per start of the game. The voice was made in ElevenLabs.
   More lines (the letter, the neighbour at the window) come later. */
(function(){
'use strict';
if(window.CooksterNarration)return;
var DIR='assets/audio/narracija/';
var LINES={
  ocistiti:{file:'ocistiti.mp3?v=1',text:'Pre bilo čega… moram sve da očistim.'},
  metla:{file:'metla.mp3?v=1',text:'Negde je tu sigurno bila metla.'}
};
var started=false,played={},cur=null,sub=null,subT=0,pending=null;
function dirty(){try{return !!window.CooksterKitchenClean&&CooksterKitchenClean.active()&&CooksterKitchenClean.progress()<.02;}catch(e){return false;}}
function holdingBroom(){try{return typeof holding!=='undefined'&&holding&&holding.dataset&&holding.dataset.itemId==='metla';}catch(e){return false;}}
function showSub(t,ms){
  if(!sub){
    var st=document.createElement('style');
    st.textContent='#narSub{position:fixed;left:50%;bottom:176px;transform:translateX(-50%);z-index:2147483200;max-width:min(720px,92vw);padding:10px 22px;border-radius:12px;background:rgba(28,16,8,.82);color:#fff0d2;font:600 20px/1.35 Georgia,"Times New Roman",serif;text-align:center;box-shadow:0 6px 18px rgba(0,0,0,.45);opacity:0;transition:opacity .5s ease;pointer-events:none}#narSub.on{opacity:1}';
    document.head.appendChild(st);
    sub=document.createElement('div');sub.id='narSub';document.body.appendChild(sub);
  }
  clearTimeout(subT);sub.textContent=t;void sub.offsetWidth;sub.classList.add('on');
  subT=setTimeout(function(){sub.classList.remove('on');},ms);
}
function say(id,done){
  var L=LINES[id];if(!L||played[id])return false;
  played[id]=1;
  var a=new Audio(DIR+L.file);a.volume=.95;cur=a;
  var finished=false;function fin(){if(finished)return;finished=true;if(done)done();}
  a.addEventListener('ended',fin);a.addEventListener('error',fin);
  showSub(L.text,4200);
  var p=a.play();
  if(p&&p.catch)p.catch(function(){      // the browser blocks the sound until the first click: try again at the first click
    played[id]=0;pending=function(){say(id,done);};fin=function(){};
  });
  return true;
}
function start(){
  if(started)return;started=true;
  setTimeout(function(){
    if(!dirty())return;
    say('ocistiti',function(){
      setTimeout(function(){if(dirty()&&!holdingBroom())say('metla');},13000);      // the second line: only if the player still did not take the broom
    });
  },1500);
}
window.addEventListener('pointerdown',function(){if(pending){var f=pending;pending=null;f();}},true);
window.addEventListener('cookster:menu-closed',start);
function auto(){if(/[?&]nomenu\b/.test(location.search))setTimeout(start,2500);}
if(document.readyState==='complete')auto();else window.addEventListener('load',auto);
window.CooksterNarration={say:say,start:start};
})();
