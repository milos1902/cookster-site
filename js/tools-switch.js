/* Master switch "Alati": one small button that shows or hides ALL tools of the game (the buttons and the panels of the tools), so the game
   can be played without them and the tools can be turned on again at any moment. It does not delete anything and it does not change the game:
   it only hides the tool buttons (CSS) and closes the tool panels. The choice is kept in this browser (cookster.tools-on).
   Later, when the game is finished, the tool files can be left out of index.html and this switch can be removed too. */
(function(){
'use strict';
if(window.__toolsSwitch)return;window.__toolsSwitch=1;
var KEY='cookster.tools-on',root=document.documentElement;
// the buttons and panels of the tools: by id, by class, or by the text of the button (some tool buttons have no id)
var IDS={ovBtn:1,ovPanel:1,nbBtn:1,nbPanel:1,tavernCalOpen:1,tiBtn:1,wsBtn:1,signToolBtn2:1,tcPanel:1,dlBtn:1,dlPanel:1};
var CLASSES=['tc-reset'];
var TEXTS=/^(тулови|✂ Animacije gostiju|👥 Pozovi društvo)$/;
var PANELS=['nbPanel','ovPanel','dlPanel'];                     // panels that are closed when the tools are turned off
function on(){try{return localStorage.getItem(KEY)!=='0';}catch(e){return true;}}
function tag(node){
  if(!node||node.nodeType!==1)return;
  var list=[node].concat([].slice.call(node.querySelectorAll?node.querySelectorAll('button,div[aria-label],a'):[]));
  list.forEach(function(e){
    if(e.id==='toolsSwitchBtn')return;
    var t=(e.textContent||'').trim();
    if(IDS[e.id]||(e.classList&&CLASSES.some(function(c){return e.classList.contains(c);}))||(e.tagName==='BUTTON'&&t.length<30&&TEXTS.test(t))||(e.getAttribute&&e.getAttribute('aria-label')==='Алати'))e.setAttribute('data-cookster-tool','1');
  });
}
var css=document.createElement('style');
css.textContent='html.tools-off [data-cookster-tool]{display:none!important}'+
 '#toolsSwitchBtn{position:fixed;left:925px;top:10px;z-index:2147483600;border:2px solid #351b0d;border-radius:12px;background:#e8c27a;color:#351b0d;font:700 12px/1 system-ui,sans-serif;padding:6px 10px;cursor:pointer;opacity:.9}'+
 '#toolsSwitchBtn:hover{opacity:1}#toolsSwitchBtn.off{background:#cfc6b4;color:#6b5a44}';
document.head.appendChild(css);
var btn=document.createElement('button');btn.id='toolsSwitchBtn';btn.type='button';btn.setAttribute('data-tool-ui','1');
function apply(){
  var v=on();root.classList.toggle('tools-off',!v);btn.classList.toggle('off',!v);
  btn.textContent='Alati: '+(v?'UKLJUČENI':'ISKLJUČENI');btn.title=v?'Klik: sakrij sve alate':'Klik: prikaži sve alate';
  if(!v){
    PANELS.forEach(function(id){var p=document.getElementById(id);if(p)p.style.display='none';});
    try{if(typeof closeNacveTool==='function')closeNacveTool();}catch(e){}
    try{if(window.CooksterNacveBounds&&CooksterNacveBounds.isOpen&&CooksterNacveBounds.isOpen()){var b=document.getElementById('nbBtn');if(b)b.click();}}catch(e){}
  }
}
btn.addEventListener('click',function(e){e.stopPropagation();try{localStorage.setItem(KEY,on()?'0':'1');}catch(x){}apply();});
['pointerdown','pointerup','contextmenu','wheel'].forEach(function(n){btn.addEventListener(n,function(e){e.stopPropagation();},{passive:true});});
document.body.appendChild(btn);
tag(document.body);
new MutationObserver(function(ms){ms.forEach(function(m){m.addedNodes.forEach(tag);});}).observe(document.body,{childList:true,subtree:true});
apply();
window.CooksterToolsSwitch={on:on,set:function(v){try{localStorage.setItem(KEY,v?'1':'0');}catch(e){}apply();}};
})();
