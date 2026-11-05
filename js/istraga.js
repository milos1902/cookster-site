/* Istraga: the first page of Baba Savka's book (a playable prototype).
   Right click on a guest in the tavern -> "Pitaj gosta" -> three questions -> the answer -> three new questions ... One guest sends you to another one, the second one gives a riddle,
   the riddle is solved in the kitchen with the button "Pregledaj" (click on the place you think it is). The page is hidden in one place only; the others give a short remark.
   The state (what was asked, the clues, the page) is kept in this browser (cookster.istraga.v1); the start menu "Nova igra" clears it. The story is in docs/PRICA.md. */
(function(){
'use strict';
if(window.CooksterIstraga)return;
var KEY='cookster.istraga.v1';
function load(){try{var d=JSON.parse(localStorage.getItem(KEY)||'null');if(d&&d.f)return d;}catch(e){}return{f:{},clues:[],found:false,wrong:0};}
var S=load();
function save(){try{localStorage.setItem(KEY,JSON.stringify(S));}catch(e){}}

var RIDDLE=['Imam pruge, a nisam zebra.','Svi me gaze, a ja se ne ljutim.','Bakine tajne ne drže se u ormanu,','nego tamo gde svako nogom prođe, a ne vidi.'];

// ---------- the talks: node = {t: what he says, o: [{q: what you ask, go: next node (null = end), set: a flag, clue: a note for the notebook}]} ----------
var TREE={
 4:{name:'Stojan',start:function(){return 's0';},nodes:{
  s0:{t:'Savkin unuče! Mislio sam da te više nikad neću videti u ovoj kafani. Šta te muči?',o:[
    {q:'Znate li nešto o bakinoj knjizi recepata?',go:'s1'},
    {q:'Kakva je baka bila kao domaćica?',go:'s2'},
    {q:'Ima li novosti u selu?',go:'s3'}]},
  s1:{t:'Knjiga... Ceo kraj je znao za nju. Ali pre nekoliko godina neko je noću tražio po kući. Niko mu nije video lice, samo senku i šešir. Prva je to primetila Mileva.',o:[
    {q:'Ko je to bio?',go:'s1a'},
    {q:'Gde mogu da nađem Milevu?',go:null,set:'stojan',clue:'Stojan: neko je noću tražio po bakinoj kući. Prva je to primetila Mileva. Ona sedi sama u kafani.'},
    {q:'Hvala, to je dovoljno.',go:null,set:'stojan',clue:'Stojan: neko je noću tražio po bakinoj kući. Pitaj Milevu.'}]},
  s1a:{t:'Ne znam. Zovu ga Putnik. Dolazi i odlazi, a u kafanu nikad ne svrati.',o:[
    {q:'Gde mogu da nađem Milevu?',go:null,set:'stojan',clue:'Putnik: stranac sa šeširom, nikad ne dolazi u kafanu. Mileva je to primetila, ona sedi sama u kafani.'},
    {q:'Hvala.',go:null,set:'stojan',clue:'Putnik: stranac sa šeširom, nikad ne dolazi u kafanu. Pitaj Milevu.'}]},
  s2:{t:'Savka je kuvala za pola sela. A znala je i da krije: najbolje je krila ono što svi vide, a niko ne pogleda.',o:[
    {q:'Šta je krila?',go:'s2a'},
    {q:'Vratimo se knjizi.',go:'s0'}]},
  s2a:{t:'Pa sve! Novac u tegli, ključ u cipeli... Mene nikad nije pustila u svoju kuhinju, ali nije se krila od onoga ko je znao da gleda.',o:[
    {q:'Vratimo se knjizi.',go:'s1',clue:'Stojan o baki: najbolje je krila ono što svi vide, a niko ne pogleda.'}]},
  s3:{t:'Selo kao selo. Samo kažu da je neko opet viđen blizu Savkine kuće. Ali to je sve što znam.',o:[
    {q:'Vratimo se knjizi.',go:'s0'}]}
 }},
 8:{name:'Mileva',start:function(){return S.f.riddle?'m5':(S.f.stojan?'m0':'mcold');},nodes:{
  mcold:{t:'Ko si ti da me ispituješ? Nemoj prvo mene. Pitaj Stojana, on sve zna.',o:[{q:'Hvala, pitaću njega.',go:null}]},
  m0:{t:'Savkin unuk! Stojan te je poslao, znam. Sedi, sedi. Šta želiš da znaš?',o:[
    {q:'Šta znate o bakinoj knjizi?',go:'m1'},
    {q:'Šta je baka krila u kući?',go:'m2'},
    {q:'Jeste li videli Putnika?',go:'m3'}]},
  m1:{t:'Kad je ona umrla, nešto je nestalo iz kuće. Ali ne sve! Savka je za svaku skrivenu stvar pravila pesmicu, da ne zaboravi gde je šta. Ja pamtim samo jednu.',o:[
    {q:'Recite mi tu pesmicu.',go:'m4'},
    {q:'A ostale?',go:'m1b'}]},
  m1b:{t:'Ostale su otišle s njom. Ima samo ova jedna, i meni je ostala u glavi.',o:[
    {q:'Recite mi tu pesmicu.',go:'m4'}]},
  m4:{t:RIDDLE.join(' '),o:[
    {q:'Šta to znači?',go:'m4a',set:'riddle',clue:'Zagonetka od Mileve: "'+RIDDLE.join(' ')+'"'}]},
  m4a:{t:'To ti ne smem reći, dete. Savka je govorila: ko ne zna da gleda, taj ne zna ni da jede. Pogledaj dobro kuhinju.',o:[
    {q:'Hvala, pogledaću.',go:null}]},
  m2:{t:'Ona je znala da je tajna najsigurnija na vidnom mestu. Zato nikad nije ništa zaključavala.',o:[
    {q:'Vratimo se knjizi.',go:'m0',clue:'Mileva: Savka nikad nije ništa zaključavala, tajne je držala na vidnom mestu.'}]},
  m3:{t:'Samo u senci. Ostavlja znake kredom, videla sam jedan na kapiji. Dok sam sela s vama, ništa ne primećujem više.',o:[
    {q:'Vratimo se knjizi.',go:'m0'}]},
  m5:{t:'Ako ne možeš da rešiš pesmicu, pogledaj kuhinju kao da hodaš po njoj prvi put. A ako zapneš, pitaj deda Radovana, on je kod nje jeo petkom.',o:[
    {q:'Hvala.',go:null}]}
 }},
 6:{name:'Deda Radovan',start:function(){return 'r0';},nodes:{
  r0:{t:'E, mladiću! Moja Stana opet će da dođe po mene, ali pre toga... šta bi hteo od starog Radovana?',o:[
    {q:'Kakva je bila Savkina kuhinja?',go:'r1'},
    {q:'Ima li nešto što ste videli oko kuće?',go:'r2'},
    {q:'Mileva mi je dala jednu pesmicu o prugama.',go:'r3',show:function(){return !!S.f.riddle;}}]},
  r1:{t:'Topla! Gulaš joj je mirisao do kapije. Petkom sam sedeo kod nje na klupi pored peći.',o:[{q:'Vratimo se.',go:'r0'}]},
  r2:{t:'Jedne noći sam video svetlo u njenoj kuhinji. Ma tražio je neko ono što ne postoji, jer Savka nikad nije držala ništa vredno tamo gde bi neko tražio.',o:[{q:'Vratimo se.',go:'r0'}]},
  r3:{t:'Pruge, pruge... Savka je imala jednu stvar sa prugama koju je volela više nego sat. Na njoj sam stajao, a nikad nisam pogledao pod nju.',o:[
    {q:'Hvala, deda.',go:null,clue:'Radovan: Savka je imala stvar sa prugama na kojoj se stajalo, a nikad se nije gledalo pod njom.'}]}
 }}
};
var GENERIC={name:'Gost',start:function(){return 'g0';},nodes:{g0:{t:'Ja samo svratih na piće. Za Savku čujem tek sad, ali pitaj Stojana, on sve zna.',o:[{q:'Hvala.',go:null}]}}};

// ---------- the pictures and the sounds of the screen ----------
var css=document.createElement('style');
css.textContent=
'#istraga,#istragaBook,#istragaFound,#istragaNote{font-family:Georgia,serif}'+
'#istraga{position:fixed;left:50%;bottom:26px;transform:translateX(-50%);width:min(880px,94vw);z-index:2147483400;display:none;background:linear-gradient(#5a3a22,#3b2414);border:3px solid #1f1208;border-radius:14px;box-shadow:0 10px 36px rgba(0,0,0,.65),inset 0 0 0 2px rgba(255,214,140,.22);color:#ffeccb;padding:16px 20px 14px}'+
'#istraga .nm{font:700 20px Georgia,serif;color:#ffd890;margin-bottom:6px}'+
'#istraga .tx{font:500 clamp(15px,1.7vw,19px)/1.45 Georgia,serif;min-height:3.8em;margin-bottom:12px}'+
'#istraga .op{display:flex;flex-direction:column;gap:7px}'+
'#istraga .op button{text-align:left;cursor:pointer;border:2px solid #1f1208;border-radius:9px;background:#e8c27a;color:#2d1a0a;font:600 clamp(13px,1.5vw,16px) Georgia,serif;padding:8px 14px;transition:background .15s,transform .1s}'+
'#istraga .op button:hover{background:#f6d99a;transform:translateX(3px)}'+
'#istraga .cl{position:absolute;right:12px;top:8px;cursor:pointer;border:0;background:transparent;color:#ffd890;font:700 20px system-ui}'+
'#istragaBtn,#istragaLook{position:fixed;z-index:2147483300;cursor:pointer;border:2px solid #351b0d;border-radius:11px;background:#e8c27a;color:#351b0d;font:700 14px Georgia,serif;padding:7px 13px;box-shadow:2px 3px 0 #351b0d}'+
'#istragaBtn{right:16px;top:12px}#istragaLook{right:16px;top:58px;display:none}#istragaLook.on{background:#ffd06a;box-shadow:0 0 14px 3px rgba(255,200,90,.8)}'+
'#istragaBtn:hover,#istragaLook:hover{background:#f6d99a}'+
'body.istraga-look #viewport,body.istraga-look #viewport *{cursor:crosshair!important}'+
'#istragaBook{position:fixed;right:16px;top:100px;width:min(380px,92vw);max-height:70vh;overflow:auto;z-index:2147483300;display:none;background:#f2e3bd;color:#3a2410;border:3px solid #6a4521;border-radius:10px;padding:14px 16px;box-shadow:0 8px 28px rgba(0,0,0,.5);font:500 14px/1.45 Georgia,serif}'+
'#istragaBook h4{margin:0 0 6px;font:700 17px Georgia,serif}#istragaBook .go{background:#e6cf96;border-radius:7px;padding:6px 9px;margin:6px 0 10px}'+
'#istragaBook li{margin:6px 0}#istragaBook .rd{font-style:italic;border-left:3px solid #8a5a2b;padding-left:9px;margin:6px 0}'+
'#istragaNote{position:fixed;left:50%;top:84px;transform:translateX(-50%);z-index:2147483350;padding:8px 18px;border-radius:11px;background:rgba(40,24,10,.9);border:2px solid #7a5428;color:#ffe8bf;font:600 15px Georgia,serif;opacity:0;transition:opacity .3s;pointer-events:none;max-width:90vw;text-align:center}'+
'#istragaFound{position:fixed;inset:0;z-index:2147483600;display:none;background:rgba(0,0,0,.7);align-items:center;justify-content:center}'+
'#istragaFound .pg{width:min(480px,92vw);background:linear-gradient(#f6e8c0,#e9d29b);color:#3a2410;border:2px solid #7a5428;border-radius:6px;padding:26px 30px;box-shadow:0 12px 50px rgba(0,0,0,.7);transform:rotate(-1.2deg);font:italic 500 17px/1.55 "Segoe Script","Bradley Hand","Comic Sans MS",cursive}'+
'#istragaFound h3{margin:0 0 8px;font:700 24px "Segoe Script","Bradley Hand",cursive;text-align:center}'+
'#istragaFound button{display:block;margin:18px auto 0;cursor:pointer;border:2px solid #351b0d;border-radius:10px;background:#e8c27a;color:#351b0d;font:700 15px Georgia,serif;padding:8px 22px}';
document.head.appendChild(css);
function el(tag,id,parent){var e=document.createElement(tag);if(id)e.id=id;e.setAttribute('data-tool-ui','1');(parent||document.body).appendChild(e);return e;}
['pointerdown','pointerup','click','contextmenu','wheel','mousedown'].forEach(function(n){document.addEventListener(n,function(e){},true);});

var panel=el('div','istraga');
var note=el('div','istragaNote');
var btn=el('button','istragaBtn');btn.type='button';btn.textContent='📓 Beležnica';
var look=el('button','istragaLook');look.type='button';look.textContent='🔍 Pregledaj';
var book=el('div','istragaBook');
var found=el('div','istragaFound');
[panel,book,found].forEach(function(e){['contextmenu','pointerdown'].forEach(function(n){e.addEventListener(n,function(ev){ev.stopPropagation();if(n==='contextmenu')ev.preventDefault();});});});

var noteT=0;
function say(t,ms){note.textContent=t;note.style.opacity='1';clearTimeout(noteT);noteT=setTimeout(function(){note.style.opacity='0';},ms||2600);}

// ---------- the talk ----------
var cur=null,typeT=0;
function closeTalk(){panel.style.display='none';clearInterval(typeT);cur=null;}
function showNode(tree,id){
  var n=tree.nodes[id];if(!n)return closeTalk();
  cur={tree:tree,id:id};
  panel.innerHTML='<button class="cl" type="button" aria-label="Zatvori">×</button><div class="nm"></div><div class="tx"></div><div class="op"></div>';
  panel.querySelector('.nm').textContent=tree.name;
  var tx=panel.querySelector('.tx'),op=panel.querySelector('.op'),i=0,full=n.t;
  panel.querySelector('.cl').onclick=closeTalk;
  function options(){
    op.innerHTML='';
    (n.o||[]).filter(function(o){return !o.show||o.show();}).forEach(function(o){
      var b=document.createElement('button');b.type='button';b.textContent=o.q;
      b.onclick=function(){
        if(o.set){S.f[o.set]=true;}
        if(o.clue&&S.clues.indexOf(o.clue)<0){S.clues.push(o.clue);say('Nova beleška u beležnici.');}
        save();refresh();
        if(o.go)showNode(tree,o.go);else closeTalk();
      };
      op.appendChild(b);
    });
  }
  clearInterval(typeT);tx.textContent='';op.innerHTML='';
  typeT=setInterval(function(){i+=2;tx.textContent=full.slice(0,i);if(i>=full.length){clearInterval(typeT);options();}},22);
  tx.onclick=function(){clearInterval(typeT);tx.textContent=full;options();};
  panel.style.display='block';
}
function inTavern(){var T=window.CooksterTavern;return !!(T&&T.isOpen);}
function talkTo(ch){if(!inTavern())return;var tree=TREE[ch]||GENERIC;showNode(tree,tree.start());}      // a talk happens only while you are in the tavern

// ---------- the right click on a guest in the tavern ----------
function guestAt(p){
  var T=window.CooksterTavern;if(!T||!T.guestsList)return null;
  var best=null;
  T.guestsList().forEach(function(g){
    if(g.mode!=='seated'||!g.seat)return;
    var x=g.seat.x,y=g.seat.y,sc=T.seatScale(y),pi=T.poseInfo(g.seat.pose||'lice')||{w:300,h:520};
    var w=pi.w*sc,h=pi.h*sc;
    if(Math.abs(p.x-x)<=w*.38&&p.y<=y+14&&p.y>=y-h)if(!best||y>best.y)best={g:g,y:y};
  });
  return best&&best.g;
}
(function hook(){
  var T=window.CooksterTavern;if(!T){return setTimeout(hook,400);}
  T.menuHooks=T.menuHooks||[];
  T.menuHooks.push(function(p,opts){var g=guestAt(p);if(g)opts.push({ic:'💬',t:'Pitaj gosta',fn:function(){talkTo(g.ch);}});});
})();
// the witnesses come to the tavern when it is open
var spawnAt=0,order=[4,8,6];
setInterval(function(){
  var T=window.CooksterTavern;if(!T||!T.isOpen||S.found)return;
  if(Date.now()<spawnAt)return;
  var have={};(T.guestsList?T.guestsList():[]).forEach(function(g){have[g.ch]=1;});
  var want=!S.f.stojan?[4]:(!S.f.riddle?[4,8]:[4,8,6]);
  for(var i=0;i<want.length;i++)if(!have[want[i]]){var g=T.spawnChar&&T.spawnChar(want[i]);if(g){spawnAt=Date.now()+5000;return;}}
},1500);

// ---------- the notebook ----------
function goal(){
  if(S.found)return 'Prva stranica je u knjizi. (Sledeće stranice dolaze u sledećoj verziji igre.)';
  if(S.f.riddle)return 'Reši Milevinu zagonetku. U kuhinji klikni „Pregledaj“ pa klikni na mesto gde misliš da je stranica.';
  if(S.f.stojan)return 'Stojan te je poslao Mileva. Nađi je u kafani (sedi sama) i pitaj je.';
  return 'Nađi prvu stranicu bakine knjige. U kafani klikni desnim na gosta, pa „Pitaj gosta“. Počni od Stojana.';
}
function refresh(){
  var h='<h4>📓 Beležnica</h4><div class="go"><b>Cilj:</b> '+goal()+'</div>';
  if(S.f.riddle)h+='<div class="rd">'+RIDDLE.join('<br>')+'</div>';
  if(S.clues.length){h+='<b>Tragovi:</b><ul style="padding-left:18px;margin:6px 0">'+S.clues.slice().reverse().map(function(c){return '<li>'+c.replace(/</g,'&lt;')+'</li>';}).join('')+'</ul>';}
  else h+='<i>Još nema tragova.</i>';
  book.innerHTML=h;
  look.style.display=(S.f.riddle&&!S.found)?'block':'none';
}
btn.onclick=function(){book.style.display=book.style.display==='block'?'none':'block';refresh();};

// ---------- the search of the kitchen ----------
var ZONES=[   // [x0,y0,x1,y1,id,remark] in the pixels of the scene (1672 x 941)
 [452,822,1424,941,'rug',null],
 [0,625,185,941,'chest','Sanduk: unutra su samo bakine stare krpe. Stranice nema.'],
 [700,0,965,215,'chandelier','Luster. Previsoko je da bi iko sakrio tamo išta.'],
 [1215,235,1672,692,'stove','Šporet. Samo hladan pepeo i čađ.'],
 [1310,40,1625,235,'sink','Sudopera. Prazna je i suva.'],
 [225,15,750,235,'grill','Roštilj. Samo stara rešetka i masnoća.'],
 [120,30,250,330,'logs','Drva za potpalu. Nema ničega među njima.'],
 [0,0,125,430,'window','Prozor sa cvećem. Cveće je suvo, a saksija prazna.'],
 [378,228,1255,600,'table','Sto. Prašina, ali ni traga od papira.'],
 [380,590,1255,700,'drawers','Fioke stola. Prazne, samo mrvice.'],
 [795,0,1140,150,'doors','Vrata kafane. Ne, ovo nije mesto za skrivanje.'],
 [1528,452,1672,712,'towel','Krpa na ručki. Nema ničega iza nje.']
];
var lookOn=false;
function setLook(on){lookOn=!!on&&S.f.riddle&&!S.found;look.classList.toggle('on',lookOn);document.body.classList.toggle('istraga-look',lookOn);if(lookOn)say('Klikni na mesto koje pregledaš. Ponovo „Pregledaj“ prekida.',2600);}
look.onclick=function(){setLook(!lookOn);};
function kitchenVisible(){
  var T=window.CooksterTavern;if(T&&T.isOpen)return false;
  var b=document.body.classList;return !(b.contains('pantry-open')||b.contains('garden-open')||b.contains('market-open'));
}
window.addEventListener('pointerdown',function(e){
  if(!lookOn||e.button!==0)return;
  var t=e.target;if(t&&t.closest&&(t.closest('[data-tool-ui]')||(window.CooksterIsToolUi&&CooksterIsToolUi(t))))return;      // only the panels and buttons outside the scene are left alone
  e.preventDefault();e.stopImmediatePropagation();
  if(!kitchenVisible()){say('Ovo se pregleda u kuhinji.');return;}
  var p;try{p=screenToScene(e.clientX,e.clientY);}catch(x){return;}
  for(var i=0;i<ZONES.length;i++){var z=ZONES[i];
    if(p.x>=z[0]&&p.x<=z[2]&&p.y>=z[1]&&p.y<=z[3]){
      if(z[4]==='rug'){foundPage();return;}
      S.wrong=(S.wrong||0)+1;save();say(z[5]+(S.wrong>=5?'  (Nagoveštaj: pitaj deda Radovana.)':''),3600);return;
    }
  }
  S.wrong=(S.wrong||0)+1;save();say('Ovde nema ničega.');
},true);
function foundPage(){
  S.found=true;save();setLook(false);refresh();
  found.innerHTML='<div class="pg"><h3>Savkin gulaš</h3>'+
   'Govedine 1 kilogram, luka koliko i mesa, slatke paprike kašičicu, soli koliko treba, lovorov list i malo ulja.<br><br>'+
   'Luk pirjaj dok ne postane zlatan i mek, pa tek onda stavi meso. Ne žuri. Gulaš ne trpi nestrpljenje, a kuvaj ga srcem.<br><br>'+
   '<span style="display:block;text-align:right">— Savka</span>'+
   '<button type="button">Stavi u knjigu</button></div>';
  found.style.display='flex';
  found.querySelector('button').onclick=function(){found.style.display='none';say('Stranica je u knjizi. Recept „Savkin gulaš“ je otključan.',4200);try{window.dispatchEvent(new CustomEvent('cookster:page-found',{detail:{id:'gulas'}}));}catch(x){}};
}
// the button "Pregledaj" is shown only in the kitchen
setInterval(function(){look.style.display=(S.f.riddle&&!S.found&&kitchenVisible())?'block':'none';if(!kitchenVisible())setLook(false);},600);

setInterval(function(){if(cur&&!inTavern())closeTalk();},300);      // you left the tavern (the kitchen, the garden ...): the talk ends
window.addEventListener('keydown',function(e){if(e.key==='Escape'){if(cur)closeTalk();else if(lookOn)setLook(false);}},true);
refresh();
window.CooksterIstraga={guestAt:guestAt,state:function(){return S;},talk:talkTo,reset:function(){S={f:{},clues:[],found:false,wrong:0};save();refresh();closeTalk();setLook(false);},found:foundPage};
})();
