# Cookster: šta ide na kartu znanja ("Savkina knjiga")

Odlučeno: crtaš u ChatGPT-u, tri taba, cijena kao kod Waterparka (nekad znanje, nekad novac, nekad oboje), karta se pomjera **horizontalno**.

**Dobra vijest o slikama:** u repou već imaš skoro sve što karti treba (`assets/ui/napredak/drvo/` i `zvezde/`): kartice čvorova (zaključan, otključan, kupljen, označen), cijene (znanje, novac), strelice (obične i zaključane), tri taba, zvezdice (puna, pola, prazna) i katanac sa zvezdicom. Treba samo: **novi tab ako promijeniš ime** (ispod), a zlatnu liniju kapije i opis na lebdenje mogu da napravim kodom.

Sve je prijedlog. Cijene su procjene za podešavanje.

---

## Kako je karta složena

- **Redovi** = lanci istog predmeta u nivoima (npr. Mali tiganj → Bakarni → Veliki). **Kolone** = nivoi po zvezdici.
- **Zlatna linija** ispred svake nove zvezdice; iza nje tamnije polje sa katancem „★N".
- **Početni predmeti** su prva kolona, već kupljeni (zeleno).
- **Karta nema kraj:** poslije ★5 samo nastavlja udesno (zlatni nivo, nove zone).
- Svaki čvor: ikona, naziv, zvezdica koju traži (u uglu), cijena, i opis (jedna rečenica na lebdenje).

## Kako da se zove treći tab

„Održavanje" kod njih znači čišćenje i popravke. Kod nas bi pod njim bilo više stvari, pa preporučujem **„Kuća"**:
- čišćenje (metla, krpe, sudoper), popravke (čekić), bašta, špajz/podrum, uređenje kuće.

**Kafana** ostaje samo za ono što je u lokalu, i tu ulazi i **terasa** (ona je dio kafane, ne treba joj poseban tab).

---

## TAB 1: KUHINJA (posuđe, alati, začini)

| Lanac (red) | Čvorovi (u kolonama po ★) | Napomena |
|---|---|---|
| **Tiganj** | Mali tiganj ✓ → Bakarni tiganj (★2) → Veliki liveni tiganj (★3) → Majstorski tiganj (★4) | veliki postoji u igri; bakarni i majstorski treba nacrtati |
| **Nož** | Nož ✓ → Oštar nož (★2) → Majstorski nož (★3) → Nož za meso (★5) | u igri postoji samo jedan nož; novi nivoi treba nacrtati; nož za meso otvara roštilj |
| **Vangle i šerpe** | Mala vangla ✓ → Srednja vangla ✓ → Velika vangla (★2) → Velika šerpa (★3) → Bakarna šerpa (★4) | vangle i šerpa postoje; bakarna treba nacrtati |
| **Testo i pečenje** | Drvena kašika ✓ → Oklagija (★2) → Okrugli pleh (★3) → Pravougaoni pleh (★3) → Krpa za dizanje testa + kvasac (★4) | sve postoji osim nivoa kašike |
| **Začini i tegle** | So, ulje, biber ✓ → Šećer, lovorov list (★2) → Male i velike tegle (★2) → Mlevena i tucana paprika (★3) | postoje |
| **Sitni pribor** | Ravni tanjir ✓ → Duboki tanjir (★1) → Cediljka (★1) → Oval tanjir (★2) → Posuda za kupus (★3) | postoje |

(Oko 25 čvorova. Za prvo izdanje dovoljno je 10–12, ostalo se dodaje kasnije.)

## TAB 2: KAFANA (lokal, gosti, pića, terasa)

| Lanac (red) | Čvorovi | Napomena |
|---|---|---|
| **Šank i sala** | Popravi šank (★1, zadatak) → Bolji šank (★3) → Dugi šank (★5) | porušena kafana + čekić, fale slike |
| **Stolovi i stolice** | 2 stola ✓ (nakon popravke) → 4 stola (★2) → 6 stolova (★3) → **Terasa: stolovi i suncobrani** (★4) → Velika terasa (★5) | slike stolova i terase treba nacrtati |
| **Pića** | Kafa ✓ → Rakija (★1) → Crno i belo vino (★1) → Soda i špricer (★2) → Vinska karta (★4) | postoje flaše i čaše |
| **Jelovnik** | 3 jela na jelovniku ✓ → 5 jela (★2) → 8 jela (★3) → 12 jela (★4) | količina jela koje gost može da naruči |
| **Posluživanje** | Zvonce i papirići ✓ → Servirni sto (★2) → Lijepi tanjiri/servis (★3) | zvonce i ticket rail postoje |
| **Gosti i ugled** | Kapacitet 6 gostiju ✓ → 10 (★2) → 16 (★3) → 24 (★4) → 36 (★5) | koliko gostiju stane odjednom |
| **Uređenje lokala** | Stona lampa (★2) → Petrolejska lampa (★3) → Cvijeće na stolu (★3) → Tepih i hoklice (★4) | lampe, tepih i hoklica postoje |

## TAB 3: KUĆA (čišćenje, popravke, bašta, špajz, uređenje)

| Lanac (red) | Čvorovi | Napomena |
|---|---|---|
| **Čišćenje** | Metla ✓ → Bolja metla (★2) → Brza krpa (★3) → Brže pranje u sudoperi (★4) | brže čišćenje daje više bodova |
| **Popravke** | Čekić ✓ → Jači čekić (★2) → Veliki čekić (★3) | brže popravljanje, vezano za kafanu i terasu |
| **Smeće** | Korpa za otpatke ✓ → Veća korpa (★2) → Kontejner (★4) | korpa postoji |
| **Bašta** | Zalivka (★2, bašta) → Gredice (★2) → Novi usjevi (★3) → Staklenik (★5) | bašta se otvara sa ★2 |
| **Špajz i podrum** | Police u špajzu (★3, špajz) → Bačve za kiseljenje (★3) → Zimnica (★4) → Podrum veliki (★5) | bačve postoje |
| **Uređenje kuće** | Etno tepih (★3) → Stona lampa (★3) → Slike na zidu (★4) → Opanci i čutura kao ukras (★5) | tepih, lampe, opanci, čutura postoje |

---

## Cijene (prijedlog pravila, da se lako podešava)

- **Znanje:** 4–8 za prve čvorove, 12–20 za sredinu, 30+ za zadnje.
- **Novac:** 150–600 prva tri nivoa, 1000–3000 kasnije.
- Nekad samo znanje (npr. oštar nož), nekad samo novac (dekoracija), nekad oboje (posuđe), kao kod njih.
- **Svaki sljedeći čvor u lancu je otprilike duplo skuplji.**

## Pravila da karta ne zaglavi igrača

1. Čvor na karti smije tražiti samo čvor koji je **ispred njega u istom redu** ili čvor sa **vidljivom strelicom**.
2. Zadaci iz liste („5 jela prestiža 2+") traže samo ono što je već na karti i otključivo.
3. Zaključan čvor u opisu piše **šta mu fali** („traži ★3 i Oštar nož").

## Šta se crta (ako uopšte nešto)

- **Tab „Kuća"** (aktivan i neaktivan), ako promijenimo ime iz „Održavanje".
- Nove ilustracije za predmete koji ne postoje: bakarni tiganj, bakarna šerpa, majstorski tiganj, novi nivoi noža, stolovi i terasa, šank, staklenik. To nisu dijelovi karte nego predmeti, rade se i inače.

## Odluke koje su tvoje

1. **Treći tab „Kuća"** i terasa unutar „Kafane"?
2. **Prvo izdanje karte:** 10–12 čvorova po tabu, a ostalo kasnije?
3. **Lanci (redovi)** koje sam napisao: nešto da izbacim ili dodam?
4. **Kapacitet gostiju po ★** (6, 10, 16, 24, 36): da li ti se sviđa?
5. Da li želiš da **karta počne sa Kuhinjom** (prvi tab), jer je prvih 15 minuta u kuhinji?
