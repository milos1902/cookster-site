/* Cookster - TEMPORARY tool "Izvoz mesta" (to be deleted after the JSON is exported).
   In the kitchen: exports the places of every item (so the bell, trash can and spike can be given fixed start places).
   In the tavern: the sign "Kafana radi / ne radi": position, size and the tilt, then export JSON. */
(function(){
'use strict';
var btn=document.createElement('button'),panel=document.createElement('div');
btn.textContent='📍 Izvoz mesta';btn.setAttribute('data-tool-ui','1');
btn.style.cssText='position:fixed;left:10px;bottom:56px;z-index:2147483000;padding:8px 12px;border-radius:9px;border:2px solid #351b0d;background:#e8c27a;color:#351b0d;font:700 13px system-ui,sans-serif;cursor:pointer';
panel.setAttribute('data-tool-ui','1');
panel.style.cssText='position:fixed;left:10px;bottom:100px;z-index:2147483000;width:330px;max-height:70vh;overflow:auto;padding:12px;border-radius:12px;border:2px solid #351b0d;background:#fff4dc;color:#351b0d;font:13px system-ui,sans-serif;display:none';
document.body.append(btn,panel);
function inTavern(){return !!(window.CooksterTavern&&window.CooksterTavern.isOpen)}
function download(name,txt){var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([txt],{type:'application/json'}));a.download=name;a.click();setTimeout(function(){URL.revokeObjectURL(a.href)},1000)}
function out(txt,fname){
  var ta=panel.querySelector('textarea');if(!ta){ta=document.createElement('textarea');ta.readOnly=true;ta.style.cssText='width:100%;height:150px;margin-top:8px;font:11px monospace';panel.appendChild(ta)}
  ta.value=txt;ta.select();download(fname,txt);
}
function bt(label,fn){var b=document.createElement('button');b.textContent=label;b.style.cssText='margin:3px 4px 3px 0;padding:6px 10px;border-radius:8px;border:2px solid #351b0d;background:#e8c27a;font:700 12px system-ui,sans-serif;cursor:pointer';b.onclick=fn;return b}
function buildKitchen(){
  panel.innerHTML='<b>Kuhinja – mesta predmeta</b><div style="margin:6px 0">Postavi kantu, zvonce i šiljak tamo gde želiš da stoje na početku, pa klikni „Izvezi“ i pošalji mi JSON.</div>';
  panel.appendChild(bt('Izvezi JSON',function(){
    var list=(window.items||[]).filter(function(el){return el&&el.dataset}).map(function(el){var d=el.dataset;return{id:d.itemId,cx:Math.round(+d.cx||0),by:Math.round(+d.by||0),zone:d.surfaceZone||'',angle:+d.angle||0,vis:+d.vis||1}});
    var keep=list.filter(function(o){return /kanta|zvonce|siljak/.test(o.id)});
    out(JSON.stringify({kitchenStart:keep,allItems:list},null,1),'cookster-kuhinja-mesta.json');
  }));
}
var FIELDS=[['x','Levo–desno (%)',0,40,.1],['y','Gore–dole (%)',0,40,.1],['w','Veličina (širina %)',3,25,.05],['rz','Nagib (stepeni)',-30,30,.5],['ry','Okret levo/desno',-60,60,1],['rx','Naginjanje gore/dole',-60,60,1]];
function buildSign(){
  panel.innerHTML='<b>Znak „Kafana radi / ne radi“</b><div style="margin:6px 0">Namesti položaj, veličinu i nagib da dobro stoji na vratima, pa „Izvezi JSON“.</div>';
  var S=window.CooksterSign;if(!S){panel.appendChild(document.createTextNode('Znak nije učitan.'));return}
  var cur=S.get();
  FIELDS.forEach(function(f){
    var row=document.createElement('label');row.style.cssText='display:grid;grid-template-columns:120px 1fr 54px;gap:6px;align-items:center;margin:4px 0';
    var sp=document.createElement('span');sp.textContent=f[1];
    var r=document.createElement('input');r.type='range';r.min=f[2];r.max=f[3];r.step=f[4];r.value=cur[f[0]];
    var n=document.createElement('input');n.type='number';n.step=f[4];n.value=cur[f[0]];n.style.width='54px';
    function set(v){v=+v;r.value=v;n.value=v;var o={};o[f[0]]=v;S.set(o)}
    r.oninput=function(){set(r.value)};n.oninput=function(){set(n.value)};
    row.append(sp,r,n);panel.appendChild(row);
  });
  panel.appendChild(bt('Izvezi JSON',function(){out(JSON.stringify({sign:S.get()},null,1),'cookster-znak.json')}));
  panel.appendChild(bt('Vrati početno',function(){S.reset();buildSign()}));
}
btn.onclick=function(){
  if(panel.style.display==='block'){panel.style.display='none';return}
  if(inTavern())buildSign();else buildKitchen();
  panel.style.display='block';
};
})();
