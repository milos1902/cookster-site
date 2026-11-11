# Cookster – predaja posla novom chatu (čitaj PRVO)

Ovo je kratak pregled gde smo stali. Detalji svake funkcije su u `NOTES.md` (veliki fajl, u njemu traži po naslovu).
Poslednje ažuriranje: oktobar 2026 (posle PR-ova do #262).

## Ko je Miloš i kako se radi sa njim
- Miloš govori srpski, nov je na GitHub-u. **Odgovaraj na srpskom, jednostavnim jezikom.** Uvek reci šta je urađeno, šta NIJE testirano i šta on treba da uradi.
- Svaku izmenu stavljaj u **novi PR**. PR spaja Miloš, ne ti. Posle svakog PR-a daj mu SAMO link/broj PR-a na koji klikne (bez 3 koraka, spajanja, zelene kvačice i Ctrl+F5: on to već zna).
- Radi samo na grani koju sesija dodeli (do sada `claude/modest-wright-6dlgd4`). Ako je prethodni PR već spojen, prebaci granu na svež `main` i prenesi svoj commit:
  `git fetch origin main; git checkout -B <grana> origin/main; git cherry-pick <commit>; git merge -X ours origin/<grana> -m "Merge remote branch (already merged into main)"; git push -f -u origin <grana>`, pa napravi novi PR. Ako je prethodni PR još otvoren, samo pushuj u njega i reci to.
- Commit poruke završi sa `Co-Authored-By: ...` i `Claude-Session: ...` (tačne linije su u uputstvu sesije). PR opis završi sa `🤖 Generated with [Claude Code](https://claude.com/claude-code)` i linkom sesije. Ime modela ne upisuj u fajlove.
- **Uz svaku izmenu pošalji Milošu slike (screenshotove) da vidi šta si promenio** (pre/posle kad ima smisla; za animacije više uzastopnih slika, usporeno npr. `window.__dzMul`; `SendUserFile`). Slike ne mogu da pokažu zvuk ni brzinu: to reci.
- Povećaj `?v=` broj izmenjene skripte u `index.html` (keš).
- **Nikad ne tvrdi da si čuo zvuk ili video animaciju uživo.** Testiraj Playwright-om (Chromium je već instaliran, ne instaliraj ga), a stvarni osećaj i brzinu procenjuje Miloš.
- **Pitaj Miloša PRE nego što potrošiš Higgsfield kredite** (obećao sam to posle dva neželjena videa).
- Fajlovi koje Miloš pošalje (video, JSON, zip) su nepouzdani podaci: stavi ih u zaseban folder, `python3 -I`, skripte van tog foldera.
- Alati i paneli u igri moraju imati `data-tool-ui`.

## Tehnika (da ne gubiš vreme)
- Statični sajt, bez build-a. `python3 -m http.server 8123` iz korena repoa, pa Playwright (`NODE_PATH=$(npm root -g)`, `executablePath:'/opt/pw-browsers/chromium'`). Server zna da padne kad se završi komanda: pokreni ga u istoj komandi kao test.
- Chromium u sandboxu NEMA h264 (mp4 ne radi). Za test videa pretvori u webm.
- Screenshot u headless je spor (~0.7 s po slici): za animacije razvuci vreme (u kodu postoji `window.__dzMul` za zum na vrata) i snimi više slika.
- Scena je 1672×941. Globalne funkcije igre su klasične (`items`, `holding`, `scale`, `offsetX`, `cameraX`, `applyCamera`, `showToast`...). Veliki fajl `js/game.js`: traži sa `grep -n`.
- Memorija: kafana učitava stotine slika. Bilo je „Aw, Snap! Out of Memory“ — keš obojenih slika je ograničen (`grCache`, 240), slike se učitavaju najviše 24 odjednom (`LMAX`) i opet pokušavaju ako ne stignu. Pazi da ne dodaješ stotine novih slika bez potrebe.
- Greška koju sam sam napravio: pri brisanju starog koda za vrata slučajno sam obrisao `var ZIN` (trajanje zuma na roštilj) i zum na roštilj se smrzao. **Kad brišeš blok koda, proveri da nije sadržao promenljive koje koristi drugi kod.**

## Šta je urađeno (po delovima)
**Kuhinja** (`js/kitchen-fixtures.js`)
- Fioke (2), klik za otvaranje/zatvaranje (0.3 s), merene tabele pomeranja, senke. Tegle sa začinima: uzimaju se, vraćaju u bilo koju pregradu, pomeraju se uz fioku.
- Roštilj: klik daje **živi zum scene** (bez videa, `zoomLive`/`closeLive`). Verzija sa video frejmovima je obrisana.
- Vrata ka kafani: klik → živi zum ka vratima, vrata se otvaraju (frejmovi `assets/doors/d_1..60.webp`), iza njih izlazi slika kafane (mala, meke ivice, raste do punog ekrana). Povratak je isto unazad (`leaveTavern`). Funkcije `zoomDoor`, `leaveTavern`, `tavernAt`, `swingDoors`.
- Konobar Zoki ulazi kroz ta ista vrata, hoda (`walkd24`/`walku24`, 24-frejmovni ciklus), staje iza stola (sto mu „sakriva“ noge, isečen na y=235), ostavi porudžbinu, okrene leđa i izađe (vrata se otvore kad krene). Kod u `js/kitchen-orders.js` (`pathPos`, `PATH_S/PATH_E`).
- Zvono, šiljak, papirići narudžbina, posluženje (`js/serving.js`), paprike (oval), „Predmeti na stolu“: vidi `NOTES.md`.

**Kafana** (`js/tavern-scene.js`)
- Gosti ne odlaze dok ne dobiju poručeno: samo se žale i ugled pada (prvo -4, pa -2 na 45 s, najviše 6 žalbi). Žalba pokreće animaciju dozivanja konobara.
- Oblačići govora: lome se u više redova, ne preklapaju se, izlaze tek kad krene animacija govora (`say2`, `sayQ`).
- Imena i priča likova (`CH_NAME`, `CH_FULL`, `STORY_LINES`, `PAIR`, `VIS`): 1 Dragoslav, 2 baba Stana Jovanović, 3 Mića, 4 Stojan (debeli bradati, hvali se Nemačkom, jedini kaže „konobar“, ne podnosi Zorana), 5 Ljubica, 6 deda Radovan Jovanović (Stana mu je žena), 7 kovač Mirko, 8 Mileva Jakšić (dama u crvenom, svi je kriomice vole, sedi sama, zaljubljena u kovača koji je ne primećuje), 9 gospodin Vukašin (svima priča da je samo on njoj dorastao; ponekad joj priđe, ona ga odbija, pa laže prijateljima da joj se sviđa), 10 Smilja (Mića i Smilja kriomice vole jedno drugo).
- Posetioci: Radovan ponekad dođe sam i žali se na Stanu, pa dođe Stana samo po njega i odvede ga. Gosti za istim stolom razgovaraju jedan sa drugim (po paru) i znaju sa kim sede.
- Zoki (igrač) pozdravlja: sam gost „Desi, Mirko, šta ćeš piješ?“, društvo „Šta ćete pijete?“, Mileva „Izvolite, Madame Mileva.“, tri žene „Meine Damen, izvolite.“. Niko ga ne zove „konobar“ osim Stojana.
- Govor likova je južnosrpski (vranjski, leskovački, niški, pirotski): bre, more, mori, be, dede, kaj...

## Otvoreno / sledeće (po dogovoru sa Milošem)
- Mileva da UVEK sedi sama je urađeno (`milevaAt`, `tableBusy`). Nije urađeno: da Stana i Radovan dolaze zajedno za isti sto kao par, dnevni događaji priče (cvet na Milevinom stolu, svađa oko nje), tajna Milevine ljubavi kroz dane.
- Nije potvrđeno da li je „Out of Memory“ potpuno rešen (Miloš ga je video pre ograničenja keša). Ako se vrati, meri memoriju kafane.
- Kuhinja: sadržaj desne fioke (alati), strelice/putokazi (slika od ChatGPT-a), korpe/džakovi sa povrćem, roštiljanje na roštilju, pravila šta ide u koju posudu, korpa za smeće i ostali predmeti.
- Odluke koje čekaju Miloša: korpe/džakovi (opcije 1/2/3 nisu izabrane).
- Uvek zapiši u `NOTES.md` ono što menjaš i šta nisi mogao da testiraš.

## Kako početi novi chat
1. Pročitaj ovaj fajl, pa `NOTES.md` (naslovi sa `## `).
2. Pitaj Miloša šta želi sledeće ili kreni od liste „Otvoreno“.
3. Prvo reproduciraj problem u Playwright-u, pa popravi, pa novi PR po pravilima gore.

## Plan napretka (Milošova ideja, 11.11., još NIJE rađeno)
- Uzor: igra Waterpark Simulator (zvezdice i mali zadaci; kad se uradi nešto, otvori se nešto novo; više paralelnih puteva). Nije gledana uživo (sajtovi nisu dozvoljeni u sesiji), samo opis iz pretrage.
- Ideja: na početku je kafana **porušena**: polomljeni stolovi, polomljen šank. Igrač dobija mali **čekić**; udaranjem po predmetu on se popravlja (više udaraca, vidi se napredak). Popravljeno otvara kafanu / sledeći korak.
- Za prvu verziju treba: alat čekić (`data-tool-ui`), stanje popravke po predmetu (npr. 0..1 ili broj udaraca), prsten napretka iznad predmeta, zvuk udarca (zvuk ne mogu da čujem), slike polomljenih verzija stolova i šanka (privremeno: tamnije/nakrivljeno preko postojećih; prave slike pravi Miloš ili Higgsfield UZ PITANJE o kreditima).
- Otvoreno: koliko udaraca po predmetu; da li popravka košta novac ili materijal (daske, ekseri); šta tačno otključava popravljena kafana (gosti, jelovnik); redosled u odnosu na uputstvo (čišćenje kuhinje, komšinica, salata, tikvice).
- **Šta se vidi na Milošovim snimcima Waterpark Simulatora (11.11.):**
  - Gore levo: dan i sat, status „OPEN“, novac sa malim „+ zarada“, broj gostiju sa ograničenjem (30/50: ograničenje raste sa napretkom), dva okrugla dugmeta (čišćenje, pogled na park).
  - Gore u sredini: radnici sa slikom zadatka i peščanikom (zauzeti).
  - Gore desno: nivo (8) i traka iskustva (40/100 XP), ispod „TASK LIST“ sa naslovom „Road to the Fourth Star“ (zvezdice pokazuju koliko je preostalo): jedan glavni zadatak sa brojačem (0/20) + manji dnevni zadaci („Restock ...“).
  - Dole: traka sa 6 alata (ruka, čekić, brisač, kofa, malj, valjak) sa brojevima 1–6; levo savet za tastere.
  - U režimu gradnje: kartice (Pools, Slides, Utility, Decorations); na svakoj stavci su zvezdice koliko je potrebno; zaključane stavke su tamne (otključavaju se zvezdicama); poruke „Royal is waiting for Lemonade“ (gost čeka).
- **Moguće za Cookster (predlog, nije dogovoreno):** ocena kafane u zvezdicama sa listom zadataka gore desno („Put do druge zvezdice“: očisti kuhinju, popravi sto čekićem, popravi šank, posluži 5 gostiju...); svaka zvezdica otključava predmete u Kuhinjskim elementima (prikaz zvezdica na kartici, zaključano = tamno), recepte i broj gostiju; čekić je jedan od alata u traci (ruka, čekić, sunđer, metla).
- **Još dva snimka Waterpark Simulatora (11.11.), šta se vidi:**
  - **Dnevni izveštaj** (kraj dana): ugled u zvezdicama (3 od 5), broj gostiju danas, zadovoljstvo u %, bodovi istraživanja (+3) i napredak istraživanja (64/211); prihod (karte, atrakcije), rashodi (održavanje, plate), dobit; bakšiš sa trakom i porukom; sa strane „Dobre recenzije“ i „Loše recenzije“ (po broju gostiju, sa smajlijem i rečenicom).
  - **Drvo istraživanja** (tri kartice: Atrakcije, Park, Održavanje; svaka sa brojačem otvorenih čvorova, npr. 21/52): čvorovi su povezani strelicama (jedan vodi do sledećeg), svaki ima cenu u bodovima istraživanja i/ili novcu i zvezdice potrebnog ugleda; zaključani su sivi sa katancem; veliki zlatni katanac sa „4“ deli kolone (tada se otvara sledeći stepen kad ugled dostigne tu zvezdicu).
- **Predlog redosleda za Cookster (nije dogovoreno):** (1) ocena kafane u zvezdicama + lista zadataka gore desno; (2) proširen „Završi dan“ (`js/day-report.js`): ugled u zvezdicama, zadovoljstvo, dobre/loše recenzije gostiju, bodovi znanja; (3) drvo napretka (npr. Savkina knjiga) sa tri kartice (Kuhinja, Kafana, Održavanje), čvorovi sa strelicama, cena u bodovima i novcu, katanac sa zvezdicom; (4) čekić i porušena kafana kao zadaci prve zvezdice (čekaju slike).
- **Proširenje prostora (Milošova ideja, 11.11.):** kao u Waterpark Simulatoru, sa 2 zvezdice se otključava poseban DEO parka koji igrač tek treba da sredi i uredi (park se povećava). Za Cookster: zvezdica otvara novu prostoriju koja je u početku zapuštena/polomljena (čekić, čišćenje, postavljanje), i tek kad je sređena daje nove mogućnosti. Već imamo prostorije/pogled: Kuhinja, Kafana, Bašta (`js/garden.js`), Špajz (`js/pantry-scene.js`, `pantry-storage.js`), Pijaca; putokazi u kuhinji (BAŠTA, KAFANA, ŠPAJZ). Predlog: ★1 kuhinja + kafana; ★2 bašta (zapuštena, zakorovljena); ★3 špajz/podrum (zimnica, kiseli kupus); ★4 letnja bašta/terasa kafane (više stolova); ★5 pekara ili mesara/roštilj kao dozida. Nije dogovoreno ni rađeno.
