/* Tool "Kutlača": sets where the food lies in the bowl of the ladle (the round field inside the ladle).
   The values are parts of the picture of the ladle (percent); they are kept in this browser (cookster.ladle-load.v1) and used at once by every ladle in the game.
   The button is a tool button: it is hidden with the other tools (switch "Alati"). */
(function(){
'use strict';
if(window.__ladleTool)return;window.__ladleTool=1;
var KEY='cookster.ladle-load.v1';
var FIELDS=[['l','Levo',0,60,.5],['t','Gore',40,90,.5],['w','Širina',20,70,.5],['h','Visina',8,40,.5],['r','Nagib',-40,40,1]];
function load(){var c={};try{c=JSON.parse(localStorage.getItem(KEY)||'{}')||{};}catch(e){}return c;}
function save(c){try{localStorage.setItem(KEY,JSON.stringify(c));}catch(e){}}
function cur(){return window.CooksterLadleBox?CooksterLadleBox.cfg():{l:11.5,t:60.5,w:44.5,h:20,r:-8};}
var btn=document.createElement('button');btn.type='button';btn.textContent='🥄 Kutlača';btn.setAttribute('data-tool-ui','1');btn.setAttribute('data-cookster-tool','1');
btn.style.cssText='position:fixed;left:10px;top:806px;z-index:2147483000;padding:6px 10px;border:2px solid #351b0d;border-radius:10px;background:#e8c27a;color:#351b0d;font:700 12px system-ui,sans-serif;cursor:pointer';
var panel=document.createElement('div');panel.setAttribute('data-tool-ui','1');panel.setAttribute('data-cookster-tool','1');
panel.style.cssText='position:fixed;left:10px;top:420px;width:250px;z-index:2147483000;padding:10px;border:2px solid #351b0d;border-radius:12px;background:#fff4db;color:#351b0d;font:600 12px system-ui,sans-serif;display:none;box-shadow:3px 4px 0 #351b0d';
['pointerdown','pointerup','click','wheel','contextmenu'].forEach(function(n){panel.addEventListener(n,function(e){e.stopPropagation();});btn.addEventListener(n,function(e){e.stopPropagation();});});
var rows={};
panel.innerHTML='<div style="font-weight:800;margin-bottom:6px">Kutlača: gde je hrana u činiji</div><div style="font-weight:500;margin-bottom:6px">Uzmi nešto kutlačom iz posude pa pomeraj klizače. Menja se odmah.</div>';
FIELDS.forEach(function(f){
  var row=document.createElement('label');row.style.cssText='display:flex;align-items:center;gap:6px;margin:3px 0';
  var sp=document.createElement('span');sp.textContent=f[1];sp.style.width='52px';
  var inp=document.createElement('input');inp.type='range';inp.min=f[2];inp.max=f[3];inp.step=f[4];inp.style.flex='1';
  var out=document.createElement('span');out.style.width='36px';out.style.textAlign='right';
  inp.addEventListener('input',function(){var c=load();c[f[0]]=+inp.value;save(c);out.textContent=inp.value;if(window.CooksterLadleBox)CooksterLadleBox.refresh();});
  row.appendChild(sp);row.appendChild(inp);row.appendChild(out);panel.appendChild(row);rows[f[0]]=[inp,out];
});
var bar=document.createElement('div');bar.style.cssText='display:flex;gap:6px;margin-top:8px';
function mkb(t,fn){var b=document.createElement('button');b.type='button';b.textContent=t;b.style.cssText='flex:1;padding:5px;border:2px solid #351b0d;border-radius:8px;background:#e8c27a;font:700 11px system-ui,sans-serif;cursor:pointer';b.addEventListener('click',fn);bar.appendChild(b);}
mkb('Vrati početno',function(){try{localStorage.removeItem(KEY);}catch(e){}sync();if(window.CooksterLadleBox)CooksterLadleBox.refresh();});
mkb('Kopiraj brojeve',function(){var t=JSON.stringify(cur());try{navigator.clipboard.writeText(t);}catch(e){}this.textContent='Kopirano';var s=this;setTimeout(function(){s.textContent='Kopiraj brojeve';},1200);});
panel.appendChild(bar);
function sync(){var c=cur();FIELDS.forEach(function(f){rows[f[0]][0].value=c[f[0]];rows[f[0]][1].textContent=c[f[0]];});}
btn.addEventListener('click',function(){var on=panel.style.display==='none';panel.style.display=on?'block':'none';if(on)sync();});
document.body.appendChild(btn);document.body.appendChild(panel);
})();
