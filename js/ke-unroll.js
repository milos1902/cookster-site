/* The window "Kuhinjski elementi" (the parchment, js/ke-pergament.js): when the dishes icon is clicked the page is there AT ONCE, in the middle of the screen, and unrolls on the spot in 0.3 s:
   it opens from the middle up and down, and two little rolls (the ends of the scroll) run to the top and the bottom edge. The screen does NOT darken first: only when the page has opened, the dark
   background (and its blur) comes in, as it was before. GSAP does the movement; mo.js (assets/vendor/mo.umd.js, MIT) adds a few sparks of dust at the corners where the rolls arrive (only if loaded).
   Only the equipment window, "Piće" stays as it was. ?bezanimacije switches it off. */
(function(){
if(/[?&]bezanimacije/.test(location.search))return;
var DUR=.3,DARK=.22,was=false,fx=null;
function target(){return document.body.classList.contains('ke-pg-on')?document.getElementById('kePg'):null;}
function layer(){if(fx)return fx;fx=document.createElement('div');fx.id='keFx';fx.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:65001';document.body.appendChild(fx);return fx;}
function rod(){var d=document.createElement('div');d.style.cssText='position:fixed;height:13px;border-radius:7px;background:linear-gradient(#e2bb7c,#9a6a35 55%,#6e451d);box-shadow:0 3px 7px rgba(30,14,4,.55),inset 0 1px 0 rgba(255,238,200,.6);will-change:transform';layer().appendChild(d);return d;}
function dust(x,y,delay){
  if(!window.mojs)return;
  try{new mojs.Burst({parent:layer(),left:0,top:0,x:x,y:y,radius:{6:30},count:6,angle:{0:40},degree:360,timeline:{delay:delay||0},
    children:{shape:'circle',fill:['#f3e3bd','#fff6dc','#e2bb7c'],radius:{4:0},duration:300,easing:'cubic.out'}}).replay();}catch(e){}
}
function unroll(sc){
  var el=target();if(!el)return;
  el.style.transform='';var r=el.getBoundingClientRect();if(!r.width)return;
  // the dark background comes only after the page has opened (a short delay, then it fades in; before that the scene is clear)
  if(sc.animate)sc.animate([{backgroundColor:'rgba(22,12,7,0)',backdropFilter:'blur(0px)',webkitBackdropFilter:'blur(0px)'}],      // one keyframe: the end is the real look of the scene (what the game css gives it)
    {duration:DARK*1000,delay:DUR*1000,easing:'linear',fill:'backwards',composite:'replace'});
  var cy=r.top+r.height/2,done=function(){el.style.clipPath='';el.style.transform='';el.style.transformOrigin='';};
  el.style.transformOrigin='50% 50%';
  if(window.gsap){
    var top=rod(),bot=rod();[top,bot].forEach(function(d){d.style.left=r.left-4+'px';d.style.width=r.width+8+'px';d.style.top=cy-6.5+'px';});
    var o={p:0};gsap.killTweensOf(o);
    var set=function(){var p=o.p,h=(1-p)*50;
      el.style.clipPath='inset('+h+'% 0% '+h+'% 0%)';el.style.transform='scale('+(.96+.04*p)+')';
      top.style.transform='translateY('+(-(r.height/2)*p)+'px)';bot.style.transform='translateY('+((r.height/2)*p)+'px)';};
    set();
    gsap.to(o,{p:1,duration:DUR,ease:'power2.out',onUpdate:set,onComplete:function(){
      done();dust(r.left+8,r.top,0);dust(r.right-8,r.top,40);dust(r.left+8,r.bottom,60);dust(r.right-8,r.bottom,100);
      gsap.to([top,bot],{opacity:0,duration:.12,onComplete:function(){top.remove();bot.remove();}});}});
  }else if(el.animate){
    var a=el.animate([{clipPath:'inset(50% 0% 50% 0%)',transform:'scale(.96)'},{clipPath:'inset(0% 0% 0% 0%)',transform:'scale(1)'}],{duration:DUR*1000,easing:'cubic-bezier(.2,.8,.2,1)'});a.onfinish=done;
  }
}
function init(){
  var sc=document.getElementById('kitchenElementsScene');if(!sc)return;
  new MutationObserver(function(){var o=sc.classList.contains('open');if(o&&!was)unroll(sc);was=o;}).observe(sc,{attributes:true,attributeFilter:['class']});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
