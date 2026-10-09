/* Cookster - button "Pozovi društvo" (in the tavern): the fixed company of four sits down at its table at once (the table is cleaned first), so the film of the table can be seen. */
(function(){
'use strict';
var T=window.CooksterTavern;if(!T)return;
var btn=document.createElement('button');
btn.textContent='👥 Pozovi društvo';btn.setAttribute('data-tool-ui','1');
btn.style.cssText='position:fixed;left:190px;bottom:56px;z-index:2147483000;padding:8px 12px;border-radius:9px;border:2px solid #351b0d;background:#e8c27a;color:#351b0d;font:700 13px system-ui,sans-serif;cursor:pointer;display:none';
document.body.appendChild(btn);
setInterval(function(){btn.style.display=T.isOpen?'block':'none'},400);
function note(t){var i=document.querySelector('.tc-info');if(i){i.textContent=t;setTimeout(function(){},0)}}
btn.onclick=function(){
  var C=window.CooksterTavernClean,t=T.companyTable?T.companyTable():0;
  var go=function(){if(T.companyOk()){T.spawnCompany();note('Društvo ulazi...')}else note('Sto je zauzet ili društvo već sedi.')};
  if(T.companyOk()){go();return}
  var cl=C&&C.cleaned?C.cleaned():null;
  if(cl&&!cl[t]&&C.cleanTable){C.cleanTable(t);note('Čistim sto...');var n=0,w=setInterval(function(){if(T.companyOk()||++n>25){clearInterval(w);go()}},400)}
  else go();
};
})();
