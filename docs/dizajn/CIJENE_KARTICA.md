# Cijene kartica: kriva troškova (Game Balance Concepts)

Do sada su cijene kartica bile **procijenjene na oko**. Sada se **računaju**. Metoda je iz besplatnog kursa Iana Schreibera (Game Balance Concepts, nivo 3): svaka kartica ima **korist** i **cijenu**, a cilj je da budu usklađene. Ako je korist veća od cijene, kartica je „iznad krive" (prejaka), ako je manja, „ispod krive" (preslaba). Sve se izražava u jednoj jedinici: **dinar-ekvivalent (DE)**.

Cijene su u `js/data/knowledge-tree-data.js` (polja `z` znanje, `d` novac), a pregled svih kartica je u `docs/dizajn/KARTICE_ZNANJA.md`.

**Važno:** ovo je **model sa pretpostavkama** (naročito o zaradi po danu). Nije mjereno u igri. Brojke treba ispraviti kad budemo imali stvarne podatke o zaradi.

---

## 1. Kako se računa

**Korist (V)** je koliko učinak kartice vredi u DE:
- **Nivo nadogradnje (L) sa procentom:** `V = procenat × težina učinka × 20 × G(★)`. Težina učinka (koliko vredi 1%): brzina radnje (sečenje, prženje, čišćenje, pranje, čekić) = 1,0; vatra traje duže = 0,9; mlevenje mesa i berba = 0,8; svežina namirnica = 1,0; cenjkanje na pijaci = 2,0; **cene jela = 3,0**; bakšiš = 2,5; reklama = 2,5; strpljenje gostiju = 1,2; ambijent = 2,0; jeftinije popravke = 1,5; prinos bašte = 1,5.
- **Nivo sa jedinicama (L):** `V = broj jedinica × vrednost jedinice × G(★)`. Jedinica: +1 porcija u posudi = 250; +1 gost = 150; +1 jelo na jelovniku = 200; +1 mesto u rancu = 250; +1 predmet u špajzu = 15.
- **Kumulativni nivoi:** „+15%, +30%, +45%, +60%" znači da je korist nivoa 2 samo **prirast** (+15 prema nivou 1), a ne cijeli iznos. Isto za kapacitete.
- **Nivoi jela (u tabu Recepti):** nisu kumulativni (nivo 2 = bolja ocjena, 3 = viša cijena, 4 = +1 prestiž), a jedno jelo je samo dio prihoda, pa vrijedi **0,3** od iznosa.
- **Novi predmet ili jelo (N):** osnova po zvezdici: ★1 = 300, ★2 = 700, ★3 = 1.500, ★4 = 3.000, ★5 = 5.500. Dodaje se: **+600 za „+1 prestiž"**, **+1.200 za „+2 prestiža"**, plus procenat brzine ako ga ima.
- **Posebno (P)** = N × 1,8. **Osoblje (S)** = N × 2,5. **Pomoć igraču (Q)** = N × 1,2.

**G(★) = zarada po danu na toj zvezdici ÷ zarada na ★2.** Učinak od +10% vredi više kad igrač zarađuje više. Pretpostavljena zarada po danu igre (DE): ★1 = 1.500, ★2 = 3.000, ★3 = 6.000, ★4 = 12.000, ★5 = 24.000. Dakle G = 0,5 / 1 / 2 / 4 / 8.

**Cijena (C) = V × M(★) × T(n)**
- **M(★)** = faktor darežljivosti: ★1 = 0,6, ★2 = 0,8, ★3 = 1,0, ★4 = 1,15, ★5 = 1,3. **Na početku daj više, kasnije strože** (GDKeys: izvori i potrošači, previše darežljivo ili previše škrto ubija motivaciju).
- **T(n)** = **trougaona kriva** za nivoe: nivo 1 = ×1, 2 = ×1,5, 3 = ×2, 4 = ×2,5 (Schreiber: eksponencijalna je opasna, trougaona raste sporije).
- Minimum 100 DE po kartici.

**Podjela cijene na znanje i novac:** 1 znanje = **200 DE**. Kartica koja traži samo znanje, samo novac, ili oba (kod oba: **35% znanje**, ostalo novac). Znanje po kartici ima **gornju granicu** po zvezdici (★1 = 5, ★2 = 8, ★3 = 12, ★4 = 16, ★5 = 24), jer se zarađuje samo radom i ne smije da raste kao novac; višak se plaća novcem.

## 2. Provjera: koliko dana treba da se kupi cijeli odjeljak

Pretpostavljena zarada: novac po danu kao gore, **znanje po danu: 6 / 10 / 16 / 25 / 40** (po zvezdici). Brojke važe za sva četiri taba zajedno.

| Zvezdica | Kartica | Novac ukupno | Dana (novac) | Znanje ukupno | Dana (znanje) |
|---|---|---|---|---|---|
| ★1 | 38 | 1.950 | 1.3 | 15 | 2.5 |
| ★2 | 52 | 16.100 | 5.4 | 46 | 4.6 |
| ★3 | 48 | 41.200 | 6.9 | 137 | 8.6 |
| ★4 | 48 | 117.850 | 9.8 | 294 | 11.8 |
| ★5 | 48 | 360.000 | 15.0 | 837 | 20.9 |

Cilj je da su dani za novac i znanje slični (da jedno od njih ne bude uzak grlo) i da rastu **postepeno** (a ne skokovito). To sada otprilike važi: ★1 je jeftin, ★5 je veliki potrošač novca (kao Park Size Level 6 kod Waterparka).

## 3. Primjeri (nova cijena prema staroj)

| Kartica | ★ | Vrijednost (V) | Nova cijena | Stara cijena (procjena) |
|---|---|---|---|---|
| Brže sečenje 1 | ★1 | 150 | 1 ✦ + 0 дин | 4 ✦ + 0 дин |
| Brže sečenje 4 | ★4 | 1200 | 6 ✦ + 2.250 дин | 19 ✦ + 5.200 дин |
| Bakarni tiganj | ★2 | 1600 | 2 ✦ + 900 дин | 6 ✦ + 500 дин |
| Oštar nož | ★2 | 1000 | 1 ✦ + 600 дин | 6 ✦ + 500 дин |
| Veći kapacitet 1 | ★2 | 250 | 1 ✦ + 0 дин | 6 ✦ + 0 дин |
| Veći kapacitet 4 | ★5 | 2000 | 11 ✦ + 4.300 дин | 26 ✦ + 13.800 дин |
| Cene jela 1 | ★2 | 480 | 2 ✦ + 0 дин | 8 ✦ + 0 дин |
| Cene jela 4 | ★5 | 3840 | 22 ✦ + 8.100 дин | 22 ✦ + 12.000 дин |
| Kapacitet gostiju 2 | ★2 | 900 | 2 ✦ + 700 дин | 7 ✦ + 600 дин |
| Kapacitet gostiju 4 | ★5 | 14400 | 24 ✦ + 42.000 дин | 26 ✦ + 13.800 дин |
| Terasa: stolovi | ★4 | 5400 | 11 ✦ + 4.000 дин | 14 ✦ + 4.000 дин |
| Pomoćnik konobar | ★4 | 7500 | 15 ✦ + 5.600 дин | 14 ✦ + 4.000 дин |
| Roštilj | ★5 | 9900 | 23 ✦ + 8.250 дин | 22 ✦ + 12.000 дин |
| Sataraš 3 | ★3 | 360 | 4 ✦ + 0 дин | 10 ✦ + 0 дин |
| Ajvar 3 | ★5 | 1440 | 19 ✦ + 0 дин | 22 ✦ + 0 дин |

Najveći potrošači novca na kraju su **Kapacitet gostiju 4** (36 gostiju) i **nivoi cijena jela** (jer direktno povećavaju zaradu), što je namjerno.

## 4. Šta ovo ne znači (ograničenja)
- **Zarada po danu je pretpostavka.** Danas u igri jelo košta 300, piće 120, a broj gostiju po danu se mijenja. Prave brojke treba izmjeriti.
- **Težine učinka** (npr. cene jela = 3,0) su procjena i treba ih provjeriti u igri. Svaki učinak mora da se **osjeti** (brzina, kapacitet), inače je kartica samo broj.
- Kartice „Pokaži šta fali", „Označi prljavo" i slične nemaju procenat, pa su vrednovane samo po tabeli osnove (N, P, S, Q).
- Mnogi učinci iz kartica **ne postoje u igri** (vidi stanje u tabeli kartica), pa se cijena ne može provjeriti dok se ne napravi mehanika.

## 5. Šta treba mjeriti kad igra bude imala sistem zadataka
1. **Novac po minuti** i **znanje po minuti** u prvih 15 minuta, pa po zvezdici (iz toga se ispravlja zarada po danu).
2. Koliko dana igrači stvarno čekaju da kupe sljedeću karticu.
3. Da li neka kartica uvijek biva kupljena prva (znači da je ispod krive) ili nikad (iznad krive).

Izvori: [Game Balance Concepts, nivo 3: Transitive Mechanics and Cost Curves](https://gamebalanceconcepts.wordpress.com/2010/07/21/level-3-transitive-mechanics-and-cost-curves/), [nivo 2: Numeric Relationships](https://gamebalanceconcepts.wordpress.com/2010/07/14/level-2-numeric-relationships/), [nivo 7: Advancement, Progression and Pacing](https://gamebalanceconcepts.wordpress.com/2010/08/18/level-7-advancement-progression-and-pacing/), [GDKeys: Keys to Economic Systems](https://gdkeys.com/keys-to-economic-systems/).
