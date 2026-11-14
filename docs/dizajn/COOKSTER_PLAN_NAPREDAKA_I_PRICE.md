# Cookster: plan napretka (iz Waterpark Simulatora) + priča + zadržavanje igrača

Pročitao sam `HANDOFF.md`, `docs/PRENOS.md`, `docs/PRENOS_NOVI_CHAT.md` i `docs/PRICA.md`. Tamo je već zapisan sav razgovor o Waterpark Simulatoru: zvezdice, lista zadataka, bodovi, čekić i porušena kafana, otključavanje prostorija, drvo napretka, proširen izvještaj dana, tempo zvezdica. **Ništa od toga još nije urađeno** (u dokumentima piše „Nije rađeno").

Šta ne znam: Waterpark Simulator nikad nisam vidio uživo. Znam ga samo iz tvojih opisa i snimaka u `HANDOFF.md`. Ni Cookster nisam igrao kao igrač.

Šta je dobra vijest: **slike za ovo već postoje u repou** (`assets/ui/napredak/`: zvezde 9, zadaci 11, izvještaj 10, drvo 14, kafana 6, poruke 4). Prvi dio se može napraviti bez novih slika.

---

## 1. Zašto je Waterpark model dobar za zadržavanje

Taj model ima ono što smo u pregledu tražili, a Cookster nema:
- **Vidljiv cilj:** zvezdice i lista zadataka („Put do druge zvezdice").
- **Mali razlog za sutra:** svaki dan novi zadaci i mala otključavanja (tanjir, začin, gost).
- **Svrha novca:** bodovi za trošenje i drvo napretka.
- **Nema čekanja:** zvezdice ne zavise od vremena nego od urađenih zadataka (već je tako dogovoreno).

## 2. Kako se to spaja sa pričom (jedna ideja koja drži sve)

Dva napretka, **jedan pokreće drugi**:
- **Spoljašnji:** kafana raste (zvezdice, prostorije, drvo).
- **Unutrašnji:** knjiga se popunjava (stranice, istraga, Putnik).

**Svaka zvezdica otvara jedan dio priče:**

| Zvezdica | Tempo | Prostorija (već dogovoreno) | Priča |
|---|---|---|---|
| ★1 | 2–3 dana igre | kuhinja + kafana (čekić, popravka) | stranica 1: pogača sa čvarcima; prvi znak kredom |
| ★2 | ~7 dana | bašta (zapuštena) | stranica 2: sataraš (trag samo poslije kiše) |
| ★3 | ~15 dana | špajz/podrum | stranica 3: kiseli kupus (bure sa bravom) |
| ★4 | ~30 dana | letnja terasa kafane | Selo: stranice 4–6 (ajvar, kafa, roštilj); **Putnik prvi put dolazi u kafanu** |
| ★5 | ~60 dana | pekara ili roštilj | stranica 7 „za unuka", stranica 8 prazna (igrač kuva svoje jelo), kraj |

Tako čekić i zapuštena prostorija nisu „posao", nego **mjesto priče**: u zapuštenoj bašti je stranica, a igrač je nađe tek kad je sredi.

## 3. Priča (kratko; cijela je u prethodnom fajlu)
- **Putnik je Savkin sin, unukov otac**, koji traži pismo oprosta. Doživljava se kao prijetnja, a traži isto što i igrač.
- U `HANDOFF` piše da su tekstovi razgovora još napisani kao da je baka krila stranice. Treba ih **prepraviti da govore o Putniku**. To je prvi posao na priči.
- Motivi: „Sve što je važno ostaje u toplom", šešir i kreda, tepih petkom, pogača „za Radovana".
- Tri kraja ostaju: potraga, selo, podjela.

## 4. Dnevni ritam (zadržavanje iz Waterparka + moje)
Svaki dan:
1. **Glavni zadatak** sa brojačem (posluži 10 gostiju).
2. **2–3 dnevna zadatka** (jelo dana, očisti 2 stola, skuvaj kafu).
3. **Jedno malo otključavanje** (poluzvezdica): tanjir, začin, dekoracija, savjet ili novi gost.
4. **Kraj dana:** izvještaj (ugled u zvezdicama, zadovoljstvo, dobre i loše recenzije, bakšiš) i **posljednji red: otvoreno pitanje** („Mileva je vidjela znak kredom na kapiji. Sjutra provjeri.").

Gosti su likovi (Mileva, Stojan, Mića, Ljubica, Radovan, Stana, Vukašin, Smilja): svaki ima jelo koje voli i uspomenu o Savki koju otkrije poslije trećeg pogođenog jela.

## 5. Šta ne raditi
- Nema tajmera čekanja ni energije koja se troši.
- Nema kazne za propušten dan.
- Zvezdica ne smije biti teško dostižna preko mjere (kod Waterparka su teške, a tvoj zahtjev je da ★1 ide brzo: 2–3 dana).

## 6. Redoslijed pravljenja (svaki dio u svom PR-u)

| # | Šta | Slike |
|---|---|---|
| 1 | **Zvezdice + lista zadataka gore desno** (glavni sa brojačem, dnevni), bodovi ugleda | postoje |
| 2 | **Proširen izvještaj dana** + „otvoreno pitanje" | postoje |
| 3 | **Prepraviti razgovore** (Putnik umjesto bake koja krije) | nisu potrebne |
| 4 | **Traka „Stranice 1/8"** + trenutak nagrade kad se stranica nađe | djelimično |
| 5 | **Čekić + porušena kafana** (početak igre, ★1) | fale slike polomljenih stolova i šanka |
| 6 | **Drvo napretka** (Savkina knjiga: Kuhinja, Kafana, Održavanje) | postoje |
| 7 | **Nove prostorije** (bašta, podrum, terasa) po zvezdicama | fale slike |
| 8 | **Stranice 2 i 3** + znak kredom ujutro | — |

Prvi paket (1 + 2 + 3) ne traži nijednu novu sliku i daje igri cilj, razlog da se vrati i priču koja ima smisla.

## 7. Odluke koje su tvoje
1. **Putnik je Savkin sin (B)?** Da li ti ta priča odgovara?
2. **8 stranica** u prvom izdanju?
3. **Zvezdica ↔ stranica** kao u tabeli iznad (jedno otvara drugo)?
4. **Koliko udaraca čekića** po predmetu i da li popravka košta novac ili materijal (već otvoreno pitanje u dokumentima)?
5. **Počinjemo od prvog paketa** (zvezdice + lista zadataka + izvještaj)?
