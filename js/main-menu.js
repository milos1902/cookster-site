/* Start screen: the picture of the menu (assets/menu/start.webp, 1672x941) with invisible click zones over its four wooden buttons.
   Nova igra -> the intro film (assets/intro/uvod.mp4, with "Preskoči") -> the game. Nastavi igru -> the game (grey when there is no save).
   Podešavanja -> a small panel. Izlaz -> tries to close the tab, otherwise a thank-you screen.
   Hovering a button gives a very short "tick" (made with Web Audio, no file) and a glow. ?nomenu in the address skips the whole start screen. */
(function(){
'use strict';
if(window.CooksterMenu)return;
if(/[?&]nomenu(=|&|$)/.test(location.search))return;
var W=1672,H=941,SAVE_KEY='cookster.save.v1',SEEN_KEY='cookster.intro-seen.v1',TICK_KEY='cookster.menu-tick.v1';
// the buttons of the picture (pixels of the 1672x941 picture)
var BTN=[
  {id:'new',  label:'Nova igra',    x:623,y:370,w:423,h:92},
  {id:'cont', label:'Nastavi igru', x:623,y:478,w:423,h:92},
  {id:'set',  label:'Podešavanja',  x:623,y:587,w:423,h:92},
  {id:'exit', label:'Izlaz',        x:623,y:696,w:423,h:92}
];
function pc(v,t){return (v/t*100).toFixed(3)+'%';}
function hasSave(){try{return !!localStorage.getItem(SAVE_KEY);}catch(e){return false;}}
function tickOn(){try{return localStorage.getItem(TICK_KEY)!=='0';}catch(e){return true;}}

// ---------- the tick: a few milliseconds of filtered noise and a tiny sine ----------
var ac=null;
function ctx(){
  if(!ac){try{var AC=window.AudioContext||window.webkitAudioContext;ac=AC?new AC():null;}catch(e){ac=null;}}
  if(ac&&ac.state==='suspended')ac.resume().catch(function(){});
  return ac;
}
function tick(strong){
  if(!tickOn())return;var a=ctx();if(!a||a.state!=='running')return;
  var t=a.currentTime,len=Math.floor(a.sampleRate*.018),buf=a.createBuffer(1,len,a.sampleRate),d=buf.getChannelData(0);
  for(var i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,3);
  var n=a.createBufferSource();n.buffer=buf;
  var hp=a.createBiquadFilter();hp.type='bandpass';hp.frequency.value=strong?2200:3200;hp.Q.value=1.4;
  var g=a.createGain();g.gain.setValueAtTime(strong?.55:.32,t);g.gain.exponentialRampToValueAtTime(.001,t+.03);
  n.connect(hp);hp.connect(g);g.connect(a.destination);n.start(t);
  var o=a.createOscillator(),og=a.createGain();o.type='sine';o.frequency.setValueAtTime(strong?900:1500,t);o.frequency.exponentialRampToValueAtTime(strong?500:900,t+.02);
  og.gain.setValueAtTime(strong?.12:.07,t);og.gain.exponentialRampToValueAtTime(.001,t+.025);o.connect(og);og.connect(a.destination);o.start(t);o.stop(t+.03);
}

// ---------- the screen ----------
var css=document.createElement('style');
css.textContent=
 '#mainMenu{position:fixed;inset:0;z-index:2147483640;background:#000;display:flex;align-items:center;justify-content:center;opacity:1;transition:opacity .7s ease;user-select:none;-webkit-user-select:none}'+
 '#mainMenu.out{opacity:0;pointer-events:none}'+
 '#mainMenu .mm-stage{position:relative;width:min(100vw,calc(100vh*'+W+'/'+H+'));aspect-ratio:'+W+'/'+H+';overflow:hidden}'+
 '#mainMenu .mm-bg{position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none;object-fit:fill}'+
 '#mainMenu .mm-btn{position:absolute;display:block;border:0;border-radius:2.2%/12%;background:rgba(255,214,140,0);cursor:pointer;padding:0;outline:none;'+
   'transition:background .15s,box-shadow .15s,transform .12s}'+
 '#mainMenu .mm-btn:hover,#mainMenu .mm-btn:focus-visible{background:rgba(255,214,140,.14);box-shadow:0 0 22px 5px rgba(255,196,102,.6),inset 0 0 20px rgba(255,226,160,.4);transform:translateY(-2px)}'+
 '#mainMenu .mm-btn:active{transform:translateY(1px);background:rgba(60,28,6,.22);box-shadow:inset 0 0 18px rgba(0,0,0,.4)}'+
 '#mainMenu .mm-btn.off{cursor:not-allowed;background:rgba(20,10,4,.5);box-shadow:none;transform:none}'+
 '#mainMenu .mm-btn.off:hover{background:rgba(20,10,4,.5);box-shadow:none;transform:none}'+
 '#mainMenu .mm-ver{position:absolute;right:1.2%;bottom:1.6%;color:rgba(255,238,200,.55);font:600 clamp(10px,1.1vw,14px) system-ui,sans-serif;pointer-events:none}'+
 '#mainMenu .mm-panel{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:min(88%,420px);padding:22px 24px;border-radius:14px;background:linear-gradient(#5a3a22,#3b2414);border:3px solid #1f1208;box-shadow:0 8px 30px rgba(0,0,0,.6),inset 0 0 0 2px rgba(255,214,140,.25);color:#ffeccb;font:600 clamp(14px,1.8vw,18px) system-ui,sans-serif;display:none}'+
 '#mainMenu .mm-panel h3{margin:0 0 14px;font:700 clamp(18px,2.4vw,26px) Georgia,serif;text-align:center;color:#ffe0a6}'+
 '#mainMenu .mm-panel .row{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:10px 0}'+
 '#mainMenu .mm-panel button{cursor:pointer;border:2px solid #1f1208;border-radius:9px;background:#e8c27a;color:#2d1a0a;font:700 14px system-ui,sans-serif;padding:7px 14px}'+
 '#mainMenu .mm-panel button:hover{background:#f3d38f}'+
 '#mainMenu .mm-bye{position:absolute;inset:0;background:#000;display:none;flex-direction:column;align-items:center;justify-content:center;gap:18px;color:#ffe0a6;font:700 clamp(20px,3vw,34px) Georgia,serif;text-align:center}'+
 '#mainMenu .mm-bye button{cursor:pointer;border:2px solid #ffe0a6;border-radius:10px;background:transparent;color:#ffe0a6;font:600 16px system-ui,sans-serif;padding:8px 20px}'+
 '#mainMenu .mm-dark{position:absolute;inset:0;background:#000;opacity:0;pointer-events:none;transition:opacity .7s ease}'+
 '#mainMenu .mm-intro{position:absolute;inset:0;background:#000;display:none;opacity:0;transition:opacity 1.1s ease}'+
 '#mainMenu .mm-intro video{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;background:#000}'+
 '#mainMenu .mm-skip{position:absolute;right:2%;bottom:3%;z-index:2;padding:9px 20px;border-radius:10px;border:2px solid rgba(255,230,180,.8);background:rgba(0,0,0,.5);color:#ffeccb;font:600 clamp(13px,1.4vw,17px) system-ui,sans-serif;cursor:pointer;opacity:0;transition:opacity .3s}'+
 '#mainMenu .mm-skip.show{opacity:.9}#mainMenu .mm-skip:hover{opacity:1;background:rgba(0,0,0,.65)}';
document.head.appendChild(css);

var root=document.createElement('div');root.id='mainMenu';root.setAttribute('data-tool-ui','1');
var stage=document.createElement('div');stage.className='mm-stage';
var bg=document.createElement('img');bg.className='mm-bg';bg.alt='Cookster';bg.src='assets/menu/start.webp';bg.draggable=false;stage.appendChild(bg);
var btns={};
BTN.forEach(function(b){
  var e=document.createElement('button');e.type='button';e.className='mm-btn';e.setAttribute('aria-label',b.label);
  e.style.left=pc(b.x,W);e.style.top=pc(b.y,H);e.style.width=pc(b.w,W);e.style.height=pc(b.h,H);
  e.addEventListener('pointerenter',function(){if(!e.classList.contains('off'))tick(false);});
  e.addEventListener('focus',function(){if(!e.classList.contains('off'))tick(false);});
  e.addEventListener('click',function(){ctx();if(e.classList.contains('off'))return;tick(true);act(b.id);});
  stage.appendChild(e);btns[b.id]=e;
});
var ver=document.createElement('div');ver.className='mm-ver';ver.textContent='v0.1';stage.appendChild(ver);

var panel=document.createElement('div');panel.className='mm-panel';
panel.innerHTML='<h3>Podešavanja</h3>'+
 '<div class="row"><span>Ceo ekran</span><button type="button" data-a="fs">Uključi / isključi</button></div>'+
 '<div class="row"><span>Zvuk dugmadi (klik)</span><button type="button" data-a="tick"></button></div>'+
 '<div class="row"><span>Uvod</span><button type="button" data-a="replay">Ponovi uvod</button></div>'+
 '<div class="row" style="justify-content:center;margin-top:16px"><button type="button" data-a="back">Nazad</button></div>';
stage.appendChild(panel);

var bye=document.createElement('div');bye.className='mm-bye';
bye.innerHTML='<div>Hvala što ste igrali.</div><button type="button">Nazad na meni</button>';
bye.querySelector('button').addEventListener('click',function(){bye.style.display='none';});
stage.appendChild(bye);

var intro=document.createElement('div');intro.className='mm-intro';
var video=document.createElement('video');video.src='assets/intro/uvod.mp4';video.preload='auto';video.playsInline=true;video.setAttribute('playsinline','');
intro.appendChild(video);
var skip=document.createElement('button');skip.type='button';skip.className='mm-skip';skip.textContent='Preskoči ▸▸';var dark=document.createElement('div');dark.className='mm-dark';
stage.appendChild(dark);stage.appendChild(intro);stage.appendChild(skip);
root.appendChild(stage);

function refresh(){
  var s=hasSave();btns.cont.classList.toggle('off',!s);btns.cont.title=s?'':'Nema sačuvane igre';
  panel.querySelector('[data-a="tick"]').textContent=tickOn()?'Uključen':'Isključen';
}
function setTick(on){try{localStorage.setItem(TICK_KEY,on?'1':'0');}catch(e){}refresh();}

function closeMenu(){
  root.classList.add('out');
  document.removeEventListener('keydown',keyBlock,true);document.removeEventListener('keyup',keyBlock,true);
  setTimeout(function(){if(root.parentNode)root.parentNode.removeChild(root);},800);
  try{window.dispatchEvent(new CustomEvent('cookster:menu-closed'));}catch(e){}
}
var introActive=false,introTimers=[];
function later(f,ms){introTimers.push(setTimeout(f,ms));}
function endIntro(){
  if(!introActive)return;introActive=false;
  introTimers.forEach(clearTimeout);introTimers=[];
  try{localStorage.setItem(SEEN_KEY,'1');}catch(e){}
  skip.classList.remove('show');
  var done=function(){try{video.pause();}catch(e){}closeMenu();};
  // the sound fades out and the picture goes to black, then the game lights up
  var v0=video.volume,k=0,fd=setInterval(function(){k++;try{video.volume=Math.max(0,v0*(1-k/10));}catch(e){}if(k>=10)clearInterval(fd);},60);
  intro.style.transition='opacity .6s ease';intro.style.opacity='0';later(done,700);
}
function startIntro(){
  if(introActive)return;introActive=true;
  try{if(window.CooksterKitchenClean)CooksterKitchenClean.restart();}catch(e){}      // a new game: the kitchen is dirty again
  panel.style.display='none';bye.style.display='none';
  skip.classList.add('show');                                   // "Preskoči" stays in the corner the whole time
  dark.style.opacity='1';                                       // 1) the screen goes dark (0.7 s)
  later(function(){                                             // 2) a second of black, then the film lights up from the dark
    intro.style.transition='opacity 1.1s ease';intro.style.display='block';intro.style.opacity='0';
    try{video.currentTime=0;video.volume=1;}catch(e){}
    var p=video.play();if(p&&p.catch)p.catch(function(){endIntro();});
    requestAnimationFrame(function(){requestAnimationFrame(function(){intro.style.opacity='1';});});
  },1500);
}
video.addEventListener('ended',endIntro);
video.addEventListener('error',function(){if(introActive)endIntro();});
skip.addEventListener('click',endIntro);

function act(id){
  if(id==='new')startIntro();
  else if(id==='cont')closeMenu();
  else if(id==='set'){panel.style.display=panel.style.display==='block'?'none':'block';refresh();}
  else if(id==='exit'){try{window.close();}catch(e){}setTimeout(function(){bye.style.display='flex';},120);}
}
panel.addEventListener('click',function(e){
  var a=e.target&&e.target.getAttribute&&e.target.getAttribute('data-a');if(!a)return;tick(true);
  if(a==='fs'){try{if(document.fullscreenElement)document.exitFullscreen();else document.documentElement.requestFullscreen();}catch(x){}}
  else if(a==='tick')setTick(!tickOn());
  else if(a==='replay'){startIntro();}
  else if(a==='back')panel.style.display='none';
});

// while the start screen is open the keys of the game (E, C, ...) must not do anything behind it
function keyBlock(e){
  if(introActive&&(e.key==='Escape'||e.key==='Enter'||e.key===' ')&&e.type==='keydown'){endIntro();}
  e.stopPropagation();
}
document.addEventListener('keydown',keyBlock,true);document.addEventListener('keyup',keyBlock,true);
['pointerdown','keydown'].forEach(function(n){window.addEventListener(n,function(){ctx();},{capture:true,passive:true});});

refresh();
document.body.appendChild(root);
window.CooksterMenu={close:closeMenu,startIntro:startIntro};
})();
