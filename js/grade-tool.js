/* Cookster - TEMPORARY tool "Boja likova" (delete after the JSON is exported):
   contrast, brightness, saturation and warmth (yellow) of the guests and the waiter in the tavern, live; then export JSON. */
(function(){
'use strict';
var btn=document.createElement('button'),panel=document.createElement('div');
btn.textContent='🎨 Boja likova';btn.setAttribute('data-tool-ui','1');
btn.style.cssText='position:fixed;left:10px;bottom:56px;z-index:2147483000;padding:8px 12px;border-radius:9px;border:2px solid #351b0d;background:#e8c27a;color:#351b0d;font:700 13px system-ui,sans-serif;cursor:pointer';
panel.setAttribute('data-tool-ui','1');
panel.style.cssText='position:fixed;left:10px;bottom:100px;z-index:2147483000;width:330px;padding:12px;border-radius:12px;border:2px solid #351b0d;background:#fff4dc;color:#351b0d;font:13px system-ui,sans-serif;display:none';
document.body.append(btn,panel);
var F=[['c','Kontrast',.4,2,.01],['b','Jačina (svetlina)',.4,1.8,.01],['s','Zasićenost',0,2,.01],['w','Toplina (žuta)',0,1,.01]];
function bt(label,fn){var b=document.createElement('button');b.textContent=label;b.style.cssText='margin:3px 4px 3px 0;padding:6px 10px;border-radius:8px;border:2px solid #351b0d;background:#e8c27a;font:700 12px system-ui,sans-serif;cursor:pointer';b.onclick=fn;return b}
function build(){
  var G=window.CooksterGrade;panel.innerHTML='<b>Boja gostiju i konobara</b><div style="margin:6px 0">Pomeraj klizače, vidi odmah na ljudima u kafani. Kad ti se sviđa: „Izvezi JSON“.</div>';
  if(!G){panel.appendChild(document.createTextNode('Nije učitano.'));return}
  var cur=G.get();
  F.forEach(function(f){
    var row=document.createElement('label');row.style.cssText='display:grid;grid-template-columns:116px 1fr 52px;gap:6px;align-items:center;margin:4px 0';
    var sp=document.createElement('span');sp.textContent=f[1];
    var r=document.createElement('input');r.type='range';r.min=f[2];r.max=f[3];r.step=f[4];r.value=cur[f[0]];
    var n=document.createElement('input');n.type='number';n.step=f[4];n.value=cur[f[0]];n.style.width='52px';
    function set(v){v=+v;r.value=v;n.value=v;var o={};o[f[0]]=v;G.set(o)}
    r.oninput=function(){set(r.value)};n.onchange=function(){set(n.value)};
    row.append(sp,r,n);panel.appendChild(row);
  });
  panel.appendChild(bt('Dodaj gosta',function(){try{window.CooksterTavern.spawn()}catch(e){}}));
  panel.appendChild(bt('Vrati početno',function(){G.reset();build()}));
  panel.appendChild(bt('Izvezi JSON',function(){
    var t=JSON.stringify({grade:G.get()},null,1),ta=panel.querySelector('textarea');
    if(!ta){ta=document.createElement('textarea');ta.readOnly=true;ta.style.cssText='width:100%;height:90px;margin-top:8px;font:11px monospace';panel.appendChild(ta)}
    ta.value=t;ta.select();var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([t],{type:'application/json'}));a.download='cookster-boja-likova.json';a.click();
  }));
}
btn.onclick=function(){if(panel.style.display==='block'){panel.style.display='none';return}build();panel.style.display='block'};
})();
