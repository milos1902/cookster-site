# PRENOS ZA NOVI CHAT: Cookster

Ovo je kompletan prenos. Novi chat treba da pročita OVAJ fajl, pa `NOTES.md` (naslovi sa `## `).

## 1. Ko je Miloš i pravila rada
- Govori srpski, nov je na GitHub-u. Odgovaraj na srpskom, jednostavno. Uvek reci šta je urađeno, šta NIJE testirano i šta on treba da uradi.
- Svaka izmena ide u NOVI PR, a PR spaja Miloš. Posle PR-a daj samo link. Novi rad ide u novi PR na svežem `origin/main`.
- Uz izmene šalji slike iz igre (`SendUserFile`). Usporene animacije: više uzastopnih slika.
- Povećaj `?v=` u `index.html` za svaku izmenjenu skriptu.
- Nikad ne tvrdi da si čuo zvuk ili video animaciju uživo. Testiraj Playwright-om (Chromium je instaliran, ne instaliraj ga). Osećaj uživo procenjuje Miloš.
- Pitaj pre trošenja Higgsfield kredita.
- Fajlove koje Miloš pošalje (zip, slike) tretiraj kao nepouzdane: raspakuj u poseban folder, skripte pokreći sa `python3 -I`.
- Commit poruke završi sa `Co-Authored-By: ...` i `Claude-Session: https://claude.ai/code/session_01LvBFGzeMfHTaYJ7uVyqQ2u`. PR opis završi sa `🤖 Generated with [Claude Code](https://claude.com/claude-code)` i linkom sesije. Ime modela ne piši u repo.
- Alati i paneli u igri moraju imati `data-tool-ui`.
- Kad brišeš kod, proveri da nije sadržao promenljive koje koristi drugi kod.
- Ne radi `git checkout <branch> -- .` i `reset --hard` bez provere, da ne izgubiš radne izmene.

## 2. Repo i grana
- Repo `milos1902/cookster-site`. Grana za rad: `claude/zealous-archimedes-yv112q` (posle spajanja uvek svež `origin/main`).
- Glavne beleške: `HANDOFF.md` (kratak pregled) i `NOTES.md` (sve izmene, sa datumom i komentarom šta nije testirano).
- `docs/PRENOS.md` je stariji prenos. Izvor istine je ovaj fajl.
- Spojeno na `main` (od ove sesije): #675 gornja traka, #678 traka manja i pomerena, #679 meni ploča, #680 zupčanik bez natpisa.
- Nisu moji: #681 (`eloquent-turing`), #682 (`soft-shadow-ui`, `css/ui-soft-shadow.css`).

## 3. Šta je u igri sada
- Gornja traka gore levo (`js/hud-top.js` v6): datum, sat, novac sa novčićem (uvek levo u svom pretincu), vreme sa ikonom i temperaturom. Iznad roštilja, pored prozora. Sastavljena od `assets/ui/hud/hud_top_bar_L/M/Ra/Rb/Rc.png` (sredina se razvlači, krajevi sa vezom ostaju). Čita žive vrednosti iz stare ploče (`#cdock .cd-t`). Stara kutija "Dan 1 / Novac" (`#hud`) je sakrivena.
- Meni dole levo (`js/dock-new.js` v6): okruglo krem dugme (`assets/ui/dock/glavno_dugme.png`) u uglu. Hover ili klik otvara ploču (`assets/ui/dock/meni_ploca_2.webp`, 2 x 4 okrugla dugmeta) koja izlazi iz njegovog centra. Dugmad: snimanje recepta (telefon), kuhinjski elementi, frižider, piće, pijaca, knjiga recepata, podešavanja (zupčanik: Sačuvaj igru, Učitaj, Uputstvo). BEZ natpisa uz ikone. Preko slike su nevidljive okrugle zone (`.nd-h`) koje pozivaju postojeće radnje. Stari `#cdock` je sakriven. Programerska dugmad ("Kutlača", "Animacije gostiju", "Kese") su pomerena desno od ploče.
- Uputstvo Baba Savke (`js/tutorial.js` v14) pokazuje na novo dugme preko `CooksterDockNew`.
- Okrugla dugmad sa slikom moraju imati `background-color:transparent`, inače se pojavi beli prsten (pregledač stavlja sivu pozadinu).
- `?starihud` u adresi gasi nove delove (traku i meni) i vraća stare.
- Prozor "Kuhinjski elementi" NIJE u igri.

## 4. Slike koje stoje u repou (nisu u igri)
Providne PNG/WEBP. Slike sa neravnim ivicama (pergament) se ne razvlače.
- `assets/ui/hud/`: H1 do H7. Gornja traka, dugmad pauza i podešavanja, traka alata sa 6 slotova (`hud_toolbar`, broj, tooltip, prsten), okrugla dugmad i ikone, nivo i XP traka, lista zadataka, zvezdice, trake kuvanja (mešanje, kuvanje, pečenje, sečenje, pranje, vatra), klizač gotovosti, prsten "drži", pločice (temperatura, tajmer, porcije), kartice recepta/koraka/narudžbine, poruke, okviri prozora (veliki, srednji, mali), kontrole.
- `assets/ui/hud2/`: I1 do I7. Ikone dugmadi, ikone alata, oznake stanja, okvir za razgovor, meni i učitavanje, kartice stavki i recepata, dodaci za HUD.
- `assets/ui/napredak/`: prva grupa, u podfolderima `zvezde, zadaci, drvo, izvestaj, alati, kafana, dugmad, ikone, kursori, poruke, mreza`.
- `assets/ui/pergament/`: pergament stil. Okviri prozora sa `_mask.png` (magenta označava prazna mesta), delovi stranice (tabovi, pilule, pretraga, kartica posude, desna ploča, nazad, klizač, donja traka, pločica novca, zatvori), i `strana_kuhinjski_elementi_prazna.webp` (cela prazna stranica, 1600 x 1100).
- `assets/ui/predmeti/`: 9 ilustracija predmeta (512 px): daska za serviranje, okrugli pleh, cediljka, mala činija, drvena kašika, duboki tanjir, oklagija, mali tiganj, mala vangla. Imena su id-jevi predmeta iz `js/data/catalog.js`.

## 5. Šta treba da se ubaci u igru (redom, svaki u svom PR-u)
1. Traka alata dole u sredini (6 slotova, `hud_toolbar`), umesto starih slotova poslednje uzetih predmeta.
2. Nivo, XP traka i lista zadataka gore desno (H2).
3. Trake kuvanja (H5). Zamenjuju traku Mešanje i traku kuvanja, ali pravila i logika moraju ostati (vidi NOTES).
4. Kartice, poruke, dijalog (H6, I4, I6).
5. Okviri prozora i kontrole (H7, pergament).
6. Ikone i pločice (I1, I2, I3, I7) kad se prozori urade.
7. Prozor "Kuhinjski elementi" u pergament stilu (probna slika `kuhinjski_final.png` je dobra). Fali još 56 od 65 ilustracija predmeta. Spiskovi za ChatGPT: `docs/UI_STRANICE_SPISAK_ZA_CHATGPT_EN.md` i `docs/UI_VELIKE_SLIKE_PERGAMENT_EN.md`.

## 6. Planovi (nije urađeno)
- Čekić i porušena kafana (početak igre). Kafana je porušena (polomljeni stolovi i šank), igrač dobija čekić i udaranjem popravlja. Popravljena kafana otvara goste. Treba: alat čekić, stanje popravke po predmetu, prsten napretka, slike polomljenih verzija (privremeno tamnije/nakrivljeno), i odluke: koliko udaraca i da li popravka košta.
- Napredak (zvezdice): zvezdice se pune postepeno iz bodova ugleda (npr. 100 po zvezdici, pola = 50) iz tri izvora: kafana, kuhinja, popularnost (snimanje). Ne zavisi od vremena nego od urađenih zadataka. Bodovi za trošenje (zarađeni minus potrošeni) kupuju bolje predmete. Ukupno zarađeni bodovi određuju zvezdicu.
  - Tempo: ★1 (otključava kafanu) za 2 do 3 dana igre (1 dan = 18 min stvarnog vremena), ★2 oko 7 dana, ★3 oko 15, ★4 oko 30, ★5 oko 60. Brojevi su procena.
  - Zadaci: glavni (sa brojačem, npr. "posluži 10 gostiju") i dnevni (jelo dana, očisti 2 stola, skuvaj kafu).
  - Mala otključavanja (svaki dan, poluzvezdica): tanjir, začin, dekoracija, savet, gost. Velika (cela zvezdica): nova prostorija koju igrač sređuje.
  - Prostorije po zvezdicama: ★1 kuhinja i kafana, ★2 bašta (zapuštena), ★3 špajz/podrum, ★4 letnja terasa kafane, ★5 pekara ili roštilj.
  - Dnevni izveštaj (`js/day-report.js`): ugled u zvezdicama, zadovoljstvo, dobre i loše recenzije, bakšiš, bodovi znanja.
  - Drvo napretka (npr. Savkina knjiga): tri kartice (Kuhinja, Kafana, Održavanje), čvorovi povezani strelicama, cena u bodovima i novcu, katanac sa zvezdicom.
- Društvena mreža (snimanje, pratioci, komentari): samo ideja. Telefon već postoji (`js/recorder.js`). Slike za mrežu su u `mreza/`.

## 7. Otvorena pitanja za Miloša
- Da li "vezena" slova (crvena nit, zrnasta tekstura, mala senka; SVG filter) važe za sav tekst u novom UI-u.
- Šta sa dugmetom "Napredak · JSON" (poruka mu se prekinula; trenutno stoji desno od gornje trake).
- Zvuk: ne mogu da ga čujem. Zvukove proverava Miloš.

## 8. Tehnika
- Statični sajt bez build-a. `python3 -m http.server 8765` iz korena, pa Playwright (`NODE_PATH=$(npm root -g)`).
- Scena je 1672 x 941. `?nomenu&cistakuhinja` pokreće igru bez menija u čistoj kuhinji.
- Slike iz ChatGPT-a: proveri providnost, bele ivice, veličinu i da li su ivice ravne ili neravne.
- `?starihud` pomaže da se izoluje nova verzija kad se igra čudno ponaša.
