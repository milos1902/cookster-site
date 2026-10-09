/* Cookster - tool "Animacije gostiju": cutting the films of the seated guests (js/tavern-scene.js, assets/tavern/guests/anim) into parts.
   Choose a guest and a film, look through the pictures, mark where a part begins and ends, choose which part a guest who sits alone gets.
   The cuts are saved in the browser (cookster.guest-anim-cuts.v1) and work at once; "Izvezi JSON" gives them to be built into the game. */
(function(){
'use strict';
var G=window.CooksterGuestAnim;if(!G)return;
var btn=document.createElement('button'),panel=document.createElement('div');
btn.textContent='✂ Animacije gostiju';btn.setAttribute('data-tool-ui','1');
btn.style.cssText='position:fixed;left:10px;bottom:56px;z-index:2147483000;padding:8px 12px;border-radius:9px;border:2px solid #351b0d;background:#e8c27a;color:#351b0d;font:700 13px system-ui,sans-serif;cursor:pointer';
panel.setAttribute('data-tool-ui','1');
panel.style.cssText='position:fixed;left:10px;bottom:100px;z-index:2147483000;width:430px;max-height:82vh;overflow:auto;padding:12px;border-radius:12px;border:2px solid #351b0d;background:#fff4dc;color:#351b0d;font:13px system-ui,sans-serif;display:none';
document.body.append(btn,panel);
var st={ch:1,name:'pij',i:0,sel:0,playing:false,speed:1,part:false,a:null},timer=0,cuts={};
function load(){try{cuts=JSON.parse(localStorage.getItem(G.key)||'{}')||{}}catch(e){cuts={}}}
function gid(){return 'g'+(st.ch<10?'0':'')+st.ch}
function meta(){var M=G.meta();return M&&M[gid()]&&M[gid()][st.name]}
function save(){var m=meta();if(!m)return;(cuts[gid()]=cuts[gid()]||{})[st.name]={segs:m.segs,solo:m.solo||0};try{localStorage.setItem(G.key,JSON.stringify(cuts))}catch(e){}}
function el(tag,txt,css){var e=document.createElement(tag);if(txt!=null)e.textContent=txt;if(css)e.style.cssText=css;return e}
function bt(label,fn,title){var b=el('button',label,'margin:2px 3px 2px 0;padding:5px 9px;border-radius:7px;border:2px solid #351b0d;background:#e8c27a;font:700 12px system-ui,sans-serif;cursor:pointer');b.onclick=fn;if(title)b.title=title;return b}
function build(){
  load();panel.innerHTML='';
  panel.appendChild(el('b','Animacije gostiju — sečenje na delove'));
  var row=el('div',null,'margin:8px 0');
  var sc=el('select'),sn=el('select');
  for(var c=1;c<=8;c++){var o=el('option','Gost '+c);o.value=c;if(c===st.ch)o.selected=true;sc.appendChild(o)}
  [['pij','Pijenje / razgovor'],['doziv','Dozivanje konobara']].forEach(function(a){var o=el('option',a[1]);o.value=a[0];if(a[0]===st.name)o.selected=true;sn.appendChild(o)});
  sc.onchange=function(){st.ch=+sc.value;st.i=0;st.sel=0;st.a=null;build()};sn.onchange=function(){st.name=sn.value;st.i=0;st.sel=0;st.a=null;build()};
  row.append(sc,el('span',' '),sn);panel.appendChild(row);
  var m=meta();
  if(!m){panel.appendChild(el('div','Ovaj gost još nema animaciju.'));return}
  st.a=G.load(st.ch,st.name);
  var cv=el('canvas');cv.width=410;cv.height=330;cv.style.cssText='width:100%;border-radius:8px;background:repeating-conic-gradient(#555 0 25%,#666 0 50%) 0 0/16px 16px';panel.appendChild(cv);
  var info=el('div','',"margin:4px 0;font-weight:700"),rg=el('input');rg.type='range';rg.min=0;rg.max=m.n-1;rg.value=st.i;rg.style.width='100%';
  panel.append(info,rg);
  var segsBox=el('div',null,'margin:8px 0');
  function draw(){
    var a=G.load(st.ch,st.name),x=cv.getContext('2d');x.clearRect(0,0,cv.width,cv.height);
    if(!a){info.textContent='Učitavam kadrove…';return}
    var i=Math.max(0,Math.min(m.n-1,Math.round(st.i))),im=a.fr[i];
    var k=Math.min(cv.width/m.w,cv.height/m.h)*.95;x.drawImage(im,(cv.width-m.w*k)/2,(cv.height-m.h*k)/2,m.w*k,m.h*k);
    var seg=m.segs[st.sel],inSeg=seg&&i>=seg[0]&&i<seg[1];
    info.textContent='Kadar '+i+' / '+(m.n-1)+'   ('+(i/m.fps).toFixed(1)+' s)   '+(inSeg?'● u delu '+(st.sel+1):'')
    rg.value=i;
  }
  function drawSegs(){
    segsBox.innerHTML='';segsBox.appendChild(el('div','Delovi (klikni deo da ga izabereš):',"font-weight:700"));
    m.segs.forEach(function(s,k){
      var r=el('div',null,'display:flex;gap:6px;align-items:center;margin:3px 0;padding:3px 6px;border-radius:6px;cursor:pointer;background:'+(k===st.sel?'#f3d9a0':'transparent'));
      r.onclick=function(){st.sel=k;drawSegs();draw()};
      var rd=el('input');rd.type='radio';rd.name='solo';rd.checked=(m.solo||0)===k;rd.title='ovaj deo dobija gost koji sedi sam za stolom';rd.onclick=function(e){e.stopPropagation();m.solo=k;m.custom=true;save()};
      r.append(el('b','Deo '+(k+1)),el('span',s[0]+' – '+s[1]+'  ('+((s[1]-s[0])/m.fps).toFixed(1)+' s)'),rd,el('small','sam za stolom'));
      var pl=bt('▶',function(e){e.stopPropagation();st.sel=k;st.part=true;st.i=s[0];st.playing=true;go()},'pusti ovaj deo');
      var del=bt('✕',function(e){e.stopPropagation();if(m.segs.length>1){m.segs.splice(k,1);st.sel=0;m.custom=true;save();drawSegs();draw()}},'obriši deo');
      r.append(pl,del);segsBox.appendChild(r);
    });
  }
  function setSeg(which){var s=m.segs[st.sel];if(!s)return;var i=Math.round(st.i);if(which==='s'){s[0]=Math.min(i,s[1]-1)}else{s[1]=Math.max(i+1,s[0]+1)}m.custom=true;save();drawSegs();draw()}
  rg.oninput=function(){st.i=+rg.value;st.playing=false;draw()};
  var nav=el('div');
  nav.append(bt('⏮',function(){st.i=0;st.playing=false;draw()}),bt('◀',function(){st.i=Math.max(0,Math.round(st.i)-1);st.playing=false;draw()}),
    bt('▶ / ⏸',function(){st.playing=!st.playing;st.part=false;go()}),bt('▶',function(){st.i=Math.min(m.n-1,Math.round(st.i)+1);st.playing=false;draw()},'sledeći kadar'),bt('⏭',function(){st.i=m.n-1;st.playing=false;draw()}));
  var spd=el('select');[.5,1,2].forEach(function(v){var o=el('option','brzina '+v+'×');o.value=v;if(v===st.speed)o.selected=true;spd.appendChild(o)});spd.onchange=function(){st.speed=+spd.value};nav.appendChild(spd);
  panel.appendChild(nav);
  var cutr=el('div');
  cutr.append(bt('Deo počinje ovde',function(){setSeg('s')}),bt('Deo se završava ovde',function(){setSeg('e')}),
    bt('+ Novi deo od ovog kadra',function(){var i=Math.round(st.i);m.segs.push([i,Math.min(m.n,i+Math.max(8,Math.round(m.fps*2)))]);st.sel=m.segs.length-1;m.custom=true;save();drawSegs();draw()}));
  panel.append(cutr,segsBox);
  if(st.name==='doziv')panel.appendChild(el('div','Dozivanje konobara se pušta ceo: igra uzima prvi deo.','font-size:12px;opacity:.8'));
  var io=el('div');
  io.append(bt('Vrati početno za ovaj film',function(){if(cuts[gid()]){delete cuts[gid()][st.name];try{localStorage.setItem(G.key,JSON.stringify(cuts))}catch(e){}}location.reload()},'osvežava stranicu'),
    bt('Izvezi JSON',function(){var t=JSON.stringify(cuts,null,1),ta=panel.querySelector('textarea');if(!ta){ta=el('textarea',null,'width:100%;height:100px;margin-top:6px;font:11px monospace');ta.readOnly=true;panel.appendChild(ta)}ta.value=t;ta.select();var a=el('a');a.href=URL.createObjectURL(new Blob([t],{type:'application/json'}));a.download='cookster-animacije-gostiju.json';a.click()}));
  panel.appendChild(io);
  function go(){clearInterval(timer);if(!st.playing)return;timer=setInterval(function(){
    if(!document.body.contains(cv)){clearInterval(timer);return}
    st.i+=m.fps*st.speed*.04;var s=m.segs[st.sel],lo=st.part&&s?s[0]:0,hi=st.part&&s?s[1]:m.n;
    if(st.i>=hi)st.i=lo;draw();
  },40)}
  drawSegs();draw();go();
  var wait=setInterval(function(){if(!document.body.contains(cv)||panel.style.display!=='block'){clearInterval(wait);return}if(G.load(st.ch,st.name)){clearInterval(wait);draw()}},300);
}
btn.onclick=function(){if(panel.style.display==='block'){panel.style.display='none';st.playing=false;return}build();panel.style.display='block'};
})();
