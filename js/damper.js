/* Cookster: siber (ventil) na dimovodnoj cevi. Klik na gvozdenu rucicu na cevi (gore desno na sporetu) prebacuje siber:
   - otvoren (rucica uspravno): vatra gori kao do sada;
   - zatvoren (rucica poprecno): tiha vatra. Za kuvanje i pecenje se racuna nivo 1 (effFireLevel u game.js), a svaki stepen drva traje FIRE_CLOSED_FACTOR (3) puta duze (fireBurnMs).
   Uz ulje ili tecnost u posudi tiha vatra ne dozvoljava da jelo zagori (js/core/pan.js, simmerSafe) - tako se krcka satima (1 stvarni minut = 1 sat u igri).
   Stanje se pamti u localStorage 'cookster.damper.v1' (posebno od snimka igre). Slike: assets/ui/stove/siber_otvoren.webp, siber_zatvoren.webp. */
(function(){
'use strict';
if(window.CooksterDamper)return;
var KEY='cookster.damper.v1';
// where the plate of the handle sits on the pipe (scene pixels) and how big it is
var CX=1608,CY=262,PLATE=22;
var IMG_W=501,IMG_H=598,PCX=115.5,PCY=105.5,PLATE_PX=225;     // the picture (half size of the original), the middle of its plate and the width of the plate in it
var K=PLATE/PLATE_PX;
var img=null;

function S(){try{return stoveState;}catch(e){return null;}}   // stoveState je const u game.js (nije na window)
function closed(){var st=S();return st?st.damper==='closed':false;}
function toast(m){try{showToast(m);}catch(e){}}
function paint(){
  if(!img)return;
  var c=closed();
  img.src='assets/ui/stove/siber_'+(c?'zatvoren':'otvoren')+'.webp?v=1';
  img.title=c?'Šiber: zatvoren (tiha vatra). Klik: otvori':'Šiber: otvoren. Klik: zatvori (tiha vatra)';
}
function set(isClosed,quiet){
  var st=S();if(!st)return;
  var was=closed();
  st.damper=isClosed?'closed':'open';
  try{localStorage.setItem(KEY,st.damper);}catch(e){}
  if(was!==!!isClosed){
    // the wood that is burning now lasts longer (closed) or shorter (open) in the same proportion
    try{
      var now=Date.now(),rem=(+stoveState.burnEndsAt||0)-now;
      if(stoveState.fireOn&&rem>0){
        rem=isClosed?rem*FIRE_CLOSED_FACTOR:rem/FIRE_CLOSED_FACTOR;
        stoveState.burnEndsAt=now+rem;
        scheduleFireBurn(false);
      }
      updateFireTimerBar();
    }catch(e){}
    if(!quiet)toast(isClosed?'Šiber je zatvoren: tiha vatra, drvo traje duže.':'Šiber je otvoren: vatra jače gori.');
  }
  paint();
}
function toggle(){set(!closed());}

function build(){
  var sc=document.getElementById('scene');if(!sc||img)return;
  img=document.createElement('img');img.draggable=false;img.alt='Šiber';
  img.style.cssText='position:absolute;z-index:26;cursor:pointer;pointer-events:auto;transition:filter .12s;'
    +'left:'+(CX-PCX*K).toFixed(1)+'px;top:'+(CY-PCY*K).toFixed(1)+'px;width:'+(IMG_W*K).toFixed(1)+'px;height:'+(IMG_H*K).toFixed(1)+'px;'
    +'filter:drop-shadow(1px 2px 1.5px rgba(20,8,0,.5))';
  img.addEventListener('mouseenter',function(){img.style.filter='drop-shadow(0 0 5px rgba(255,214,90,.95)) drop-shadow(1px 2px 1.5px rgba(20,8,0,.5))';});
  img.addEventListener('mouseleave',function(){img.style.filter='drop-shadow(1px 2px 1.5px rgba(20,8,0,.5))';});
  img.addEventListener('click',onClick);
  sc.appendChild(img);
  paint();
}
// a click on the handle only switches the damper (pointerdown is eaten by an earlier handler of the game, so the click event is used)
function onClick(e){e.preventDefault();e.stopPropagation();toggle();}

function init(){
  try{var v=localStorage.getItem(KEY);var st=S();if(st)st.damper=(v==='closed')?'closed':'open';}catch(e){}
  build();
}
window.CooksterDamper={set:set,toggle:toggle,get closed(){return closed();}};
if(document.readyState==='complete')init();else window.addEventListener('load',init);
})();
