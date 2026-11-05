/* Kuvanje kafe u džezvi.
   Džezva (kal_01_dzezva) + voda + mlevena kafa (predmet "Mlevena kafa (tegla)" iz menija Piće) -> na šporet -> pena se diže -> skini sa vatre u pravom trenutku -> sipaj u šoljice.
   Stanje je na samoj džezvi (dataset): cw = šoljica vode (0-3), cs = kašičica kafe, ct = zagrejanost 0..1, cpeak = najviše što je dostigla.
   Preslabo (peak < .55): voda sa kafom, nije skuvana. Dobro (.8 - 1): kafa sa penom. Pređe 1: kafa pobegne preko ivice, sve se baca. */
(function(){
var DZ='kal_01_dzezva',JAR='kafa_mlevena',CUP='pice_solja_kafa',MAXW=3;
var panel=document.createElement('div');panel.id='kafaPanel';panel.setAttribute('data-tool-ui','1');
panel.style.cssText='position:fixed;left:14px;top:150px;z-index:9000;background:rgba(40,28,20,.92);color:#f4e6cf;border:1px solid #8a6a43;border-radius:10px;padding:10px 12px;font:13px/1.35 system-ui,sans-serif;width:210px;display:none;box-shadow:0 4px 14px #0008';
document.body.appendChild(panel);
var note=document.createElement('div');note.setAttribute('data-tool-ui','1');
note.style.cssText='position:fixed;left:50%;top:70px;transform:translateX(-50%);z-index:9001;background:rgba(40,28,20,.94);color:#fff3dc;padding:8px 16px;border-radius:8px;font:15px system-ui,sans-serif;opacity:0;transition:opacity .25s;pointer-events:none;max-width:80vw;text-align:center';
document.body.appendChild(note);var nt=null;
function say(t,ms){note.textContent=t;note.style.opacity='1';clearTimeout(nt);nt=setTimeout(function(){note.style.opacity='0';},ms||2800);}
function dz(){var l=window.items||[],best=null;for(var i=0;i<l.length;i++){var e=l[i];if(e&&e.dataset&&e.dataset.itemId===DZ){if(e.dataset.surfaceZone==='stove')return e;if(!best)best=e;}}return best;}
function jars(){return(window.items||[]).filter(function(e){return e&&e.dataset&&e.dataset.itemId===JAR;});}
function n(el,k){return +el.dataset[k]||0;}
function onFire(el){try{return el.dataset.surfaceZone==='stove'&&!el.classList.contains('held')&&!!stoveState.fireOn&&(+stoveState.fireLevel||0)>0;}catch(e){return false;}}
function fireLvl(){try{return Math.max(1,+stoveState.fireLevel||1);}catch(e){return 1;}}
function kitchenVisible(){var T=window.CooksterTavern;if(T&&T.isOpen)return false;var b=document.body.classList;return !(b.contains('pantry-open')||b.contains('garden-open')||b.contains('market-open'));}
function reset(el){delete el.dataset.cw;delete el.dataset.cs;delete el.dataset.ct;delete el.dataset.cpeak;delete el.dataset.cdone;foam(el,0);}
function foam(el,t){                                  // the foam: a brown cap on top of the pot that rises from .7 and overflows at 1
  var f=el._kf;if(t<.7||!n(el,'cs')||!n(el,'cw')){if(f){f.style.display='none';}return;}
  if(!f){f=el._kf=document.createElement('div');f.style.cssText='position:absolute;left:30%;width:40%;border-radius:50%;background:radial-gradient(#9b6a3c,#4a2a14);pointer-events:none;z-index:30;transition:all .2s';el.appendChild(f);}
  var k=Math.min(1,(t-.7)/.3);f.style.display='block';f.style.top=(16-k*10)+'%';f.style.height=(10+k*14)+'%';
}
function tick(){
  var el=dz();if(!el){panel.style.display='none';return;}
  var dt=.25,w=n(el,'cw'),s=n(el,'cs'),t=n(el,'ct');
  if(onFire(el)&&w>0){
    t=Math.min(1.05,t+dt*.032*fireLvl()*(w>2?.8:1)*(t>.75?.5:1));      // the foam rises slower, so there is time to react
    el.dataset.ct=String(t);el.dataset.cpeak=String(Math.max(n(el,'cpeak'),t));
    if(t>=1&&s>0){say('☕ Kafa je pobegla preko ivice!',3200);reset(el);}
    else if(t>=1&&!s){el.dataset.ct='1';}
    else if(t>.8&&s>0&&!el._sw){el._sw=1;say('Pena se diže. Skini džezvu sa vatre!',2400);}
  }else if(t>0){t=Math.max(0,t-dt*.012);el.dataset.ct=String(t);}
  if(t<.75)el._sw=0;
  foam(el,t);render(el);
}
function render(el){
  if(!kitchenVisible()){panel.style.display='none';return;}
  var w=n(el,'cw'),s=n(el,'cs'),t=n(el,'ct'),pk=n(el,'cpeak'),done=el.dataset.cdone==='1';
  var hot=Math.round(t*100),bar='<div style="height:8px;background:#2a1c12;border-radius:4px;margin:3px 0 6px"><div style="height:8px;border-radius:4px;width:'+Math.min(100,hot)+'%;background:'+(t>.8?'#d04a2a':t>.55?'#d9a03a':'#6aa0d0')+'"></div></div>';
  var st=!w?'Prazna džezva.':(!s?'Voda, bez kafe.':(t<.55?'Zagreva se.':(t<.8?'Skoro vrela.':'Pena se diže!')));
  panel.style.display='block';
  panel.innerHTML='<b>☕ Kuvanje kafe</b><div>Voda: '+w+'/'+MAXW+' · Kafa: '+s+' kašič.</div>'+bar+'<div style="opacity:.85;margin-bottom:6px">'+st+(pk>=.8?' (dobro)':'')+'</div>'+
   '<button data-a="w">💧 Dodaj vodu</button> <button data-a="c">🥄 Dodaj kafu</button> <button data-a="p">Sipaj u šoljice</button>'+
   '<div style="opacity:.7;font-size:11px;margin-top:6px">Na jednu šoljicu ide jedna kašičica. Stavi džezvu na upaljen šporet.</div>';
  Array.prototype.forEach.call(panel.querySelectorAll('button'),function(b){b.style.cssText='margin:2px 2px 0 0;padding:4px 8px;border:1px solid #8a6a43;background:#5a4026;color:#f4e6cf;border-radius:6px;cursor:pointer;font-size:12px';b.onclick=function(){act(b.getAttribute('data-a'));};});
}
function act(a){
  var el=dz();if(!el)return;var w=n(el,'cw'),s=n(el,'cs');
  if(a==='w'){if(el.dataset.cdone==='1'){say('Džezva je već puna skuvane kafe. Prvo je sipaj.');return;}if(w>=MAXW){say('Džezva je puna.');return;}el.dataset.cw=String(w+1);say('Dodata voda: '+(w+1)+' šoljica.');}
  else if(a==='c'){
    if(!w){say('Prvo dodaj vodu.');return;}
    if(!jars().length){say('Nemaš kafu. Uzmi „Mlevena kafa (tegla)“ iz menija Piće.');return;}
    if(onFire(el)&&n(el,'ct')>.3){say('Kafa se ne sipa u vrelu vodu. Skini džezvu sa vatre.');return;}
    if(s>=MAXW+1){say('To je previše kafe.');return;}el.dataset.cs=String(s+1);say('Dodata kašičica kafe.');
  }
  else if(a==='p')pour(el);
  render(el);
}
function pour(el){
  var w=n(el,'cw'),s=n(el,'cs'),pk=n(el,'cpeak');
  if(!w||!s){say('Nema šta da se sipa. Treba voda i kafa.');return;}
  if(pk<.55){say('Kafa još nije skuvana. Stavi džezvu na vatru.');return;}
  var q=pk>=.8?'dobra':'slaba';if(s<w)q='slaba';else if(s>w+1)q='jaka';
  var d=null;try{d=kitchenEquipmentDef(CUP);}catch(e){}
  if(!d){say('Nema šoljica u kuhinji (predmet nedostaje).');return;}
  var cx0=n(el,'cx')||+el.dataset.cx||760,by0=+el.dataset.by||560;
  var onTable=el.dataset.surfaceZone==='table';var baseX=onTable?cx0:760,by=onTable?by0+8:560;
  for(var i=0;i<w;i++){
    var c=makeItem({...d,instanceId:nextItemInstanceId(d.id),x:baseX-d.w/2+(i+1)*(d.w+8),y:by-d.h,z:++zCounter});
    if(c){c.dataset.surfaceZone='table';setPose(c,baseX+(i+1)*(d.w+8),by,surfaceScaleFor(c,'table',by));c.dataset.q=q;c.dataset.label=(q==='dobra'?'Kafa sa penom':q==='jaka'?'Jaka kafa':'Slaba kafa');}
  }
  say(q==='dobra'?'Lepa kafa sa penom! Sipano '+w+'.':q==='jaka'?'Jaka kafa, sipano '+w+'.':'Kafa je slaba, sipano '+w+'.',3200);
  reset(el);try{CooksterSave.schedule();}catch(e){}
}
setInterval(tick,250);
window.CooksterKafa={state:function(){var e=dz();return e?{w:n(e,'cw'),s:n(e,'cs'),t:n(e,'ct'),peak:n(e,'cpeak')}:null;},act:act};
})();
