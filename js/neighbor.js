/* Cookster: the neighbour at the window (the first meeting).
   When the kitchen is about two thirds clean, somebody knocks on the window: the old neighbour is seen through the glass (assets/effects/komsinica_kuca.webp, a piece of the picture
   laid over the window). The player opens the window with a click; the neighbour leans on the sill (komsinica_otvoren.webp) and speaks (a box with "Dalje"):
   she remembers Savka, asks for a Serbian salad and says where the board is. Then the instructions of Savka's book start (js/tutorial.js).
   Both pieces are only parts of the pictures made in ChatGPT, over the real kitchen. State: localStorage 'cookster.neighbor.v1' ('1' = the meeting was done); a new dirty kitchen clears it.
   For a test: add ?komsinica to the address (it knocks 3 seconds after the start). */
(function(){
'use strict';
if(window.CooksterNeighbor)return;
var KEY='cookster.neighbor.v1',THRESHOLD=.6,WIN_CLEAN=.85;
var LINES=[
  {who:'Komšinica',text:'Dobar dan, dete. Vidim da se u Savkinoj kući opet vrti.',v:'susret_1'},
  {who:'Komšinica',text:'Tako smo mi, dete, još dok je Savka bila tu: tek kucnemo, a ona nam već sprema.',v:'susret_2'},
  {who:'Komšinica',text:'Da li bih mogla tebe da zamolim za jednu srpsku salatu? Imam goste kod kuće.',v:'susret_3'},
  {who:'',text:'Salata… Nadam se da znam.',v:'susret_4'},
  {who:'Komšinica',text:'Znaćeš. Pogledaj u njenu knjigu. Platiću, ne brini.',v:'susret_5'},
  {who:'Komšinica',text:'Uzgred, daska ti je u desnoj fioci.',v:'susret_6'}
];
var ORDERS={
  salad:{key:'cookster.neighbor.salad.v1',match:/paradajz/,pay:200,what:'činiju sa salatom',
    lines1:[
      {who:'Komšinica',text:'Dobar dan, dete. Je l\' gotova salata?',v:'salata_a1'},
      {who:'',text:'Evo… gotova je.',v:'salata_a2'},
      {who:'Komšinica',text:'Odlično. Samo je stavi ovde, na dasku prozora.',v:'salata_a3'}
    ],
    lines2:[
      {who:'Komšinica',text:'Gle, divota. Kao za Savke. Novac ti ostavljam na dasci prozora, i hvala ti.',v:'salata_b1'},
      {who:'Komšinica',text:'Kad si već tu… Da li bi mogao da mi ispržiš i tikvice? Za večeru.',v:'salata_b2'},
      {who:'',text:'Tikvice… Pokušaću.',v:'salata_b3'}
    ]},
  tikvice:{key:'cookster.neighbor.tikvice.v1',match:/tikvice/,pay:300,what:'tiganj sa tikvicama',
    lines1:[
      {who:'Komšinica',text:'Dobar dan, dete. Jesu l\' tikvice gotove?',v:'tikvice_a1'},
      {who:'',text:'Evo, ispržene su.',v:'tikvice_a2'}
    ],
    lines2:[
      {who:'Komšinica',text:'Mmm, kako mirišu. Lepo je Savka pričala da ćeš biti njen naslednik.',v:'tikvice_b1'},
      {who:'Komšinica',text:'Laku noć, dete, vidimo se sutra.',v:'tikvice_b3'}
    ]}
};
// the sill of the open window (scene pixels): the bowl / the pan is put there with a click
var SILL={l:0,t:175,r:125,b:335,cx:60,by:285};
var st='idle',elK=null,elO=null,elH=null,elJ=null,speakUntil=0,animOn=false,box=null,li=0,knockT=0,lines=LINES,afterTalk=null,forced=/[?&]komsinica\b/.test(location.search);
function done(){try{return localStorage.getItem(KEY)==='1';}catch(e){return false;}}
function winClean(){try{return window.CooksterKitchenClean&&CooksterKitchenClean.windowProgress?CooksterKitchenClean.windowProgress()>=WIN_CLEAN:true;}catch(e){return true;}}      // the window is cleaned (85% of its dirt gone)
function prog(){try{return window.CooksterKitchenClean&&CooksterKitchenClean.active()?CooksterKitchenClean.progress():-1;}catch(e){return -1;}}
function build(){
  var sc=document.getElementById('scene');if(!sc||elK)return;
  function mk(id,src,l,t,w,h,z){var d=document.createElement('div');d.id=id;d.setAttribute('aria-hidden','true');d.style.cssText='position:absolute;left:'+l+'px;top:'+t+'px;width:'+w+'px;height:'+h+'px;pointer-events:none;z-index:'+z+';opacity:0;transition:opacity .7s ease;background:url('+src+') 0 0/100% 100% no-repeat';return d;}
  elK=mk('komsinicaKuca','assets/effects/komsinica_kuca.webp?v=1',0,26,74,252,27);
  elO=mk('komsinicaOtvoren','assets/effects/komsinica_otvoren.webp?v=1',0,0,142,312,27);      // z 27: above the dirt canvas (26) and the occluders (25), below the waiter (46)
  // living neighbour: a copy of the head (soft mask) sways a little and a copy of the mouth area (child of the head) moves like a jaw while she speaks
  var BG='url(assets/effects/komsinica_otvoren.webp?v=1) 0 0/100% 100% no-repeat';
  function ml(el,m){el.style.webkitMaskImage=m;el.style.maskImage=m;}
  elH=document.createElement('div');elH.style.cssText='position:absolute;left:0;top:0;width:142px;height:312px;pointer-events:none;background:'+BG+';transform-origin:37px 192px;will-change:transform';
  ml(elH,'radial-gradient(ellipse 36px 50px at 33px 142px,#000 62%,transparent 100%)');
  elJ=document.createElement('div');elJ.style.cssText='position:absolute;left:0;top:0;width:142px;height:312px;pointer-events:none;background:'+BG+';transform-origin:47px 158px;will-change:transform';
  ml(elJ,'radial-gradient(ellipse 15px 11px at 47px 166px,#000 55%,transparent 100%)');
  elH.appendChild(elJ);elO.appendChild(elH);
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
// she moves while she speaks: the head sways, the mouth area opens and closes (a line with a voice file can call speak(ms) with its real length)
function speak(ms){speakUntil=performance.now()+ms;if(!animOn){animOn=true;requestAnimationFrame(animStep);}}
function animStep(now){
  if(!elH){animOn=false;return;}
  var t=now/1000,on=now<speakUntil,amp=on?1:0;
  animStep.a=(animStep.a||0)+((amp-(animStep.a||0))*.15);var a=animStep.a;      // smooth start / stop
  var syl=Math.max(0,Math.sin(t*13.5)*Math.sin(t*5.3+1.2)+.25);      // syllables: bursts of mouth movement with small pauses
  var jaw=a*syl*2.2,rot=a*(Math.sin(t*2.1)*1.3+Math.sin(t*3.7)*.5)+Math.sin(t*.9)*.25,tx=a*Math.sin(t*1.7)*.9,ty=a*(Math.sin(t*2.9)*.9)+Math.sin(t*1.1)*.4;
  elH.style.transform='translate('+tx.toFixed(2)+'px,'+ty.toFixed(2)+'px) rotate('+rot.toFixed(2)+'deg)';
  elJ.style.transform='translateY('+jaw.toFixed(2)+'px) scaleY('+(1+jaw*.025).toFixed(3)+')';
  if(on||a>.01)requestAnimationFrame(animStep);else{animOn=false;elH.style.transform='';elJ.style.transform='';}
}
var vAud=null;
function stopVoice(){if(vAud){try{vAud.onended=null;vAud.pause();}catch(e){}vAud=null;}}
function playVoice(L){      // the line has a voice file: she moves for its real length, and the next line comes right after it (no pause)
  stopVoice();var a=new Audio('assets/audio/komsinica/'+L.v+'.mp3?v=1'),my=li;a.volume=.95;vAud=a;
  a.addEventListener('loadedmetadata',function(){if(vAud===a&&L.who&&isFinite(a.duration))speak(a.duration*1000+150);});
  a.onended=function(){if(vAud===a&&st==='talk'&&li===my){vAud=null;next();}};
  var pr=a.play();if(pr&&pr.catch)pr.catch(function(){});
}
function showLine(){
  var L=lines[li];stopVoice();if(L.who)speak(Math.max(1200,L.text.length*62));else speakUntil=0;if(L.v)playVoice(L);box.querySelector('.nb-who').textContent=L.who||'';box.querySelector('.nb-who').style.display=L.who?'':'none';
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
  box.style.display='none';speakUntil=0;stopVoice();
  if(afterTalk){var f=afterTalk;afterTalk=null;st='done';f();return;}      // she stays at the window (the callback decides)
  elO.style.opacity='0';st='done';
  try{localStorage.setItem(KEY,'1');}catch(e){}
  setTimeout(function(){try{if(window.CooksterTutorial)CooksterTutorial.start(true);}catch(e){}},900);      // Savka's book: the instructions begin
}
// the second visit: when the salad is ready, the neighbour comes back for it, pays and leaves
var delivered={},visiting=false,asked={};
function takeFood(re){      // the vessel with the food is emptied (she takes it)
  try{items.forEach(function(v){try{if(!isContainerItem(v))return;var ks=[];try{ks=Object.keys(CooksterPan.read(v).ingredients||{});}catch(e){}try{ks=ks.concat(Object.keys(CooksterContainer.read(v).items||{}));}catch(e){}
    if(ks.some(function(k){return re.test(k);})){clearVesselAfterPour(v);renderCookwareContents(v);}}catch(e){}});}catch(e){}
}
var handover=null;
function holdsFood(re){try{var h=holding;if(!h||!isContainerItem(h))return false;var ks=[];try{ks=Object.keys(CooksterPan.read(h).ingredients||{});}catch(e){}try{ks=ks.concat(Object.keys(CooksterContainer.read(h).items||{}));}catch(e){}return ks.some(function(k){return re.test(k);});}catch(e){return false;}}
function sillScreen(){var sc=document.getElementById('scene');if(!sc)return null;var R=sc.getBoundingClientRect(),k=R.width/1672;return {l:R.left+SILL.l*k,t:R.top+SILL.t*k,r:R.left+SILL.r*k,b:R.top+SILL.b*k};}
// the player puts the vessel with the food on the sill (a click on the sill with it in the hand): she takes it
function onHandoverClick(e){
  if(!handover)return;
  var z=document.getElementById('scene');if(!z)return;
  var R=z.getBoundingClientRect(),k=R.width/1672,x=(e.clientX-R.left)/k,y=(e.clientY-R.top)/k;
  if(x<0||x>176||y<0||y>440)return;      // outside the window: the game does what it does
  e.stopImmediatePropagation();e.preventDefault();
  if(e.type!=='pointerdown')return;
  var S=sillScreen();
  if(holdsFood(handover.O.match)&&x>=SILL.l&&x<=SILL.r&&y>=SILL.t&&y<=SILL.b){
    var v=holding,O=handover.O,id=handover.id;handover=null;
    try{holding=null;hidePlacementGhost();hideOriginGhost();clearPourTarget();}catch(er){}
    var pan=false;try{pan=isHeatableCookwareItem(v)&&/tiganj|serpa/.test(v.dataset.itemId||'');}catch(er){}
    try{v.dataset.surfaceZone='table';setPose(v,SILL.cx,SILL.by,.7);v.style.visibility='';v.classList.remove('held');}catch(er){}
    sub('',1);
    setTimeout(function(){      // she takes the food (and the bowl); the pan stays: only its food goes
      try{if(pan){clearVesselAfterPour(v);renderCookwareContents(v);setPose(v,740,640,1);}else{removeItem(v);}}catch(er){}
      try{updateHover();}catch(er){}
      talk(O.lines2,function(){
        setTimeout(function(){elO.style.opacity='0';},300);
        leaveMoney(O,id);      // she leaves the banknotes on the sill: the player takes them (click)
      });
    },1400);
  }else{
    sub('Podigni '+handover.O.what+' i stavi je na dasku prozora (klik na dasku).',3500);
  }
}
['pointerdown','click','pointerup','mousedown'].forEach(function(t){window.addEventListener(t,onHandoverClick,true);});
// banknotes and coins on the sill (a picture made in ChatGPT, assets/effects/novac.webp): a click takes them, with the sound of coins
var NOTE_SRC='assets/effects/novac.webp?v=1';
function coinSound(){
  try{
    var AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;var ac=window.__nbAc||(window.__nbAc=new AC());if(ac.state==='suspended')ac.resume();
    [0,.13,.3].forEach(function(dt,i){
      var t=ac.currentTime+dt;[2400+i*260,3600+i*390].forEach(function(f,j){
        var o=ac.createOscillator(),g=ac.createGain();o.type='sine';o.frequency.value=f;
        g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(j?.07:.14,t+.004);g.gain.exponentialRampToValueAtTime(.0005,t+.42);
        o.connect(g);g.connect(ac.destination);o.start(t);o.stop(t+.45);
      });
    });
  }catch(e){}
}
function leaveMoney(O,id){
  var sc=document.getElementById('scene');if(!sc)return;
  var im=document.createElement('img');im.id='nbNotes';im.src=NOTE_SRC;im.draggable=false;im.title='Novac — klik da uzmeš';
  im.style.cssText='position:absolute;left:'+(SILL.cx-43)+'px;top:'+(SILL.by-66)+'px;width:86px;z-index:45;cursor:none;opacity:0;transition:opacity .5s ease,transform .25s ease;filter:drop-shadow(1px 3px 2px rgba(20,8,0,.5))';
  sc.appendChild(im);requestAnimationFrame(function(){im.style.opacity='1';});
  sub('Uzmi novac sa daske prozora (klik).',6000);
  var took=false;
  function take(e){
    if(took)return;e.stopImmediatePropagation();e.preventDefault();if(e.type!=='pointerdown')return;
    took=true;coinSound();im.style.transform='translateY(-14px) scale(1.15)';im.style.opacity='0';
    setTimeout(function(){if(im.parentNode)im.parentNode.removeChild(im);},400);
    try{setMoney(money+O.pay);showToast('Dobio si '+O.pay+' dinara.');}catch(er){}
    delivered[id]=true;visiting=false;try{localStorage.setItem(O.key,'1');}catch(er){}
  }
  ['pointerdown','click','pointerup','mousedown'].forEach(function(t){im.addEventListener(t,take,true);});
  im.style.pointerEvents='auto';
}
function expectOrder(id){
  var O=ORDERS[id];if(!O||asked[id]||delivered[id])return;asked[id]=true;
  try{if(localStorage.getItem(O.key)==='1'){delivered[id]=true;return;}}catch(e){}
  setTimeout(function(){
    build();visiting=true;st='knock';elK.style.opacity='1';knockSound();sub('Komšinica se vratila.',3500);
    setTimeout(function(){if(st==='knock')sub('(Klikni na prozor da ga otvoriš.)',4500);},3800);
    clearInterval(knockT);knockT=setInterval(function(){if(st==='knock')knockSound();else clearInterval(knockT);},14000);
    var w=setInterval(function(){if(st==='knock'&&windowOpen()){clearInterval(w);talk(O.lines1,function(){
      st='handover';handover={O:O,id:id};sub('Uzmi '+O.what+' (klik) i stavi je na dasku prozora (klik na dasku).',6000);
    });}},500);
  },4000);
}
function expectSalad(){expectOrder('salad');}
function tick(){
  if(st==='idle'){
    if(done())return;
    if(forced){forced=false;setTimeout(knock,3000);st='wait';return;}
    var p=prog();if(p>=THRESHOLD&&winClean())knock();      // both: over 60% clean AND the whole window clean
  }else if(st==='knock'&&windowOpen()&&!visiting){talk();}
}
function init(){
  build();
  var p=prog();if(p>=0&&p<.02){try{localStorage.removeItem(KEY);}catch(e){}}      // a fresh dirty kitchen = a new game: the meeting happens again
  setInterval(tick,500);
}
// the kitchen is declared clean at 80%: if the cleaning jumped over the threshold between two checks, it knocks now
window.addEventListener('cookster:kitchen-clean',function(){if(st==='idle'&&!done())setTimeout(function(){if(st==='idle'&&!done()&&winClean())knock();},1800);});
window.CooksterNeighbor={speak:speak,knock:knock,state:function(){return st;},lines:LINES,expectSalad:expectSalad,expectOrder:expectOrder,delivered:function(id){return !!delivered[id||'salad'];}};
if(document.readyState==='complete')setTimeout(init,600);else window.addEventListener('load',function(){setTimeout(init,600);});
})();
