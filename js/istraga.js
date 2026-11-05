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
  m1:{t:'Kad je ona umrla, neko je noću upao u kuću. Ja sam prva videla svetlo. Tražio je po celoj kući, a ja sam znala da neće naći ništa.',o:[
    {q:'Šta je tražio?',go:'m1b'},
    {q:'A gde je Savka držala tajne?',go:'m4'}]},
  m1b:{t:'Ništa vredno. Stranac je prevrnuo ormane, sanduk, fioke, sve što bi iko pretražio. A nije našao ništa, jer Savka nikad nije držala tajne tamo gde se traži.',o:[
    {q:'A gde ih je držala?',go:'m4'}]},
  m4:{t:'Ja ti kažem samo ono što sam videla. Svakog petka ujutru Savka bi sama izvukla onaj veliki tepih na sredini kuhinje, istresla ga i vratila na isto mesto. Nikome nije dala da ga takne. Čudno, zar ne? Za običan tepih.',o:[
    {q:'Mislite da je nešto ispod njega?',go:'m4a',set:'riddle',clue:'Mileva: Savka je svakog petka sama istresala veliki tepih na sredini kuhinje i nikom nije dala da ga takne.'}]},
  m4a:{t:'Ništa ja ne mislim, dete. Samo kažem šta sam videla. Zaključke izvuci sam. A ako hoćeš još svedoka, pitaj deda Radovana.',o:[
    {q:'Hvala, pogledaću.',go:null}]},
  m2:{t:'Ona je znala da je tajna najsigurnija na vidnom mestu. Zato nikad nije ništa zaključavala.',o:[
    {q:'Vratimo se knjizi.',go:'m0',clue:'Mileva: Savka nikad nije ništa zaključavala, tajne je držala na vidnom mestu.'}]},
  m3:{t:'Samo u senci. Ostavlja znake kredom, videla sam jedan na kapiji. Dok sam sela s vama, ništa ne primećujem više.',o:[
    {q:'Vratimo se knjizi.',go:'m0'}]},
  m5:{t:'Rekla sam ti šta sam videla, tepih petkom. Ako ti treba još jedan svedok, pitaj deda Radovana, on je kod nje jeo petkom.',o:[
    {q:'Hvala.',go:null}]}
 }},
 6:{name:'Deda Radovan',start:function(){return 'r0';},nodes:{
  r0:{t:'E, mladiću! Moja Stana opet će da dođe po mene, ali pre toga... šta bi hteo od starog Radovana?',o:[
    {q:'Kakva je bila Savkina kuhinja?',go:'r1'},
    {q:'Ima li nešto što ste videli oko kuće?',go:'r2'},
    {q:'Mileva kaže da je Savka petkom istresala tepih.',go:'r3',show:function(){return !!S.f.riddle;}}]},
  r1:{t:'Topla! Gulaš joj je mirisao do kapije. Petkom sam sedeo kod nje na klupi pored peći.',o:[{q:'Vratimo se.',go:'r0'}]},
  r2:{t:'Jedne noći sam video svetlo u njenoj kuhinji. Ma tražio je neko ono što ne postoji, jer Savka nikad nije držala ništa vredno tamo gde bi neko tražio.',o:[{q:'Vratimo se.',go:'r0'}]},
  r3:{t:'Tačno tako! Nije dala ni meni da stanem na njega pre nego što je ona prošla. Jednom sam se spotakao o ivicu i video da je pod njim jedna daska drugačija od ostalih. Savka me je pogledala tako da sam više nikad nije pomenuo.',o:[
    {q:'Hvala, deda.',go:null,clue:'Radovan: ispod tepiha je jedna daska drugačija od ostalih, a Savka nije dala da se o njoj priča.'}]}
 }}
};
TREE[3]={name:'Mića',start:function(){return S.f.mica?'c5':(S.f.fragment?'c0':'ccold');},nodes:{
  ccold:{t:'Drva, drva... Ne vidiš da radim? Dođi kad imaš nešto za mene.',o:[{q:'Doći ću.',go:null}]},
  c0:{t:'Savkin unuče. Vidim po licu da si našao nešto. Drva sam joj nosio trideset zima. Šta bi?',o:[
    {q:'Našao sam pola recepta ispod tepiha.',go:'c1'},
    {q:'Jeste li videli Putnika?',go:'c3'},
    {q:'Kakva je bila Savka?',go:'c2'}]},
  c1:{t:'Pola, kažeš. Onda znam ko ima drugu polovinu. Savka nikad ništa nije zapisivala na jedno mesto. Papriku je kupovala samo od Ljubice, a Ljubica pamti sve što je Savka ikad rekla.',o:[
    {q:'Gde da nađem Ljubicu?',go:null,set:'mica',clue:'Mića: drugu polovinu zna Ljubica, ona je Savki prodavala papriku. Nađi je u kafani.'},
    {q:'Zašto baš ona?',go:'c1a'}]},
  c1a:{t:'Zato što je Savka znala: ko prodaje začin, taj zna šta je u gulašu. A svoju tajnu je ostavila onome ko je ne bi iskoristio.',o:[
    {q:'Gde da nađem Ljubicu?',go:null,set:'mica',clue:'Mića: drugu polovinu zna Ljubica, ona je Savki prodavala papriku. Nađi je u kafani.'}]},
  c2:{t:'Stroga, ali pravedna. Ni jedno parče hleba nije bacila.',o:[{q:'Vratimo se.',go:'c0'}]},
  c3:{t:'Jednom je stajao kraj mog drvarnika. Ništa nije rekao. Samo je gledao u kuću.',o:[{q:'Vratimo se.',go:'c0'}]},
  c5:{t:'Ljubica ti je prava osoba. Pitaj je za papriku.',o:[{q:'Hvala.',go:null}]}
 }};
TREE[5]={name:'Ljubica',start:function(){return S.f.riddle2?'l5':(S.f.mica?'l0':'lcold');},nodes:{
  lcold:{t:'Ja ne pričam sa nepoznatima o Savki. Da te je neko poslao, rekla bih.',o:[{q:'Razumem.',go:null}]},
  l0:{t:'Mića te je poslao, vidim. Savka je kod mene kupovala samo slatku papriku. Šta si našao?',o:[
    {q:'Pola recepta. Gde je druga polovina?',go:'l1'},
    {q:'Znate li ko je Putnik?',go:'l3'}]},
  l1:{t:'Pola, kažeš. Savka je jednom rekla da je ono najvažnije držala tamo gde je i sama bila najranije. Svakog jutra, pre svanuća, ona je palila vatru i sama čistila pepeo. Nikome nije dala ni da priđe tom delu kuhinje.',o:[
    {q:'Pre svanuća? A šta je tamo radila?',go:'l2'}]},
  l2:{t:'Ne znam šta je radila, samo da je pepeo prosejavala kao da nešto traži, ili kao da nešto čuva. Jednom je rekla: „Sve što je zaista važno ostaje u toplom.“',o:[
    {q:'Hvala, razmisliću.',go:null,set:'riddle2',clue:'Ljubica: Savka je svako jutro pre svanuća sama palila vatru i prosejavala pepeo, nikom nije dala da priđe. „Sve što je važno ostaje u toplom.“'}]},
  l3:{t:'Jednom je pitao za papriku. Kupio nije. Samo je gledao kako se pakuje.',o:[{q:'Vratimo se.',go:'l0'}]},
  l5:{t:'Rekla sam ti sve što znam. Savkino jutro je počinjalo vatrom. Ostalo je na tebi.',o:[{q:'Hvala.',go:null}]}
 }};
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
  var want=!S.f.stojan?[4]:(!S.f.riddle?[4,8]:[4,8,6]);if(S.f.fragment)want=want.concat([3]);if(S.f.mica)want=want.concat([5]);
  for(var i=0;i<want.length;i++)if(!have[want[i]]){var g=T.spawnChar&&T.spawnChar(want[i]);if(g){spawnAt=Date.now()+5000;return;}}
},1500);

// ---------- the notebook ----------
function goal(){
  if(S.found)return 'Prva stranica je u knjizi. (Sledeće stranice dolaze u sledećoj verziji igre.)';
  if(S.f.riddle2)return 'Razmisli šta ti je Ljubica ispričala o Savkinom jutru. U kuhinji klikni „Pregledaj“ pa klikni na mesto za koje misliš da je drugi deo.';
  if(S.f.mica)return 'Mića te je poslao Ljubici. Nađi je u kafani i pitaj je za drugu polovinu.';
  if(S.f.fragment)return 'Našao si pola recepta. Na poleđini piše da drugu polovinu zna neko ko je Savki nosio drva. Nađi Mićin trag u kafani.';
  if(S.f.riddle)return 'Razmisli šta su ti rekli Mileva i drugi o Savki. U kuhinji klikni „Pregledaj“ pa klikni na mesto za koje misliš da je stranica.';
  if(S.f.stojan)return 'Stojan te je poslao Mileva. Nađi je u kafani (sedi sama) i pitaj je.';
  return 'Nađi prvu stranicu bakine knjige. U kafani klikni desnim na gosta, pa „Pitaj gosta“. Počni od Stojana.';
}
function canLook(){return !S.found&&((S.f.riddle&&!S.f.fragment)||S.f.riddle2);}
function refresh(){
  var h='<h4>📓 Beležnica</h4><div class="go"><b>Cilj:</b> '+goal()+'</div>';
  if(S.clues.length){h+='<b>Tragovi:</b><ul style="padding-left:18px;margin:6px 0">'+S.clues.slice().reverse().map(function(c){return '<li>'+c.replace(/</g,'&lt;')+'</li>';}).join('')+'</ul>';}
  else h+='<i>Još nema tragova.</i>';
  book.innerHTML=h;
  look.style.display=canLook()?'block':'none';
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
function setLook(on){lookOn=!!on&&canLook();look.classList.toggle('on',lookOn);document.body.classList.toggle('istraga-look',lookOn);if(lookOn)say('Klikni na mesto koje pregledaš. Ponovo „Pregledaj“ prekida.',2600);}
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
      var stage2=!!S.f.riddle2;
      if(z[4]==='rug'&&!stage2){foundFragment();return;}
      if(z[4]==='rug'){say('Tepih je već pregledan. Tu je bila samo prva polovina.',3200);return;}
      if(z[4]==='stove'&&stage2){foundPage();return;}
      S.wrong=(S.wrong||0)+1;save();say(z[5]+(S.wrong>=5?'  (Nagoveštaj: vrati se i ponovo pročitaj tragove u beležnici.)':''),3600);return;
    }
  }
  S.wrong=(S.wrong||0)+1;save();say('Ovde nema ničega.');
},true);
function foundFragment(){
  S.f.fragment=true;S.clues.push('Ispod tepiha: pola recepta. Na poleđini: „Ostatak sam poverila onima koji me nisu izdali. Pitaj onoga ko mi je nosio drva.“');save();setLook(false);refresh();
  found.innerHTML='<div class="pg"><h3>Pocepana stranica</h3>'+
   'Govedine 1 kilogram, luka koliko i mesa, slatke pap<span style="opacity:.4">~~~~~~~~</span><br><br>'+
   '<i>(Ostatak je odsečen.)</i><br><br>'+
   'Na poleđini, Savkinim rukopisom: <b>„Ostatak sam poverila onima koji me nisu izdali. Pitaj onoga ko mi je nosio drva.“</b><br><br>'+
   '<button type="button">Stavi u beležnicu</button></div>';
  found.style.display='flex';
  found.querySelector('button').onclick=function(){found.style.display='none';say('Samo polovina! Ko je Savki nosio drva?',4200);};
}
function foundPage(){
  S.found=true;save();setLook(false);refresh();
  found.innerHTML='<div class="pg"><h3>Savkin gulaš</h3><i>Obe polovine su sastavljene.</i><br><br>'+
   'Govedine 1 kilogram, luka koliko i mesa, slatke paprike kašičicu, soli koliko treba, lovorov list i malo ulja.<br><br>'+
   'Luk pirjaj dok ne postane zlatan i mek, pa tek onda stavi meso. Ne žuri. Gulaš ne trpi nestrpljenje, a kuvaj ga srcem.<br><br>'+
   '<span style="display:block;text-align:right">— Savka</span>'+
   '<button type="button">Stavi u knjigu</button></div>';
  found.style.display='flex';
  found.querySelector('button').onclick=function(){found.style.display='none';say('Stranica je u knjizi. Recept „Savkin gulaš“ je otključan.',4200);try{window.dispatchEvent(new CustomEvent('cookster:page-found',{detail:{id:'gulas'}}));}catch(x){}};
}
// the button "Pregledaj" is shown only in the kitchen
setInterval(function(){look.style.display=(canLook()&&kitchenVisible())?'block':'none';if(!kitchenVisible())setLook(false);},600);

setInterval(function(){if(cur&&!inTavern())closeTalk();},300);      // you left the tavern (the kitchen, the garden ...): the talk ends
window.addEventListener('keydown',function(e){if(e.key==='Escape'){if(cur)closeTalk();else if(lookOn)setLook(false);}},true);
refresh();
window.CooksterIstraga={guestAt:guestAt,state:function(){return S;},talk:talkTo,reset:function(){S={f:{},clues:[],found:false,wrong:0};save();refresh();closeTalk();setLook(false);},found:foundPage};
})();
