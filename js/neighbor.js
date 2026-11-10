/* Cookster: the neighbour at the window (the first meeting).
   When the kitchen is about two thirds clean, somebody knocks on the window: the old neighbour is seen through the glass (assets/effects/komsinica_kuca.webp, a piece of the picture
   laid over the window). The player opens the window with a click; the neighbour leans on the sill (komsinica_otvoren.webp) and speaks (a box with "Dalje"):
   she remembers Savka, asks for a Serbian salad and says where the board is. Then the instructions of Savka's book start (js/tutorial.js).
   Both pieces are only parts of the pictures made in ChatGPT, over the real kitchen. State: localStorage 'cookster.neighbor.v1' ('1' = the meeting was done); a new dirty kitchen clears it.
   For a test: add ?komsinica to the address (it knocks 3 seconds after the start). */
(function(){
'use strict';
if(window.CooksterNeighbor)return;
var KEY='cookster.neighbor.v1',THRESHOLD=.5;
var LINES=[
  {who:'Komšinica',text:'Dobar dan, dete. Vidim da se u Savkinoj kući opet vrti.'},
  {who:'Komšinica',text:'Tako smo mi radili dok je ona bila tu. Kucnemo na prozor, kažemo šta nam treba, a ona nam spremi.'},
  {who:'Komšinica',text:'Da li bih mogla tebe da zamolim za jednu srpsku salatu? Imam goste kod kuće.'},
  {who:'',text:'Salata… Nadam se da znam.'},
  {who:'Komšinica',text:'Znaćeš. Pogledaj u njenu knjigu. Platiću, ne brini.'},
  {who:'Komšinica',text:'Uzgred, daska ti je u desnoj fioci.'}
];
var SALAD_LINES=[
  {who:'Komšinica',text:'Dobar dan, dete. Je l\' gotova salata?'},
  {who:'',text:'Evo… gotova je.'},
  {who:'Komšinica',text:'Gle, divota. Kao za Savke.'},
  {who:'Komšinica',text:'Evo ti dvesta dinara, i hvala ti. Doći ću opet.'}
];
var SALAD_PAY=200,KEY2='cookster.neighbor.salad.v1';
var st='idle',elK=null,elO=null,box=null,li=0,knockT=0,lines=LINES,afterTalk=null,saladOn=false,forced=/[?&]komsinica\b/.test(location.search);
function done(){try{return localStorage.getItem(KEY)==='1';}catch(e){return false;}}
function prog(){try{return window.CooksterKitchenClean&&CooksterKitchenClean.active()?CooksterKitchenClean.progress():-1;}catch(e){return -1;}}
function build(){
  var sc=document.getElementById('scene');if(!sc||elK)return;
  function mk(id,src,l,t,w,h,z){var d=document.createElement('div');d.id=id;d.setAttribute('aria-hidden','true');d.style.cssText='position:absolute;left:'+l+'px;top:'+t+'px;width:'+w+'px;height:'+h+'px;pointer-events:none;z-index:'+z+';opacity:0;transition:opacity .7s ease;background:url('+src+') 0 0/100% 100% no-repeat';return d;}
  elK=mk('komsinicaKuca','assets/effects/komsinica_kuca.webp?v=1',0,26,74,252,0);
  elO=mk('komsinicaOtvoren','assets/effects/komsinica_otvoren.webp?v=1',0,0,142,312,2);
  var ref=document.getElementById('windowOpen');
  if(ref&&ref.parentNode===sc){sc.insertBefore(elK,ref);sc.insertBefore(elO,ref.nextSibling);}else{sc.appendChild(elK);sc.appendChild(elO);}
  var css=document.createElement('style');
  css.textContent='#nbBox{position:fixed;left:50%;bottom:150px;transform:translateX(-50%);z-index:2147483300;width:min(640px,92vw);padding:12px 18px 12px 18px;background:#fbf0d6;border:3px solid #8a4a1c;border-radius:14px;box-shadow:0 8px 22px rgba(0,0,0,.45);color:#3b2412;font:600 18px/1.4 Georgia,"Times New Roman",serif;display:none}'
    +'#nbBox .nb-who{font:800 12px system-ui,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#a0743c;margin-bottom:3px}'
    +'#nbBox .nb-row{display:flex;justify-content:flex-end;margin-top:8px}#nbBox button{border:0;border-radius:8px;padding:6px 16px;cursor:pointer;background:#d9a441;color:#2a1a0e;font:800 13px system-ui,sans-serif}#nbBox button:hover{background:#f0c36a}';
  document.head.appendChild(css);
  box=document.createElement('div');box.id='nbBox';box.innerHTML='<div class="nb-who"></div><div class="nb-text"></div><div class="nb-row"><button type="button">Dalje ▸</button></div>';
  document.body.appendChild(box);
  box.querySelector('button').addEventListener('click',next);
  window.addEventListener('keydown',function(e){if(st==='talk'&&(e.key==='Enter'||e.key===' ')){e.preventDefault();next();}},true);
}
function sub(t,ms){try{if(window.CooksterNarration)CooksterNarration.sub(t,ms||3500);}catch(e){}}
// three knocks on the glass (made with the Web Audio: a short low thud with a click)
function knockSound(){
  try{
    var AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;var ac=window.__nbAc||(window.__nbAc=new AC());if(ac.state==='suspended')ac.resume();
    [0,.3,.58].forEach(function(dt){
      var t=ac.currentTime+dt,o=ac.createOscillator(),g=ac.createGain();o.type='sine';o.frequency.setValueAtTime(190,t);o.frequency.exponentialRampToValueAtTime(70,t+.09);
      g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.55,t+.005);g.gain.exponentialRampToValueAtTime(.001,t+.16);o.connect(g);g.connect(ac.destination);o.start(t);o.stop(t+.2);
      var n=ac.createBuffer(1,ac.sampleRate*.04,ac.sampleRate),d=n.getChannelData(0);for(var i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*(1-i/d.length);
      var s=ac.createBufferSource(),g2=ac.createGain();s.buffer=n;g2.gain.value=.25;s.connect(g2);g2.connect(ac.destination);s.start(t);
    });
  }catch(e){}
}
function knock(){
  build();st='knock';elK.style.opacity='1';knockSound();
  sub('Neko kuca na prozor?',3500);
  setTimeout(function(){if(st==='knock')sub('(Klikni na prozor da ga otvoriš.)',4500);},3800);
  clearInterval(knockT);knockT=setInterval(function(){if(st==='knock'){knockSound();}else clearInterval(knockT);},14000);
}
function windowOpen(){try{return !!window.CooksterWindow&&CooksterWindow.isOpen();}catch(e){return false;}}
function talk(ls,after){
  lines=ls||LINES;afterTalk=after||null;
  st='talk';clearInterval(knockT);elK.style.opacity='0';
  setTimeout(function(){elO.style.opacity='1';},900);
  setTimeout(function(){li=0;showLine();},1700);
}
function showLine(){
  var L=lines[li];box.querySelector('.nb-who').textContent=L.who||'';box.querySelector('.nb-who').style.display=L.who?'':'none';
  box.querySelector('.nb-text').textContent=L.text;box.querySelector('.nb-text').style.fontStyle=L.who?'':'italic';
  box.style.display='block';box.querySelector('button').textContent=li>=lines.length-1?'U redu':'Dalje ▸';
}
function next(){
  if(st!=='talk')return;
  li++;
  if(li>=lines.length){finish();return;}
  showLine();
}
function finish(){
  box.style.display='none';elO.style.opacity='0';
  if(afterTalk){var f=afterTalk;afterTalk=null;st='done';f();return;}
  st='done';
  try{localStorage.setItem(KEY,'1');}catch(e){}
  setTimeout(function(){try{if(window.CooksterTutorial)CooksterTutorial.start(true);}catch(e){}},900);      // Savka's book: the instructions begin
}
// the second visit: when the salad is ready, the neighbour comes back for it, pays and leaves
var delivered=false,saladVisit=false;
function takeSalad(){      // the bowl with the salad is emptied (she takes it)
  try{items.forEach(function(v){try{if(!isContainerItem(v))return;var ks=[];try{ks=Object.keys(CooksterPan.read(v).ingredients||{});}catch(e){}try{ks=ks.concat(Object.keys(CooksterContainer.read(v).items||{}));}catch(e){}
    if(ks.some(function(k){return /paradajz/.test(k);})){clearVesselAfterPour(v);renderCookwareContents(v);}}catch(e){}});}catch(e){}
}
function expectSalad(){
  if(saladOn||delivered)return;saladOn=true;saladVisit=true;
  try{if(localStorage.getItem(KEY2)==='1'){delivered=true;return;}}catch(e){}
  setTimeout(function(){
    build();st='knock';elK.style.opacity='1';knockSound();sub('Komšinica se vratila.',3500);
    setTimeout(function(){if(st==='knock')sub('(Klikni na prozor da ga otvoriš.)',4500);},3800);
    clearInterval(knockT);knockT=setInterval(function(){if(st==='knock')knockSound();else clearInterval(knockT);},14000);
    var w=setInterval(function(){if(st==='knock'&&windowOpen()){clearInterval(w);talk(SALAD_LINES,function(){
      takeSalad();try{setMoney(money+SALAD_PAY);showToast('Dobio si '+SALAD_PAY+' dinara.');}catch(e){}
      delivered=true;saladVisit=false;try{localStorage.setItem(KEY2,'1');}catch(e){}
    });}},500);
  },4000);
}
function tick(){
  if(st==='idle'){
    if(done())return;
    if(forced){forced=false;setTimeout(knock,3000);st='wait';return;}
    var p=prog();if(p>=THRESHOLD)knock();
  }else if(st==='knock'&&windowOpen()&&!saladVisit){talk();}
}
function init(){
  build();
  var p=prog();if(p>=0&&p<.02){try{localStorage.removeItem(KEY);}catch(e){}}      // a fresh dirty kitchen = a new game: the meeting happens again
  setInterval(tick,500);
}
// the kitchen is declared clean at 80%: if the cleaning jumped over the threshold between two checks, it knocks now
window.addEventListener('cookster:kitchen-clean',function(){if(st==='idle'&&!done())setTimeout(function(){if(st==='idle'&&!done())knock();},1800);});
window.CooksterNeighbor={knock:knock,state:function(){return st;},lines:LINES,expectSalad:expectSalad,delivered:function(){return delivered;}};
if(document.readyState==='complete')setTimeout(init,600);else window.addEventListener('load',function(){setTimeout(init,600);});
})();
