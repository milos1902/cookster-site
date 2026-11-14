/* Karta znanja (Savkina knjiga): PROBNA verzija da se vidi kako izgleda i kako radi. Ne mijenja igru: otključavanja ovdje nisu povezana sa predmetima u igri.
   Prozor se otvara dugmetom "Karta znanja" (gore desno) ili dodajem ?karta u adresu. Podaci: js/data/knowledge-tree-data.js (180 kartica, 3 taba, 4 reda, 16 kolona).
   Probni brojači (znanje, novac, zvezdica) i kupljeno se čuvaju u pregledaču (cookster.tree.demo.v1); dugmad dole služe samo za probu.
   Slike: assets/ui/napredak/drvo (kartice, tabovi), zvezde (zvezdice, katanac, značka), ikone predmeta iz igre gdje postoje. */
(function(){
'use strict';
if(window.CooksterTree)return;
var D=window.CooksterTreeData;if(!D||!D.cards)return;
var A='assets/ui/napredak/',K='assets/ui/karta/',KEY='cookster.tree.demo.v1';
var TABS=[['Kuhinja','kuhinja'],['Kafana','kafana'],['Kuća','odrzavanje'],['Recepti','kafana'],['Izbori','kuhinja']];      // treći tab za sada koristi sliku "odrzavanje" (bez teksta) dok se ne nacrta nova
var COLS=16,SEC={1:[1,3],2:[4,7],3:[8,10],4:[11,13],5:[14,16]};
var cards=D.cards.map(function(c,i){c.id=c.t+'|'+c.n;c.i=i;return c;});
var byId={};cards.forEach(function(c){byId[c.id]=c;});
var S=load();
function load(){var d={bought:{},zn:42,din:1250,star:2,tab:0};try{var j=JSON.parse(localStorage.getItem(KEY)||'null');if(j&&typeof j==='object'){for(var k in d)if(j[k]!==undefined)d[k]=j[k];}}catch(e){}return d;}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S));}catch(e){}}
function el(t,c,txt){var e=document.createElement(t);if(c)e.className=c;if(txt!=null)e.textContent=txt;return e;}
// ---- slike predmeta iz igre (ako postoje)
function norm(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/đ/g,'dj');}
var artCache={};
var ART_OVR={'Nož':'assets/new_props/daska_sa_nozem.png','Veća daska':'assets/new_props/daska_sa_nozem.png','Majstorska daska':'assets/new_props/daska_sa_nozem.png','Oštar nož':'assets/new_props/daska_sa_nozem.png','Majstorski nož':'assets/new_props/daska_sa_nozem.png','Nož za meso':'assets/new_props/daska_sa_nozem.png','Nož majstora kuvara':'assets/new_props/daska_sa_nozem.png'};
function artFor(c){
  if(c.y==='L'||c.y==='Q'||c.y==='S')return null;
  if(artCache[c.id]!==undefined)return artCache[c.id];
  var src=ART_OVR[c.n]||null;
  if(!src)try{
    var K=(typeof KITCHEN_EQUIPMENT!=='undefined')?KITCHEN_EQUIPMENT:[],A2=window.CooksterItemArt||{},n=norm(c.n),best=null;
    K.forEach(function(d){var l=norm(d.label);if(l===n||(n.length>4&&(l.indexOf(n)>=0||n.indexOf(l)>=0&&l.length>5))){if(!best||l.length<norm(best.label).length)best=d;}});
    if(best)src=A2[best.id]||best.src||null;
  }catch(e){}
  artCache[c.id]=src;return src;
}
function badgeText(c){
  if(/^Cjenovnik/.test(c.n))return '↔';
  var m=/(\d+)\s*%/.exec(c.e);if(m)return '+'+m[1]+'%';
  m=/\+(\d+)/.exec(c.e);if(m)return '+'+m[1];
  m=/(\d+)\s*(mesta|gostiju|gosta|jela|stolova)/.exec(c.e);if(m)return m[1];
  m=/(\d+)\s*(sat|dan)/.exec(c.e);if(m)return m[1];
  return c.y==='S'?'S':c.y==='Q'?'!':(c.n.charAt(0));
}
// ---- stanje kartice
function isBought(c){return c.y==='✓'||!!S.bought[c.id];}
function prevInRow(c){var best=null;cards.forEach(function(x){if(x.t===c.t&&x.r===c.r&&x.c<c.c&&(!best||x.c>best.c))best=x;});return best;}
function parents(c){
  if(c.y==='✓')return [];
  var out=[];
  if(c.q){c.q.split(', ').forEach(function(nm){var p=byId[c.t+'|'+nm.trim()];if(p)out.push(p);});}
  if(!out.length){var pv=prevInRow(c);if(pv)out.push(pv);}
  return out;
}
function status(c){
  if(isBought(c))return 'done';
  var ps=parents(c),ok=ps.every(isBought);
  return (ok&&c.s<=S.star)?'can':'lock';
}
function missing(c){
  var m=[];
  if(c.s>S.star)m.push('★'+c.s+' (imaš ★'+S.star+')');
  parents(c).forEach(function(p){if(!isBought(p))m.push(p.n);});
  return m;
}
var WIRES=[["a1",749,233,113.3,108.2],["a2",745,231,106.8,111.5],["a3",739,289,179.0,118.2],["a4",746,286,114.5,181.0],["a5",743,216,98.2,104.1],["a6",750,214,94.5,101.8],["b1",607,258,166.5,79.0],["b2",590,263,79.5,177.0],["b3",593,348,260.1,78.0],["b4",595,344,71.9,268.5],["b5",591,232,146.0,78.5],["b6",595,229,72.5,153.7],["c2",592,84,43.5,43.0],["d1",669,237,205.5,29.5],["d2",664,233,23.5,206.5],["d3",651,303,271.5,26.5],["d4",660,301,21.0,266.5],["d5",659,194,164.0,25.5],["d6",668,191,22.0,164.0],["c_gore",584,339,304.5,36.0],["c_dole",590,339,37.0,304.0]].map(function(a){return{n:a[0],W:a[1],H:a[2],wl:a[3],wr:a[4]};}),WV={up:[],down:[],flat:[]};
WIRES.forEach(function(v){[0,1].forEach(function(f){var w={n:v.n,W:v.W,H:v.H,f:f,wl:f?v.wr:v.wl,wr:f?v.wl:v.wr},d=w.wr-w.wl;w.k=Math.abs(d)<15?'flat':d<0?'up':'down';WV[w.k].push(w);});});
function hash(str){var h=7;for(var i=0;i<str.length;i++)h=(h*31+str.charCodeAt(i))>>>0;return h;}
function pickWire(p,c,kind,dx,dy){var all=WV[kind],sc=function(v){return kind==='flat'?v.H*dx/v.W/90:Math.abs(Math.log((dy/Math.abs(v.wr-v.wl))/(dx/v.W)));};
  var L=all.filter(function(v){return kind==='flat'?sc(v)<=1:(function(){var r=Math.exp(sc(v));return r>.6&&r<2.2;})();});
  if(!L.length){var best=all[0];all.forEach(function(v){if(sc(v)<sc(best))best=v;});return best;}
  return L[hash(p.id+'>'+c.id)%L.length];}
function groupOther(c){      // grupa „ILI": ako je već kupljena druga kartica iz iste grupe, ova košta duplo
  if(!c.x)return null;for(var i=0;i<cards.length;i++){var o=cards[i];if(o!==c&&o.x===c.x&&isBought(o))return o;}return null;
}
function price(c){var m=groupOther(c)&&!isBought(c)?2:1;return {z:c.z*m,d:c.d*m,dbl:m===2};}
function afford(c){var p=price(c);return S.zn>=p.z&&S.din>=p.d;}
// ---- DOM
var root,panel,top,tabsEl,board,inner,tip,toast,foot,badgeEl,znEl,dinEl,svg,M={};
function build(){
  root=el('div');root.id='ktRoot';root.setAttribute('data-tool-ui','1');
  panel=el('div');panel.id='ktPanel';
  top=panel;
  badgeEl=el('div','kt-badge');top.appendChild(badgeEl);
  tabsEl=panel;
  var nz=el('div');nz.id='ktNazad';nz.title='Nazad';nz.onclick=close;panel.appendChild(nz);
  var res=el('div','kt-res');
  var pz=el('div','kt-pl');pz.style.backgroundImage='url('+A+'drvo/cena_bodovi.png)';znEl=el('span');pz.appendChild(znEl);
  var pd=el('div','kt-pl');pd.style.backgroundImage='url('+A+'drvo/cena_novac.png)';dinEl=el('span');pd.appendChild(dinEl);
  res.appendChild(pz);res.appendChild(pd);
  var x=el('button','kt-x','✕');x.onclick=close;res.appendChild(x);
  panel.appendChild(res);
  board=el('div');board.id='ktBoard';inner=el('div');inner.id='ktInner';board.appendChild(inner);
  foot=el('div');foot.id='ktFoot';
  
  [['Probno:',null],['+10 znanja',function(){S.zn+=10;}],['+500 дин',function(){S.din+=500;}],['Zvezdica −',function(){S.star=Math.max(1,S.star-1);}],['Zvezdica +',function(){S.star=Math.min(5,S.star+1);}],
   ['Počni ispočetka',function(){S.bought={};S.zn=42;S.din=1250;S.star=2;}]].forEach(function(b){if(!b[1]){foot.appendChild(el('span','',b[0]));return;}var bt=el('button','',b[0]);bt.onclick=function(){b[1]();save();refresh();};foot.appendChild(bt);});
  
  toast=el('div');toast.id='ktToast';
  panel.appendChild(board);panel.appendChild(foot);panel.appendChild(toast);
  root.appendChild(panel);
  tip=el('div');tip.id='ktTip';root.appendChild(tip);
  document.body.appendChild(root);
  root.addEventListener('mousedown',function(e){if(e.target===root)close();});
  board.addEventListener('wheel',function(e){e.preventDefault();e.stopPropagation();board.scrollLeft+=(Math.abs(e.deltaX)>Math.abs(e.deltaY)?e.deltaX:e.deltaY);},{passive:false});
  var drag=null,moved=false;
  board.addEventListener('pointerdown',function(e){if(e.button!==0)return;drag={x:e.clientX,l:board.scrollLeft};moved=false;});
  window.addEventListener('pointermove',function(e){if(!drag)return;var dx=(e.clientX-drag.x)/kk();if(!moved&&Math.abs(dx)>6){moved=true;board.classList.add('drag');hideTip();}if(moved)board.scrollLeft=drag.l-dx;});
  window.addEventListener('pointerup',function(){drag=null;board.classList.remove('drag');setTimeout(function(){moved=false;},0);});
  board.addEventListener('click',function(e){if(moved){e.stopPropagation();e.preventDefault();}},true);      // after a drag the card under the mouse is not clicked
  window.addEventListener('resize',function(){if(isOpen())fit();});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&isOpen()){e.stopPropagation();close();}},true);
}
var TABX=[[82,366],[372,638],[646,911],[919,1185],[1193,1487]];
function kk(){return Math.min(innerWidth*.98/1514,innerHeight*.98/1014);}
function fit(){panel.style.setProperty('--k',kk());}
function isOpen(){return document.body.classList.contains('kt-open');}
function metrics(){
  var h=680,rowH=Math.floor((h-20)/4),D=124;
  M={D:D,ch:rowH-6,cw:176,rowH:rowH,colW:270,padL:46,padT:12};
  M.w=M.padL+COLS*M.colW+30;
}
function pos(c){return {x:M.padL+(c.c-1)*M.colW,y:M.padT+c.r*M.rowH};}
function renderTabs(){
  Array.prototype.slice.call(panel.querySelectorAll('.kt-tab')).forEach(function(n){n.remove();});
  TABS.forEach(function(tb,i){
    var n=0,tot=0;cards.forEach(function(c){if(c.t===i){tot++;if(isBought(c))n++;}});
    var d=el('div','kt-tab'+(S.tab===i?' on':''));
    d.style.left=TABX[i][0]+'px';d.style.width=(TABX[i][1]-TABX[i][0])+'px';
    d.appendChild(el('span','',tb[0]));d.appendChild(el('small','',n+'/'+tot));
    d.onclick=function(){S.tab=i;save();board.scrollLeft=0;refresh();};
    panel.appendChild(d);
  });
}
function renderBoard(){
  metrics();inner.innerHTML='';inner.style.width=M.w+'px';
  inner.style.setProperty('--D',M.D+'px');
  // odjeljci po zvezdici: tamno polje + katanac iznad dosegnute zvezdice, zlatne linije
  for(var s=1;s<=5;s++){
    var a=SEC[s][0],b=SEC[s][1],x0=M.padL+(a-1)*M.colW-(M.colW-M.cw)/2,x1=M.padL+b*M.colW-(M.colW-M.cw)/2+(s===5?60:0);
    if(s>1){var g=el('div','kt-gate');g.style.left=x0+'px';inner.appendChild(g);}
    if(s>S.star){
      var dk=el('div','kt-dark');dk.style.left=x0+'px';dk.style.width=(x1-x0)+'px';inner.appendChild(dk);
      var lk=el('div','kt-lock'),lw=Math.round(M.D*1.1);lk.style.width=lw+'px';lk.style.height=Math.round(lw*1.18)+'px';lk.style.left=Math.round((x0+x1)/2-lw/2)+'px';lk.style.top=Math.round(M.padT+M.rowH*2.05)+'px';
      var b2=el('b','',String(s));b2.style.fontSize=Math.round(lw*.34)+'px';lk.appendChild(b2);inner.appendChild(lk);
    }
  }
  // konci (čipkaste trake) između kruga roditelja i kruga deteta; krugovi ih pokrivaju na krajevima
  var mine=cards.filter(function(c){return c.t===S.tab;});
  mine.forEach(function(c){
    parents(c).forEach(function(p){
      var A1=pos(p),B1=pos(c),px=A1.x+M.cw/2,py=A1.y+M.D/2,cx=B1.x+M.cw/2,cy=B1.y+M.D/2,w=el('div','kt-wire'+(isBought(p)?'':' off')),dx=cx-px;
      var v=pickWire(p,c,cy<py?'up':Math.abs(cy-py)<2?'flat':'down',dx,Math.abs(cy-py)),dy=Math.abs(cy-py),sy=v.k==='flat'?Math.min(dx/v.W,48/v.H):dy/Math.abs(v.wr-v.wl);
      w.style.backgroundImage='url('+K+'konci/'+v.n+'.webp)';w.style.left=px+'px';w.style.width=dx+'px';w.style.height=(v.H*sy)+'px';w.style.top=(py-v.wl*sy)+'px';
      if(v.f)w.style.transform='scaleX(-1)';
      inner.appendChild(w);
    });
  });
  // kartice (čipkasti krugovi)
  mine.forEach(function(c){
    var st=status(c),p=pos(c),d=el('div','kt-card st-'+(st==='done'?'done':st==='can'?'can':'lock'));
    d.style.left=p.x+'px';d.style.top=p.y+'px';d.style.width=M.cw+'px';d.style.height=M.ch+'px';d.dataset.id=c.id;
    d.appendChild(el('div','kt-ring'));
    d.appendChild(el('div','kt-st','★'+c.s));
    if(st==='done')d.appendChild(el('div','kt-ok','✓'));
    var inn=el('div','kt-in'),ic=el('div','kt-ic'),src=artFor(c);
    if(src){var im=el('img');im.src=src;im.alt='';im.draggable=false;ic.appendChild(im);}
    else{var sp=el('span',c.y==='Q'?'q':c.y==='S'?'s':'',badgeText(c));ic.appendChild(sp);}
    inn.appendChild(ic);d.appendChild(inn);
    d.appendChild(el('div','kt-nm',c.n));
    var co=el('div','kt-co'),pr=price(c);
    if(st!=='done'&&(pr.z||pr.d)){
      if(pr.z){var a1=el('div','kt-pl'+(S.zn<pr.z?' bad':''));a1.style.backgroundImage='url('+A+'drvo/cena_bodovi.png)';a1.appendChild(el('span','',String(pr.z)));co.appendChild(a1);}
      if(pr.d){var a2=el('div','kt-pl'+(S.din<pr.d?' bad':''));a2.style.backgroundImage='url('+A+'drvo/cena_novac.png)';a2.appendChild(el('span','',pr.d>=1000?(pr.d/1000).toString().replace('.',',')+'k':String(pr.d)));co.appendChild(a2);}
    }
    if(c.x)d.appendChild(el('div','kt-or'+(groupOther(c)&&st!=='done'?' dbl':''),groupOther(c)&&st!=='done'?'×2':'ILI'));
    d.appendChild(co);
    d.addEventListener('mouseenter',function(e){showTip(c,d);});d.addEventListener('mouseleave',hideTip);
    d.addEventListener('click',function(){onCard(c,d);});
    inner.appendChild(d);
  });
}
function showTip(c,d){
  var st=status(c),h='<b>'+c.n+'</b>'+c.o+'<em>Daje: '+c.e+'</em>';
  if(c.q)h+='<em>Traži: ★'+c.s+(c.q?', '+c.q:'')+'</em>';else if(c.y!=='✓')h+='<em>Traži: ★'+c.s+'</em>';
  if(c.x){var go=groupOther(c);h+='<em>'+(go&&!isBought(c)?'Izabrao si „'+go.n+'". Ovaj izbor košta duplo.':'Izbor „ILI": uzimaš samo jedan, drugi košta duplo.')+'</em>';}
  if(st==='lock'){h+='<em class="need">Fali: '+missing(c).join(', ')+'</em>';}
  else if(st==='can'&&!afford(c)){var pp2=price(c),f=[];if(S.zn<pp2.z)f.push('✦ '+(pp2.z-S.zn)+' znanja');if(S.din<pp2.d)f.push((pp2.d-S.din)+' дин');h+='<em class="need">Fali: '+f.join(', ')+'</em>';}
  else if(st==='can')h+='<em>Klikni da kupiš.</em>';
  if(c.g!=='OK'){h+='<em style="font-weight:400;font-size:12px;opacity:.75">'+(c.g==='NOVO'?'(u igri još ne postoji)':'(treba nacrtati sliku)')+'</em>';}
  tip.innerHTML=h;tip.style.display='block';
  var r=d.getBoundingClientRect(),w=300,x=r.right+8;if(x+w>innerWidth-8)x=r.left-w-8;
  var y=Math.min(r.top,innerHeight-tip.offsetHeight-8);tip.style.left=Math.max(8,x)+'px';tip.style.top=Math.max(8,y)+'px';
}
function hideTip(){tip.style.display='none';}
function say(m){toast.textContent=m;toast.classList.add('on');clearTimeout(say.t);say.t=setTimeout(function(){toast.classList.remove('on');},1900);}
function onCard(c,d){
  var st=status(c);
  if(st==='done'){say('Već imaš: '+c.n+'.');return;}
  if(st==='lock'){d.classList.remove('shake');void d.offsetWidth;d.classList.add('shake');say('Zaključano. Fali: '+missing(c).join(', ')+'.');return;}
  if(!afford(c)){d.classList.remove('shake');void d.offsetWidth;d.classList.add('shake');say('Nemaš dovoljno za '+c.n+'.');return;}
  var pp=price(c);S.zn-=pp.z;S.din-=pp.d;S.bought[c.id]=1;save();refresh();say('Kupljeno: '+c.n+'.');
}
function refresh(){
  badgeEl.innerHTML='<b>★'+S.star+'</b>';
  znEl.textContent=S.zn;dinEl.textContent=S.din+' дин';
  renderTabs();renderBoard();hideTip();
}
function open(){if(!root)build();document.body.classList.add('kt-open');fit();refresh();}
function close(){document.body.classList.remove('kt-open');hideTip();}
function init(){
  var b=el('button','','Karta znanja');b.id='ktBtn';b.setAttribute('data-tool-ui','1');b.onclick=open;document.body.appendChild(b);
  if(/[?&]karta/.test(location.search))setTimeout(open,400);
}
window.CooksterTree={open:open,close:close,state:function(){return S;}};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
