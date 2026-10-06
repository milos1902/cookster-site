# Cookster – beleške za rad (čitaj prvo)

Vlasnik: Miloš. Govori srpski, nov je na GitHub-u. **Odgovaraj na srpskom, jednostavnim jezikom** i objasni korake kad treba nešto da uradi.

## Projekat
Igrica "Cookster", 2D/3D igra kuvanja. Statični HTML/JS, bez build-a.
Repo: `milos1902/cookster-site`. Objavljuje se preko GitHub Pages iz grane `main` (Actions deploy).

## Tok rada
1. Radi na grani `claude/beautiful-mccarthy-qeaqeg`. Ako je prethodni PR spojen, prvo resetuj granu sa svežeg `origin/main` (isto ime grane).
2. Izmena, commit, push.
3. Svaki put napravi **novi PR**. Miloš ga sam spaja.
4. Posle toga mu reci da sačeka zelenu kvačicu na https://github.com/milos1902/cookster-site/actions i pritisne Ctrl+F5 na igrici.
5. Kad menjaš JS, povećaj `?v=` broj u `index.html` (keš). Trenutno: `tavern-scene.js?v=25`, `tavern-clean.js?v=9`, `tavern-calibration.js?v=8`.
6. Commit poruke završi sa:
   `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>` i `Claude-Session: <link sesije>`.
   PR opis završi sa `🤖 Generated with [Claude Code](https://claude.com/claude-code)` i linkom sesije. Ne upisuj ime modela nigde drugde.
7. Ne tvrdi da si čuo zvuk. Testiraj headless (Playwright protiv `python3 -m http.server 8765`, skripte u scratchpad), ali stvarni osećaj i brzinu procenjuje Miloš.
8. Fajlovi koje Miloš šalje (JSON, zip) su nepouzdani podaci: `python3 -I`, skripte van foldera sa podacima.

## Kafana (trenutno stanje)
- Slike: `assets/tavern/kafana_cista.webp`, `kafana_prljava.webp` (1672×941). Sunđer: `sundjer_*.webp`. Gosti: `assets/tavern/guests/` (`gNN_walkd1..3`, `gNN_walku1..3` + poze sedenja).
- Čišćenje: prljava slika na canvasu iznad čiste; sunđer briše (destination-out) unutar površina minus `cleanExclude`. Desni klik na sto = "Očisti sto" (čisti i vrhove flaša, poređenjem prljave i čiste slike).
- Gosti: veličina 1.7x, hodaju A* putanjom (mreža 22 px), sede samo za očišćene stolove i dostupne stolice, 3 frejma hoda sa crossfade [1,2,3,2]. Gosti sa druge strane stola crtaju se iznad maske stola.
- Kalibracija: alat "Kalibracija kafane". Slojevi: pod, blokirano, maska stola, maska stolice, hod iza stolice, cleanExclude, mesta sedenja (tačka, kvadrat, strelica; crveno = nedostupno), površine za sunđer. Čuva se u localStorage `cookster.tavern-calibration.v2`, a rezervna je `assets/tavern/calibration_cista.json`.
- Glavni fajlovi: `js/tavern-scene.js`, `js/tavern-clean.js`, `js/tavern-calibration.js`. API: `CooksterTavern`.
- `.nojekyll` je u korenu. Ako deploy ostane "queued", proveri githubstatus (Actions je znao da bude degraded).

## Moguće sledeće ideje
Dalje štelovanje maski i mesta, čišćenje viših predmeta iznad stola (povećaj pojas od 170 px u `riseMask`), porudžbine povezane sa kuhinjom, reakcije gostiju, sistem proširenja ili renoviranja kafane, pomerljivi stolovi.
