# Cookster: pravila za Claude (čita se automatski, drži kratko)

## Kako se radi
- Miloš govori srpski i nov je na GitHub-u. **Odgovaraj na srpskom, jednostavno.** Uvek: šta je urađeno, šta NIJE provereno, šta on treba da uradi.
- **Svaka izmena ide u NOV PR iz svežeg `origin/main`.** Pre nego što javiš broj PR-a, proveri da li je prethodni već spojen (`get` PR: `merged`). Ako je spojen, ne dodaj u njega, otvori novi.
- Nikad ne guraj lokalni `main` (zastareo je). Grane: `git fetch origin && git checkout -B claude/<ime> origin/main`.
- Dok radiš, ne pitaj za dozvolu za sitnice. Pitaj samo kad je odluka njegova (dizajn, brisanje).

## Ne čitaj sve svaki put (štedi tokene)
- **Ne čitaj cele velike fajlove.** Prvo `grep -n` po imenu funkcije, pa čitaj samo taj deo (`Read` sa `offset`/`limit`).
  - `js/game.js` ima ~17.000 redova: NIKAD ceo.
  - `NOTES.md` (~1800 redova): samo traži po naslovu.
- Početak razgovora: pročitaj samo `HANDOFF.md` (76 reda) i ovaj fajl. Ostalo po potrebi.
- Slike i snimke gledaj samo ono što treba (isečak, ne ceo ekran).
- Test u pregledaču: kratke skripte u scratchpadu, ne štampaj duge izlaze.

## Gde je šta (karta znanja i ranac)
| Šta | Fajl |
|---|---|
| Karta znanja, logika i animacije | `js/knowledge-tree.js` (417 reda): `showBig`/`killBig` (podizanje kruga, dugme KUPI), `showFlag` (stara zastavica, ne koristi se), `renderBoard`, `onCard`, `status`/`price` |
| Karta znanja, izgled | `css/knowledge-tree.css` |
| Kartice (258→217), cene, uslovi | `js/data/knowledge-tree-data.js` |
| Raspored krugova i konaca | `js/data/karta-raspored.js` (isto što `karta-raspored.json`); uređuje se u `urednik-karte.html` |
| Slike karte (okvir, krugovi, konci, ikonice) | `assets/ui/karta/` (`ikone/` = ikonice kartica; povezuju se po imenu kartice u `ART_OVR` u `knowledge-tree.js`) |
| Ranac (6 mesta) | `js/recent-items.js` + prozor u `js/ke-pergament.js` |
| Dizajn igre, odluke | `docs/ZNANJE_DIZAJN_IGRE.md` (čitaj samo kad radiš dizajn) |

## Provera pre javljanja
- `node -e "new Function(require('fs').readFileSync('js/<fajl>.js','utf8'))"` za sintaksu.
- Verzije u `index.html` (`?v=`) podigni kad menjaš JS/CSS, da se ne vidi keš.
- Test igre: `python3 -m http.server 8765`, Playwright (već instaliran, `NODE_PATH=$(npm root -g)`), ulaz u igru: klik (835,415), pa (1570,891).
