# Znanje o dizajnu igara za Cookster (pročitano i dogovoreno)

**Ovo pročitaj odmah posle `HANDOFF.md` i `docs/PRENOS_NOVI_CHAT.md`.** Ovde je sve što smo u razgovoru sa Milošom (14.11.2026) pročitali o dizajnu igara i sve što smo dogovorili za Cookster. Novi chat treba da razgovara na osnovu ovoga, a ne da počinje ispočetka.

Detaljni dokumenti iz razgovora su u `docs/dizajn/` (spisak na kraju). Podaci karte znanja su u `js/data/knowledge-tree-data.js`.

**Pravilo o izvorima:** Miloš traži da se čita i uči. Ne preuzimaj piratske kopije knjiga (npr. PDF „The Art of Game Design" na tuđim sajtovima): koristi besplatne materijale koje autori sami objave (spisak ispod). Sajtove treba dodati u dozvoljene u okruženju sesije.

---

## 1. Dogovoreno za Cookster (Miloš je rekao ili potvrdio)

**Priča i svet**
- **Putnika nema** (brisan skroz iz priče). Nema glavnog zapleta.
- Igra **nema kraj** (klasična igra napredovanja: igraš, napreduješ, otvaraš nove stvari i prostore).
- Savka je ostavila knjigu recepata. Stalni gosti (Stojan, Mileva, Mića, Ljubica, Radovan, Stana, Vukašin, Smilja, Mirko, Dragoslav) nose male dnevne priče.
- Govor likova je južnosrpski. U `docs/PRICA.md` i `js/istraga.js` još ima Putnika: treba prepraviti.

**Napredak**
- **Zvezdice** (1 do 5) pune se **postepeno** i **ne zavise od dana ni od vremena**, nego od toga da li je zadatak **dobro urađen** (kvalitet). Veliki zadatak otvara zvezdicu.
- Svaka zvezdica otvara nov deo: kafana raste, terasa, bašta, špajz, itd.
- **Mali zadaci otvaraju bolje posuđe i bolje noževe.** Igra stalno daje nov zadatak (oko svakih 5 minuta), više malih ciljeva puni veliki cilj.
- **Gosti ocenjuju jelo.** Prestiž kafane raste ili opada, i napredak zavisi od zadovoljstva gostiju.
- **Na početku nije sve otključano** (ni posuđe, ni bašta). Sve se otključava kako igrač napreduje. Trenutno je u igri 63 od 66 predmeta odmah dostupno, to treba promeniti.
- Dve valute: **novac i znanje**, uz bodove za trošenje i ukupno zarađene (ukupno pune zvezdicu).

**Karta znanja (Savkina knjiga)** (kao stablo istraživanja u Waterpark Simulatoru)
- **3 taba: Kuhinja, Kafana, Kuća** (Kafana uključuje terasu). Ovo „Kuća" umesto „Održavanje". Dodat je i probni četvrti tab **Recepti**.
- Svaki tab: **4 reda × 16 kolona**, kolone podeljene na **5 odeljaka po zvezdici**, zlatne linije između, veliki katanac sa zvezdicom, vodoravno klizanje (točkić miša i prevlačenje).
- Cena nekad znanje, nekad novac, nekad oba. Karta je retko popunjena (kao kod Waterparka), cena je crvena kad igrač ne može da plati.
- Slike za karticu (okviri, strelice, tabovi, cene, katanci) je nacrtao Miloš u `assets/ui/napredak/`. **Miloš će nacrtati novi dizajn pozadine** karte u ChatGPT-u.
- Kod nas ima oko 234 kartice (Kuhinja 61, Kafana 61, Kuća 58, Recepti 54). Probni prozor je u `js/knowledge-tree.js`. **Ne menja igru** (brojači su samo u pregledaču).
- Primećeno: kod Waterparka neka kartica ima **dve ulazne strelice**, kod nas su gotovo sve jedna. Miloš je rekao da to ne treba sad menjati.

**Jelovnik**
- **Igrač sam sastavlja jelovnik** jela koja služi u kafani. Knjiga **„Jelovnik"** već postoji (`js/menu-book.js`, desni klik na gotovo jelo → „Dodaj u meni"). **Gosti za sada ne naručuju iz nje.** Miloš želi da gosti naručuju iz njegovog jelovnika (promena toka, treba smisliti).

**Ostalo**
- Dugmad za razvoj (Maska posude, Senke sunca...) ostaju vidljiva, igra je u razvoju.
- Prozor „Kuhinjski elementi": otvara se odmah, sa svim senkama, uz dve drvene šipke (slika `pg_sipka.webp`). Miloš je odbacio animaciju sa kočenjem.

## 2. Predlozi o kojima Miloš još nije odlučio (nemoj ih smatrati dogovorenim)
- Stalni gosti sa zadacima i **žetonima** umesto Putnika (kao tri lika u muzeju u Waterparku).
- **Sklonosti gostiju + srca** (otkrivanje omiljenih sastojaka), cena sa porukom „preskupo" (iz Pizza Connection 3).
- Kartice „Poznavanje gostiju" (istraživanje koje otkriva informacije).
- **Tezga na pijaci** kao početak pre kafane.
- Peti tab **„Selo"** (stalni gosti, događaji, kazan za rakiju, veresija, itd.). Spisak od 14 ideja je u `docs/dizajn/COOKSTER_NOVE_IDEJE.md`.
- Smanjiti broj kartica koje su samo broj („+15%", sada oko 49%) i zameniti ih karticama koje dozvoljavaju novu radnju. Dodati izbore (specijalizacije).
- Stablo igre: lista zadataka gore desno, zvezdice u gornjoj traci, proširen izveštaj dana.

## 3. Šta je u igri sada (relevantno za dizajn)
- **Postoji:** kuhinja, kafana (gosti, konobar Zoki), pijaca sa cenkanjem, sečenje, šporet, para, voda u sudoperi, narudžbine na papiriću, izveštaj dana (`js/day-report.js`), uputstvo (salata, tikvice), komšinica, istraga (prvi list), jelovnik (knjiga), kuhinjski elementi, telefon za snimanje, vreme i kiša.
- **Ne postoji:** zvezdice, lista zadataka, ocene gostiju/prestiž kao sistem, zaključavanje predmeta, nivoi jela, osoblje, čekić i porušena kafana.
- Stanje u kartama: ✔ postoji (44), ✎ treba nacrtati (30), ➕ treba napraviti (106 od 180 u prvih tri taba).

---

## 4. Šta smo pročitali i šta smo naučili

**Pouzdanost:** ✔ = pročitano direktno iz izvora, ◐ = pročitano delimično, ✖ = samo naslov.

| Izvor | Šta je | Pročitano |
|---|---|---|
| Waterpark Simulator | igra, Wikipedia, Steam, vodiči igrača, Miloševi snimci ekrana stabla istraživanja | ✔ (vodiči su od igrača) |
| Pizza Connection 3 | Steam, 2 vodiča igrača, Wikipedia | ◐ (igru nisam igrao) |
| Chef Life, Dave the Diver, Cook, Serve, Delicious!, Supermarket Simulator | pretraga interneta | ◐ (članci i diskusije) |
| Claude-Code-Game-Studios (MIT) | agenti i skills za pravljenje igara | ◐ (README i tekstovi agenata game-designer, narrative-director) |
| Everything Claude Code (ECC) | zbirka agenata za Claude Code | ◐ (README), **nije za igre** |
| Arrow (MIT) | alat za pisanje priče sa granama | ◐ (README, lista čvorova) |
| awesome-game-design | spisak veza | ◐ (samo spisak, **članke nisam otvarao**) |
| novel-to-game (MIT) | pretvaranje romana u igre | ◐ (README, metode pripovedanja i brojki, slepo testiranje) |
| Quantic Foundry | model motivacije igrača | ✔ (PDF 20 strana) |
| GDKeys | blog o dizajnu | ◐ (stabla vještina, ekonomija, uvođenje igrača, rituali, igre sa servisom) |
| Jesse Schell: Deck of Lenses | besplatan špil pitanja iz knjige „The Art of Game Design" | ✔ (110 kartica). **Knjigu nisam čitao.** |
| **Game Balance Concepts** (Ian Schreiber, besplatni kurs) | ravnoteža, ekonomija, krive troškova | ◐ (nivoi 2, 3, 7, 8) |
| **Game Design Concepts** (Ian Schreiber) | opšti dizajn | ◐ (nivoi 7, 15, 17) |
| **Game Programming Patterns** (Robert Nystrom, besplatna knjiga) | obrasci za kod igre | ◐ (poglavlja: Game Loop, Observer, State, Event Queue, Component, Dirty Flag, Service Locator, samo početak svakog) |
| The Level Design Book | dizajn nivoa | ✖ (samo sadržaj, za Cookster malo relevantno) |

### Waterpark Simulator (glavni uzor za napredak)
- Lista zadataka gore desno grupisana u „Put do N-te zvezdice"; zadatak za zvezdicu = skup ciljeva (novac, bodovi istraživanja, dekoracija, glavni zadatak). Zvezdica ne zavisi od vremena.
- **Stablo istraživanja:** 3 taba, oko 52–58 čvorova po tabu, 4 reda, oko 16 kolona (retko popunjeno), zlatne linije pre ★4 i ★5, velika zaključana kapija sa brojem, tri stanja (zeleno kupljeno, plavo može, sivo zaključano), cena u bodovima i/ili novcu (crveno ako ne možeš), strelice sa više ulaza, opis na lebdenje, cena raste pri kraju ($50.000).
- **Prestiž je ocena pojedinačnog predmeta**, ne parka. Zadatak traži „5 kanti prestiža 2", a bolju kantu otključaš istraživanjem.
- **Bodovi istraživanja se zarađuju aktivnim radom**, ne čekanjem.
- Mnogo čvorova su **nivoi nadogradnje** („Level 1–6"), jeftino za napraviti.
- Muzej: 3 lika, jedan aktivan zadatak odjednom, svaki daje svoj žeton za posebno stablo.
- Težine: pješčanik (sve otključano), lako, normalno, teško.
- Greške igrača: zaglave se na zadatku za predmet koji nisu otključali.

### Pizza Connection 3 (Gentlymad, 2018)
- Gosti u **ciljnim grupama** sa sklonostima (raznovrsnost, količina sastojaka, vrsta, namještaj, peć); „?" ikona pokazuje, iskoče **srca** kad pogodiš omiljeni sastojak (otkrivanje).
- Cena kao **postotak zarade**; gost javi „preskupo". Zadovoljstvo: **kvalitet, čekanje, raznovrsnost jelovnika, cijena**.
- Istraživanje u nivoima T1–T4; **Marketing 1/2 otkrivaju podatke** (informacije, ne brojke).
- Početak sa **malim kamionom** pre restorana. Osoblje sa osobinama (kuvar: kvalitet/brzina; konobar: ljubaznost/brzina) i platom. **Krug uticaja** restorana, namještaj u nivoima, raspored prostorija, ograničenje na 7–12 sastojaka. Ocena na Steamu oko 50% (razlozi nepročitani).

### Chef Life, Dave the Diver, Cook, Serve, Delicious!, Supermarket Simulator
- **Dave the Diver:** jela imaju nivo koji raste kad ih često spremaš; osoblje ima osobine; farma hrani restoran.
- **Cook, Serve, Delicious!:** sam biraš jelovnik (ograničen broj), nadogradnje jela dodaju sastojak, cenu i težinu; igrači se žale na previše pošte i obaveza.
- **Chef Life:** jutarnji ritual (biraš meni, naručuješ namirnice); zamerke: dosadna petlja.
- **Supermarket Simulator:** licence otvaraju robu, prostor mora prvo da se proširi; pomoćnik se otvara tek kad dostigneš cilj; čistoća ulazi u bodove napretka; zamerka: nadogradnje preskupe.

### Quantic Foundry (model motivacije, 1,25 miliona igrača)
12 motivacija u 6 grupa: **Akcija** (razaranje, uzbuđenje), **Društveno** (takmičenje, zajednica), **Majstorstvo** (izazov, strategija), **Postignuće** (završavanje, moć/rast), **Uživljavanje** (fantazija, priča), **Kreativnost** (dizajn, otkrivanje). Svaka je skala. Niske ocene su važne koliko i visoke. Mirne igre (Animal Crossing, Stardew Valley, Harvest Moon) su na strani mirnog, trajnog, bez razaranja. **Za Cookster najvažnije:** završavanje, dizajn (uređenje), strategija, otkrivanje, priča. Gužvu i takmičenje treba ostaviti kao izbor.

### GDKeys
- **Stablo vještina:** dosadne vještine sa brojem („+5%") su najgora greška. Dobra vještina ima **glagol** i dozvoljava novu radnju. Brojevi mogu da budu **mostovi** između dobrih vještina. Dobro stablo traži **odluke koje obavezuju** (ne kupovina svega). Naša karta ima oko 49% kartica koje su samo broj, što treba smanjiti.
- **Ekonomija:** razlikuj valutu (most među sistemima) od resursa; izvori i potrošači; **previše darežljivo ili previše škrto jednako ubija motivaciju**; na početku darežljivije; mjeri **novac po minuti**; vrednost valute se menja kroz vreme.
- **Uvođenje igrača, 6 stvari rano:** uloga/fantazija, šta je na kocki, ciljevi, stubovi igranja, osnovni sistemi, ton/emocija.
- **Rituali** (ponovljene male radnje) drže igrača; ne uklanjaj trenje iz udobnosti. **Igre bez kraja:** novi sadržaj da bude jeftin i spor za potrošnju (ponovno igranje).

### Jesse Schell, Deck of Lenses (pitanja, ne tekst knjige)
Najkorisnija za nas: **Essential Experience** (kakav doživljaj želimo: toplina, ponos, polagan uspeh), **Interest Curve** (udica, rast, odmori), **Goals** (kratki i dugi, igrač bira), **Visible Progress**, **Reward** (nagrada koju ne razumeš je kao da je nema; promenljive nagrade), **Punishment**, **Judgment** (razume li igrač zašto je ocena takva), **Needs** (kompetencija, autonomija, povezanost), **Meaningful Choices**, **Economy**, **Help** (kome igrač pomaže i kako to pokažu zahvalnošću), **Secrets**, **Playtesting**, **Inner Contradiction**.

### Game Balance Concepts (Ian Schreiber)
- **Troškovi i koristi:** svaki predmet ima zbir troškova i zbir koristi; cilj je da budu jednaki. Iznad krive = prejak, ispod = preslab. Razlikuje se *prejak* (korist previsoka) od *potcenjen* (cena preniska).
- **Kriva troškova:** treba definisati odnos cena–korist (linearan je redak; rastući je čest) i svaku stvar izraziti u jednoj valuti.
- **Brojke imaju oblik:** linearne, eksponencijalne (opasne: „dupliranje" gotovo uvek preterano), **trougaone** (1, 3, 6, 10, 15…: cena raste sporije od eksponencijalne).
- **Napredak i tempo (nivo 7):** u igrama bez kraja progresija nije da završi igru nego da **nagradi i uvede** igrača; problem je **„elder game"** (kad više ništa nije smisleno). Kod Sims igara elder game je **umetničko izražavanje** (uređenje). **Doživljena težina = (izazov veštine + izazov snage) − (veština + snaga igrača).** Mnogo malih dobitaka daje više sreće nego jedan veliki; **nasumična raspodela nagrada je jača od fiksne**, ali nagrada mora da bude povezana sa onim što je igrač uradio.
- **Metrike (nivo 8):** koristi medijanu i standardnu devijaciju, ne samo prosek (npr. cilj prvog nivoa 5 min: srednja 5, medijana 6, devijacija 2).

### Game Design Concepts (Ian Schreiber)
- **Odluke:** loše su *besmislene* (nema efekta), *očigledne* (uvek jedan odgovor), *slepe* (nemaš informaciju). Dobre imaju **kompromis** (razmena resursa, rizik/nagrada, izbor radnji, kratko/dugo).
- **Tok (flow):** treba izazov koji traži veštinu, jasni ciljevi i povratna informacija, i da se izazov i veština podudaraju.
- **Slepo testiranje:** koristi se pred kraj razvoja kada igra već radi; igrači igraju bez tvoje pomoći (dobiješ stvarnu sliku, ali manje informacija).
- **UI:** dobar interfejs radi ono što korisnik misli da će uraditi i daje povratnu informaciju.

### Game Programming Patterns (Nystrom): šta je korisno za naš kod
Cilj poglavlja (iz „Intent" svakog): **Game Loop** (odvoji vreme igre od unosa i brzine procesora), **Observer** (odvoji pošiljaoca događaja od onog ko reaguje), **Event Queue** (odvoji kad je poruka poslata od kad se obrađuje), **State** (stanja kao zasebni delovi), **Component** (jedan entitet obuhvata više oblasti bez povezivanja), **Dirty Flag** (odloži posao dok rezultat nije potreban), **Service Locator** (jedna globalna tačka za usluge). **Relevantno:** `js/game.js` ima oko 16.000 redova; Observer i Event Queue bi pomogli da zadaci, zvezdice i ocene gostiju ne zavise direktno od svakog dela igre. Ništa nije promenjeno, ovo je samo uvid.

### Alati za priču (Arrow, awesome-game-design, novel-to-game)
- **Arrow:** vizuelni alat (kvadratići i strelice) za razgovore sa izborima, uslovima i pamćenjem; izvozi igrivu HTML/JS verziju (MIT). Nije obavezan; vredi tek kad razgovora bude mnogo.
- **novel-to-game:** pripovedanje u **tri sloja znanja** (istina, šta likovi veruju, šta igrač zna); izbori ostavljaju **konkretne činjenice** (ne skriveni broj simpatija); **svaka brojka mora imati izvor, mesto čitanja i vidljiv efekat**; slepo testiranje od naslovnog ekrana, uz izveštaj.
- **awesome-game-design:** spisak (Emily Short o „storylets", Quantic Foundry, GDKeys, Game UI Database...). **Članke iz spiska nisam otvarao.**

---

## 5. Pravila koja iz svega izvlačimo (sažeto)
1. **Svaka kartica mora da ima izvor, mesto gde se čita i vidljiv efekat u igri** (nema ukrasnih brojeva).
2. **Smanjiti čiste nivoe sa brojem** (sada oko 49%); više kartica koje dozvoljavaju novu radnju (glagol).
3. **Nagrada kaže šta je i šta se odmah može uraditi sa njom;** nagrade povremeno promenljive, uvek povezane sa onim što je igrač uradio.
4. **Mali dobici često,** ne jedan veliki retko.
5. **Zadatak traži samo ono što je u tom trenutku otključano** (ne zaglavljivati igrača).
6. **Ekonomija:** razlikuj valutu i resurse; mjeri novac po minuti; na početku darežljivo, kasnije strože; velike cene pri kraju.
7. **Cene kartica prate krivu troškova** (trougaona ili rastuća, ne eksponencijalna).
8. **Gost objašnjava ocenu** (kvalitet, čekanje, raznovrsnost, cena); ocena bez razloga ljuti.
9. **Igra bez kraja treba „elder game"**: uređenje, razvoj jela, zadaci stalnih gostiju, događaji.
10. **Gužva i takmičenje su izbor,** ne obaveza (mirna kafana).
11. **Početak:** prvih 15 minuta mora da pokaže ulogu, cilj, osnovne sisteme i ton; prva nagrada ranije od 3. minuta (scenarij u `docs/dizajn/COOKSTER_PRVIH_15_MINUTA.md`).
12. **Testiranje:** slepo, 3–5 ljudi, od naslovnog ekrana, uz krivu interesa koju igrač sam nacrta.
13. **Kod:** nove sisteme graditi preko događaja (Observer) i odvojenih stanja, ne još jedan blok u `game.js`.

## 6. Otvorena pitanja (čekaju Miloša)
- Koje od 14 novih ideja ulaze (veresija, kazan za rakiju, sklonosti gostiju, tezga na pijaci...)?
- Peti tab „Selo"?
- Da li ostaje 4. tab „Recepti"?
- Početni jelovnik, „Danas nema", „Jelo dana", „po želji" (opcije jelovnika).
- Istraga i `PRICA.md` (Putnik): prepraviti ili izbaciti.
- Koji je prvi paket za pravljenje: lista zadataka + ocene gostiju + izveštaj dana (nije potrebna nijedna nova slika).

## 7. Dokumenti u `docs/dizajn/`
- `COOKSTER_KAKO_RADI_IGRA.md`, `COOKSTER_TOK_IGRE.md`: kako igra radi (tri brojača, zvezdice, prestiž).
- `COOKSTER_PRVIH_15_MINUTA.md`: scenarij prvih 15 minuta.
- `COOKSTER_OTKLJUCAVANJE.md`: šta je otključano na početku.
- `COOKSTER_KARTA_KONACNO.md`, `COOKSTER_KARTA_VELIKA.md`, `COOKSTER_STA_JE_NA_KARTI.md`, `KARTICE_ZNANJA.md`: karta znanja (čvorovi, kartice).
- `COOKSTER_NOVE_IDEJE.md`, `COOKSTER_PIZZA_CONNECTION.md`, `COOKSTER_LENSOVI.md`: nove ideje i primena izvora.
- `COOKSTER_ZADRZAVANJE_I_PRICA.md`, `COOKSTER_PLAN_NAPREDAKA_I_PRICE.md`, `PREGLED_DIZAJNA_COOKSTER.md`: **stariji nacrti** (spominju Putnika i kraj, koji su kasnije odbačeni).
