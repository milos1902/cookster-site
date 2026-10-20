/* Cookster: a swallow lands on the board under the open window, sits there three seconds and flies away (the clip is made in Higgsfield; only the bird is cut out of it, with the shadow: assets/effects/lasta/*.webm).
   It comes only when it is a sunny morning (06:00-12:00, weather "sunce"), the window is open and nothing else is going on at the window; then a few seconds after the conditions come true, then about every 25-60 s. */
(function(){
if(window.CooksterSwallow)return;
var CLIPS=['assets/effects/lasta/lasta_1.webm'],X=0,Y=165,W=152,H=200,v=null,next=0,playing=false,last=0;      // the place of the clip in the scene (the picture is 304x400 = 152x200 scene px)
function ok(){
  try{
    var m=CooksterDay.minute()%1440;if(m<360||m>=720)return false;                  // the morning (06:00-12:00)
    if(!(window.CooksterWeather&&CooksterWeather.kind()==='sunce'))return false;      // sunny
    if(!(window.CooksterWindow&&CooksterWindow.level()>.95))return false;            // the window is open
    if(window.CooksterTavern&&CooksterTavern.isOpen)return false;
    return true;
  }catch(e){return false;}
}
function build(){var sc=document.getElementById('scene');if(!sc)return false;if(v&&v.parentNode===sc)return true;
  v=document.createElement('video');v.muted=true;v.defaultMuted=true;v.playsInline=true;v.preload='auto';v.setAttribute('aria-hidden','true');
  v.style.cssText='position:absolute;left:'+X+'px;top:'+Y+'px;width:'+W+'px;height:'+H+'px;pointer-events:none;z-index:3;opacity:0;transition:opacity .25s';
  v.addEventListener('ended',function(){playing=false;v.style.opacity='0';schedule();});
  sc.appendChild(v);return true;}
function schedule(){next=performance.now()+25000+Math.random()*35000;}
function start(){if(!build()||playing)return;v.src=CLIPS[Math.floor(Math.random()*CLIPS.length)];v.currentTime=0;playing=true;v.style.opacity='1';var p=v.play();if(p&&p.catch)p.catch(function(){playing=false;v.style.opacity='0';schedule();});}
var wasOk=false;
setInterval(function(){
  var o=ok();if(o&&!wasOk)next=performance.now()+6000+Math.random()*8000;wasOk=o;      // as soon as it is a sunny morning with the window open the bird comes in a few seconds
  if(!next)schedule();
  if(playing){if(!ok()){try{v.pause();}catch(e){}v.style.opacity='0';playing=false;schedule();}return;}      // the weather / the window / the time changed: the bird goes away
  if(ok()&&performance.now()>=next)start();
},700);
window.CooksterSwallow={play:function(){if(ok())start();return ok();},playing:function(){return playing;}};
})();
