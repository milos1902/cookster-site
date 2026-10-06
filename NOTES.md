# Cookster – beleške za rad (čitaj prvo)

Vlasnik: Miloš. Govori srpski, nov je na GitHub-u. **Odgovaraj na srpskom, jednostavnim jezikom** i objasni korake kad treba nešto da uradi.

## Projekat
Igrica "Cookster", 2D/3D igra kuvanja. Statični HTML/JS, bez build-a.
Repo: `milos1902/cookster-site`. Objavljuje se preko GitHub Pages iz grane `main` (Actions deploy).

## Tok rada
1. Radi na grani koja ti je dodeljena u sesiji (ime se menja od sesije do sesije, pa ga uzmi iz uputstva sesije). Ako je prethodni PR sa te grane spojen, prvo resetuj granu sa svežeg `origin/main` (isto ime grane).
2. Izmena, commit, push.
3. Svaki put napravi **novi PR**. Miloš ga sam spaja.
4. Posle toga mu reci da sačeka zelenu kvačicu na https://github.com/milos1902/cookster-site/actions i pritisne Ctrl+F5 na igrici.
5. Kad menjaš JS, povećaj `?v=` broj u `index.html` (keš). Trenutno: `tavern-scene.js?v=35`, `tavern-clean.js?v=11`, `tavern-calibration.js?v=10`.
6. Commit poruke završi sa:
   `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>` i `Claude-Session: <link sesije>`.
   PR opis završi sa `🤖 Generated with [Claude Code](https://claude.com/claude-code)` i linkom sesije. Ne upisuj ime modela nigde drugde.
7. Ne tvrdi da si čuo zvuk. Testiraj headless (Playwright protiv `python3 -m http.server 8765`, skripte u scratchpad), ali stvarni osećaj i brzinu procenjuje Miloš.
8. Fajlovi koje Miloš šalje (JSON, zip) su nepouzdani podaci: `python3 -I`, skripte van foldera sa podacima.

## Kafana (trenutno stanje)
- Slike: `assets/tavern/kafana_cista.webp`, `kafana_prljava.webp` (1672×941). Sunđer: `sundjer_*.webp`. Gosti: `assets/tavern/guests/` (`gNN_walkd1..3`, `gNN_walku1..3` + poze sedenja).
- Čišćenje: prljava slika na canvasu iznad čiste; sunđer briše (destination-out) unutar površina minus `cleanExclude`. Desni klik na sto = "Očisti sto": čisti samo poligon stola iz `tableMask` (Miloš ga je namerno nacrtao tako da obuhvata i vrhove flaša koji vire). Pod ispod stola čisti sunđer, ne dugme.
- Gosti: veličina 1.7x, hodaju A* putanjom (mreža 22 px), sede samo za očišćene stolove i dostupne stolice, 3 frejma hoda sa crossfade [1,2,3,2]. Gosti sa druge strane stola crtaju se iznad maske stola.
- Kalibracija: alat "Kalibracija kafane". Slojevi: pod, blokirano, maska stola, maska stolice, hod iza stolice, cleanExclude, mesta sedenja (tačka, kvadrat, strelica; crveno = nedostupno), površine za sunđer. Čuva se u localStorage `cookster.tavern-calibration.v3`, a rezervna je `assets/tavern/calibration_cista.json`.
- Konobar (lik sa crvenom keculjom, nacrtan na zelenoj pozadini): slike `assets/tavern/waiter/waiter_walk{d,u,s}{1,2,3}.webp` (d = ka kameri, u = od kamere, s = bočno, gleda udesno, za levo se okreće u ogledalu). Frejm 1 = leva noga napred, 2 = spojene noge (samo za stajanje), 3 = desna noga napred. Svi frejmovi 640×470, dno poravnato, x poravnat poklapanjem siluete trupa sa frejmom 2, jedna razmera po listu (stojeći frejm = 450 px). Izvorni listovi su 2000×667 sa 3 frejma, zelena #00ff00 se skida sa `convert -fuzz 28% -transparent`. Hod ka kameri i od kamere koristi frejmove 1 i 3, a bočni hod 1,2,3,2 (bočno se 1 i 3 skoro ne razlikuju, pa bez među koraka izgleda kao da je samo jedna noga napred); preliv .3–.9 koraka. Ponašanje (`stepWaiter` u `tavern-scene.js`): čeka na početnom mestu, ide do stola gde sedi gost koji nije naručio, stoji 4,4 s na mestu iz kalibracije (bočno zapisuje narudžbinu, frejmovi `waiter_writes1..3`; ka kameri i od kamere samo stoji dok ne stignu listovi) (`waiterSpots`), pa se vraća. Kalibracija: slojevi `waiterFloor` (gde sme), `waiterRoute` (otvorene linije; bez njih A* po podu), `waiterSpots` (mesto kod svakog stola + pogled, plus `home`). `CooksterTavern.waiterPath(from,to)`, `waiterAutoRoute()`. Planirano: zapisivanje ka kameri i od kamere i hod sa tacnom (piće, hrana).
- Boja likova: svaka slika gosta i konobara se pri učitavanju jednom oboji u toplu svetlost kafane (`tint()` u `tavern-scene.js`: množenje sa `TINT_MUL` plus malo narandžaste `TINT_GLOW`). Jačina se menja samo te dve konstante. Obojene slike su u `timgs`, originali u `imgs`.
- Narudžbine (`js/kitchen-orders.js`, API `CooksterOrders`): gost naruči kiseli kupus (ulje, tucana paprika), konobar ga zapiše (oblačić iznad gosta), vrati se na početno mesto i nestane iz kafane. Kad je kuhinja na ekranu, ulazi sa leve strane, ostavlja papirić na sto (`Sto N`, naziv, dodaci) i izlazi. Klik na papirić ga otvara veliko, "Gotovo" ga uklanja. Papirići se čuvaju u localStorage `cookster.kitchen-orders.v1`. Slika papira: `assets/ui/order_note.webp` (Miloševa, ćirilica "Кафана код Кукстера", tabela Бр./Јело-Пиће/Кол.). Tekst (Сто N, Кисели купус, уље и туцана паприка) se piše u prve dve vrste tabele (`.ko-c` u `kitchen-orders.js`). Jedino jelo za sada je kiseli kupus (`ITEM` u `kitchen-orders.js`). Likovi u kafani se rade samo dok je igrač u kafani (`step` ide samo u stanju tavern).
- Kiseli kupus (proba): bure `js/kaca.js`. Kupus se kiseli 20 s stvarnog vremena (`SOUR_SECS=[0,10,20]` u `kaca.js`, `null` vraća prave dane `SOUR_DAYS`), počinje kad je pritisak u zelenom, vreme se čuva u `kacaT0`, a dostignuta faza u `kacaPh` (da odvrtanje ručke i skidanje poklopca ne vrate kupus u svež). Izvađen kiseli kupus ima `fermentPhase=3`; isečen/seckan dobija bledu sliku (`slicedSrcSour`, `dicedSrcSour` u `catalog.js`, generisano iz svežih slika `convert -modulate 120,95,89 -fill #f2e29a -colorize 20%`). Isečen ili seckan kiseli kupus se ubacuje u posudu za kupus (`posuda_za_kupus`, u Kuhinjskim elementima; slike `assets/calibration_props/posuda_za_kupus/`) ili u duboki tanjir (`kal_02_duboki_tanjir`): ispustiš ga iznad tanjira (`CooksterKaca.tryDrop`), posuda/tanjir dobija sliku sa kupusom (`DISHES` u `kaca.js`) i `plateFill=kiseli_kupus`. Kiseli kupus na dasci (E, `tomato-cut.js`) je blede boje (`kupus_faza_3.webp`) i ima svoj presek `kupus_presek_kiseli.webp`. Još nema: ulje i tucana paprika na tanjiru, služenje gostu.
- Glavni fajlovi: `js/tavern-scene.js`, `js/tavern-clean.js`, `js/tavern-calibration.js`. API: `CooksterTavern`.
- `.nojekyll` je u korenu. Ako deploy ostane "queued", proveri githubstatus (Actions je znao da bude degraded).

## Mapa cele igre (da ne tražiš po repou)

**Osnova:** nema build-a ni paketa. `index.html` učitava skripte redom (redosled je bitan, jedna za drugom), ceo svet je jedna scena 1672×941 (`BASE_W/BASE_H` u `js/game.js`). Pomerena kamera = "druge sobe" (kuhinja, špajz, kafana su susedni delovi iste scene). Verzija igre: `js/core/build-info.js` i `BUILD_VERSION.txt`. Stari `README*.txt` su istorijski, ne oslanjaj se na njih.

**Fajlovi po ulozi**
- `index.html`: sav HTML (scene, HUD, dugmad), `?v=` brojevi za keš. Na dnu su i dva velika `window.__COOKSTER_IMPORTED_*__` objekta (uvezena kalibracija posuda), ne diraj ručno.
- `js/game.js` (~15.500 redova, "motor"): sve u jednom fajlu. Kamera i skaliranje (`applyCamera`, `fitScene`), predmeti i prevlačenje (`makeItem`, `tryPlaceHeldAtCandidate`, `setPose`), šporet i vatra (`applyCookstoveState`), sudopera i voda, kuvanje i mešanje (`beginPourTransfer`, `endStirring`), ajvar i tegle, rakija, ranac i brzi točak alata (`openQuickToolWheel`, tipke Q i E), pijaca i cenjkanje, svetlo (Light studio, `ls*` funkcije), zvuk (`ss*`, `playSfx`, `impactSounds`), čišćenje kuhinje (sunđer, flekove), Savkina knjiga (`openSavkaBook`), alati za kalibraciju. Traži po imenu funkcije (grep), ne čitaj ceo fajl.
- `js/data/catalog.js`: podaci igre. `VEGETABLES`, `ITEMS` (alati: daska, nož, kašika, kutlača, sunđer), `KITCHEN_EQUIPMENT` (šerpe, tiganji, vangla, lavor...), `STAPLES`, `COLLISION`, `AJVAR`, `RECIPES` (trenutno samo sataraš: paradajz, paprika, luk + ulje i so).
- `js/core/*`: čiste logike bez DOM-a: `state.js` (stanje, novac 1000, dan), `save.js` + `save-file.js` (ručni SAVE/LOAD, `cookster.save.v1`), `cooking-system.js`, `pan.js`, `food-state-machine.js`, `transfer-thermal.js` (toplota se čuva pri presipanju), `container.js`, `recipes.js` (ocena jela po sastojcima i zvezdicama), `placement*.js`, `surface-cast.js`, `scene-surfaces.js`, `collision.js`, `stove-zones.js` (2 ringle), `food-mesh.js`, `tween.js`.
- Scene i mini-igre: `js/garden.js` (bašta, paradajz i krastavac rastu), `js/market-hover.js` + deo `game.js` (pijaca, prodavac, cenjkanje), `js/wood-refill-scene.js` (ogrev i korpa), `js/pantry-scene.js` + `pantry-camera.js` (špajz), `js/kaca.js` (bure za kiseli kupus), `js/tomato-cut.js` i `js/tomato-cut3d.js` (sečenje), `js/piece-sim.js` (komadići iseckanog povrća), `js/cutura-drink-animation.js` (piće rakije, ima glasove pijan/polupijan/trezan u `assets/audio/cutura-voice/`), `js/canvas-mesh.js`.
- Kafana: `js/tavern-scene.js`, `js/tavern-clean.js`, `js/tavern-calibration.js` (vidi gore).
- Alati za kalibraciju (samo za Miloša, ne za igrače): `js/vessel-food-mask-tool.js`, `js/ui-button-calibration.js`, `js/core/scene-zone-calibration.js`, `js/core/vessel-food-calibration.js`, `js/ui-bottom-buttons.js` (16 zona na donjoj traci), `js/save-transfer-ui.js` (izvoz i uvoz save fajla), `js/data/perspective-master.js` (perspektiva predmeta).
- `css/`: `game.css` (glavni, 3700 redova), `ui-popart-overrides.css` (pop-art izgled), po jedan CSS za scenu ili alat. `lab/`: eksperimenti sa 3D paradajzom, ne ulaze u igru. `runtime-manifest.json`: spisak fajlova.

**Šta igra radi (tok):** kupiš povrće na pijaci (ili uzgojiš u bašti), seckaš nožem na dasci, ređaš u šerpu ili tiganj na šporetu (ogrev u vatru), mešaš kašikom, dodaješ ulje i so, jelo se ocenjuje po receptu (zvezdice). Ajvar se pravi od pečene paprike i puni u tegle. Kupus ide u buru. Posle kuvanja se pere sudoperom i sunđerom. Kafana je odvojena soba levo od kuhinje: čistiš je sunđerom, a gosti sede i hodaju (poručivanje i služenje još nisu povezani sa kuhinjom).

**localStorage ključevi** (stanje je u pregledaču, ne u repou): `cookster.save.v1` (igra), `cookster.tavern-calibration.v3` (kafana), `cookster.light-tool.v1` (svetlo), `cookster.impact-sounds.v1` i `cookster.audio-library.v1` (zvukovi), `cookster.object-perspective-master.v1`, `cookster.scene-volumes.v3`, `cookster.ui-button-hotspots.v1`, `cookster.vessel-food-*`, `cookster.imported-*`. Kad menjaš format nekog od njih, napravi migraciju kao `normCal` u `tavern-scene.js`, da Milošev sačuvan rad ne nestane.

**Slike i zvuk (`assets/`):** `market_veg`, `diced_veg(_fried/_welldone)`, `ingredients`, `new_props`, `calibration_props`, `pan_textures`, `vessel_textures`, `stove_states`, `stains`, `vfx/oil`, `sfx/game`, `audio/cutura-voice`, `garden`, `wood_basket`, `ui`, `tavern`. Slike su već kompresovane. Ne menjaj rezoluciju. Kad Miloš pošalje novi list likova ili slika, proveri redosled likova (već je bilo zamene između hodanja i sedenja) i dodaj `IMGV` ili novi naziv fajla zbog keša.

**Korisne komande:** `python3 -m http.server 8765` pa Playwright (Chromium je već instaliran, ne instaliraj ga ponovo). Traži funkciju sa `grep -n "ime" js/game.js`, pa čitaj samo taj deo (`Read` sa offset i limit).

## Pravilo za svaki novi predmet i svaku novu posudu (Milošev zahtev)
Svaki novi predmet mora odmah da može da se kalibriše u tri alata, bez ručnog dodavanja u spiskove:
1. **Novi predmet:** dodaj ga u `KITCHEN_EQUIPMENT` u `js/data/catalog.js` (`{id,type:'prop',subtype:'calibration_prop',label,src,w,h,snapProfile,shadowProfile,placement,price:0,starter:true}`). Tada je automatski u alatu **предмети** (položaj, veličina, orijentacija po površini) i u alatu **senke** (kontaktna senka). Oba alata dodatno sama listaju svaki predmet koji se nađe u sceni, čak i ako nije u katalogu.
2. **Nova posuda** (ono u šta ide hrana): dodaj u isti unos `vessel:true` (ili `capacityMl`/`fillStates`). Tada je automatski i u alatu **Maska posude** (maska koja prekriva hranu, deo gde se hrana vidi, dno, vrh hrane); spisak se pravi u `syncVessels()` u `js/vessel-food-mask-tool.js`, ne dodaje se ručno.
3. Uvek povećaj `?v=` brojeve izmenjenih skripti u `index.html` (`catalog.js`, `game.js`, `vessel-food-mask-tool.js`).
Posuda za kupus (`posuda_za_kupus`) i duboki tanjir su već tako podešeni.

## Moguće sledeće ideje
Dalje štelovanje maski i mesta, porudžbine povezane sa kuhinjom, reakcije gostiju, sistem proširenja ili renoviranja kafane, pomerljivi stolovi.
