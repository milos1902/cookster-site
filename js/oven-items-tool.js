/* Tool for the things inside the open oven (a pot, a pan, a baking tray): per kind of item the owner sets the height (depth) in the oven,
   the size, the lean left-right, the pitch up-down and the darkness. The values are saved in this browser (cookster.oven-items.v1)
   and "Kopiraj JSON" gives them to be built into the game. The work is done by window.CooksterOvenItems (js/game.js). */
(function(){
'use strict';
if(window.__ovenItemsTool)return;window.__ovenItemsTool=1;
var API=function(){return window.CooksterOvenItems;};
var ROWS=[['by','Visina (dubina u rerni)',470,548,1],['k','Veličina',.5,1.6,.01],['angle','Nagib levo-desno',-35,35,.5],['tilt','Nagib gore-dole',-60,60,1],['dark','Osvetljenje: tamnije →',0,1,.01]];
var css=document.createElement('style');
css.textContent='#ovBtn{position:fixed;right:12px;bottom:92px;z-index:2147483500;border:2px solid #351b0d;border-radius:9px;background:#e8c27a;color:#351b0d;font:700 13px/1 system-ui,sans-serif;padding:9px 12px;cursor:pointer}'+
 '#ovPanel{position:fixed;left:12px;top:96px;z-index:2147483600;width:310px;background:rgba(36,22,10,.94);border:2px solid #7a5428;border-radius:10px;color:#f3e3c2;font:13px/1.35 system-ui,sans-serif;padding:10px;display:none}'+
 '#ovPanel label{display:block;margin:6px 0 0}#ovPanel input[type=range]{width:100%}#ovPanel select{width:100%;margin:4px 0}#ovPanel output{float:right;color:#ffd98a}'+
 '#ovPanel button{border:1px solid #351b0d;border-radius:7px;background:#e8c27a;color:#351b0d;font:700 12px/1 system-ui,sans-serif;padding:7px 9px;margin:6px 4px 0 0;cursor:pointer}#ovPanel small{display:block;margin-top:6px;opacity:.85}';
document.head.appendChild(css);
var btn=document.createElement('button');btn.id='ovBtn';btn.type='button';btn.textContent='🔥 Predmeti u rerni';btn.setAttribute('data-tool-ui','1');
var pn=document.createElement('div');pn.id='ovPanel';pn.setAttribute('data-tool-ui','1');
var html='<b>Predmeti u rerni</b><small>Izaberi vrstu predmeta i menjaj ga: važi za sve te predmete u rerni.</small><select id="ovKind"></select>';
ROWS.forEach(function(r){html+='<label>'+r[1]+' <output id="ov_'+r[0]+'_o"></output><input id="ov_'+r[0]+'" type="range" min="'+r[2]+'" max="'+r[3]+'" step="'+r[4]+'"></label>';});
html+='<label>Položaj levo-desno <output id="ov_x_o"></output><input id="ov_x" type="range" min="1432" max="1574" step="1"></label><small>Svaki put kad ubaciš predmet u rernu, ide na isto mesto i u istoj veličini (ono što si ovde podesio).</small>';
html+='<button type="button" data-a="test">Stavi probni predmet u rernu</button><button type="button" data-a="reset">Resetuj ovaj</button><button type="button" data-a="copy">Kopiraj JSON</button><button type="button" data-a="close">Zatvori</button><small id="ovMsg"></small>';
pn.innerHTML=html;
document.body.appendChild(btn);document.body.appendChild(pn);
var sel=pn.querySelector('#ovKind');
function label(id){try{var d=kitchenEquipmentDef(id);return (d&&d.label)||id;}catch(e){return id;}}
function fill(){sel.innerHTML='';API().kinds.forEach(function(id){var o=document.createElement('option');o.value=id;o.textContent=label(id);sel.appendChild(o);});}
function msg(t){pn.querySelector('#ovMsg').textContent=t||'';}
function showX(){var x=API().xOf(sel.value),el=pn.querySelector('#ov_x');el.disabled=false;el.value=x;pn.querySelector('#ov_x_o').textContent=x;}
function show(){showX();var c=API().cfg(sel.value);ROWS.forEach(function(r){var el=pn.querySelector('#ov_'+r[0]);el.value=c[r[0]];pn.querySelector('#ov_'+r[0]+'_o').textContent=(+c[r[0]]).toFixed(r[4]<1?2:0);});}
ROWS.forEach(function(r){pn.querySelector('#ov_'+r[0]).addEventListener('input',function(){var v=+this.value,p={};p[r[0]]=v;API().set(sel.value,p);pn.querySelector('#ov_'+r[0]+'_o').textContent=v.toFixed(r[4]<1?2:0);});});
pn.querySelector('#ov_x').addEventListener('input',function(){API().moveX(sel.value,+this.value);pn.querySelector('#ov_x_o').textContent=this.value;});
sel.addEventListener('change',show);
btn.addEventListener('click',function(){var on=pn.style.display!=='block';pn.style.display=on?'block':'none';if(on){if(!sel.options.length)fill();show();}});
pn.addEventListener('click',function(e){var a=e.target&&e.target.getAttribute&&e.target.getAttribute('data-a');if(!a)return;
 if(a==='close'){pn.style.display='none';}
 else if(a==='reset'){API().reset(sel.value);show();msg('Vraćeno na podrazumevano za: '+label(sel.value));}
 else if(a==='test'){var el=API().putTest(sel.value);showX();msg(el?'Probni predmet je u rerni.':'Ne mogu da napravim ovaj predmet (možda već postoji negde).');}
 else if(a==='copy'){var t=JSON.stringify({tool:'cookster-oven-items',version:1,items:API().all()},null,1);try{navigator.clipboard.writeText(t);msg('JSON je kopiran.');}catch(err){window.prompt('Kopiraj JSON:',t);}}
});
['pointerdown','pointerup','click','contextmenu','wheel'].forEach(function(n){pn.addEventListener(n,function(e){e.stopPropagation();},{passive:true});btn.addEventListener(n,function(e){e.stopPropagation();},{passive:true});});
})();
