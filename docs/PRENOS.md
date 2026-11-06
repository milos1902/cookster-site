# Prenos u novi chat (Cookster)

Ovo pročitaj prvo, pa `NOTES.md`, pa `docs/PRICA.md`.

## Ko je korisnik i kako radimo
- Miloš, govori srpski (latinica). Odgovaraj **jednostavnim srpskim**, kratko. Glasovne poruke su mu često presečene ili pogrešno prepoznate: napiši kako si ih razumeo.
- Igra: https://milos1902.github.io/cookster-site/ (statični HTML/JS, repo `milos1902/cookster-site`). Razvoj na grani `claude/exciting-faraday-jhjhcg`.
- **Tok posle svake izmene:** commit, `git fetch origin main && git rebase origin/main`, `git push -f -q -u origin claude/exciting-faraday-jhjhcg`. **Prvo proveri stanje prethodnog PR-a** (spojen: napravi novi PR; otvoren: dodaje se u njega). Miloš spaja PR-ove u sekundi. Link igrice šalji samo kad ga traži, uz napomenu koji PR mora prvo da se spoji.
- **Higgsfield (krediti):** ništa ne pokreći bez izričitog „pokreni". Prvo prikaži cenu. Jedan klip po jedan. „Svaka tvoja greška mene košta."
- Ne budi ulizica: traži da kažeš svoj sud i da odlučuješ. Ne ponavljaj samo ono što je rekao kad traži da ti smisliš.
- Sam crta slike u ChatGPT-u i šalje mi ih u chat. Prompti za slike: engleski, ugao kamere **oko 55° odozgo** (izmereno iz tiganja), providna pozadina, bez senke, svetlo gore levo, ceo predmet vidljiv sa marginom.
- Test lokalno: `python3 -m http.server 8123` (umre između komandi, pokreni ponovo), Playwright sa `executable_path='/opt/pw-browsers/chromium'`. Primer za sud sa hranom: scratchpad skripte `pan.js`/`pan2.js` (spawnKitchenEquipment, CooksterPan.write, rememberPanIngredientMeta).

## Šta je urađeno u poslednjem delu
- **Istraga** (`js/istraga.js`, v5): desni klik na gosta u kafani, „Pitaj gosta", razgovori bez zagonetki. Lanac: Stojan, Mileva, Radovan (tepih petkom), ćilim daje pola recepta, Mića, Ljubica (šporet, pepeo), cela stranica „Savkin gulaš". Priča u `docs/PRICA.md` (Putnik je ukrao stranice; tekstovi razgovora još pričaju kao da je baka krila, **treba ih prepraviti** da govore o Putniku).
- **Jutarnje porudžbine** (`pickOrderKeys` u `tavern-scene.js`): 6:00 do 11:00 uglavnom kafa i rakija.
- **Kuvanje kafe** (`js/kafa.js`): džezva + voda + posuda za kafu (`kafa_mlevena`) + šporet, pena, šoljice (`pice_solja_kafa`, `pice_solja_kafa_prazna`). Za sada panel sa dugmadima; Miloš hoće **kašiku** (uzmi iz posude, sipaj u džezvu) umesto dugmeta „Dodaj kafu". Kvalitet kafe ne utiče na gosta. Poslužavnik **ne** pravimo.
- **Hrana u posudi** (`js/piece-sim.js` v34): cela okrugla gomila blizu dna (PR 507).
- Džezva je dodata u `ownedKitchenEquipment`.

## Plan (moja preporuka, Miloš se složio sa pravcem)
1. Jedna petlja: **dan u kafani** (jutro kafa i rakija, podne jela, veče vino), dugme „Završi dan" i pregled dana. **GOTOVO** (`js/day-report.js`).
2. Prvi dan kao vodič (jedna stvar odjednom), jedna rečenica cilja gore.
3. Kvalitet jela/kafe utiče na gosta (napojnica, ugled).
4. Priča po danima: jedan trag dnevno.
5. Proba sa 3-5 novih ljudi.
6. Tek onda mapa sela, nove priče, novi recepti.
- Mapa celog sela je ideja (razne priče, teže nalaženje recepata); Miloš sam crta u ChatGPT-u (prompt je dat), čeka se slika.

## MESO (u toku, samo slike, logike još nema)
Izvorne slike su u `assets/meat_src/` (sirove iz ChatGPT-a, providne pozadine, treba ih iseći/obraditi pri ubacivanju):
`junetina_parce`, `svinjetina_parce`, `susenica_rebra`, `susenica_valjak`, `junetina_snicla_tanka/debela`, `svinjetina_snicla_tanka/debela`, `junetina_komadi_1`, `svinjetina_komadi_1/2` (po 3 komada u jednoj slici, seći ih), `mleveno_kesa`, `mleveno_gomila`, `mleveno_zacinjeno`, `tex_mleveno_sirovo`, `tex_pecenje`.
**Odluke:**
- Jedna šnicla po slici, igra je ponavlja. **Debljina šnicle zavisi od razmaka reza** (mali razmak = tanka slika, veliki = debela). Komad mesa se smanjuje za isečeno.
- Kockice: komadi iz slika se ponavljaju (nasumično okrenuti) kroz isti sistem kao seckano povrće (`piece-sim.js`, atlasi).
- Mleveno meso: u kesi (kupuje se), prospe se, **igrač sam oblikuje pljeskavice (pritiskanje) i ćevape (valjanje)**. Osnova može biti `js/dough-mesh.js`. Ima i mlin za meso (`mlin_za_mesо`). Teksture za oblikovano meso: sirovo, pečeno (rđasto, treba tamniju braon), tragovi roštilja i zagoreno (fale).
- Još fali: tragovi roštilja (overlay), zagoreno, isečena šušenica (kolutovi/komadi), skuvane verzije šnicle i komada, piletina (cela, batak, pečena), slanina, kobasica, drugo parče junetine u komadima (za raznolikost).
- Pre ubacivanja proveriti providnost i izrezati sa marginom.

## Otvorena pitanja
- Kalibracija scene: Miloš treba da pošalje „Kopiraj sve" iz alata, da uklonimo ručne poligone za čišćenje kuhinje.
- Intro: Suno muzika, ekran pisma, treptaj/kapci, muzika glavnog menija.
- Opcionalno: razbijanje `game.js` (16.000 redova) na delove, čekao je „go".
