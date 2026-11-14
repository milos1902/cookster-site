# Cookster: pregled igre (priča, tempo, zadržavanje igrača)

Napravljeno po listi provjere iz repoa Claude-Code-Game-Studios (MIT): samo-određenje (autonomija, kompetencija, povezanost), „flow", prvih 10 minuta, testerasta težina, povratna informacija do 0,5 s, tipovi igrača, dnevni razlog da se vrati.

**Šta ovo jeste:** čitanje dokumenata i koda (docs/PRICA.md, js/istraga.js, js/tutorial.js, js/neighbor.js, js/day-report.js, js/kitchen-orders.js).
**Šta ovo nije:** nisam igrao igru kao igrač, nisam mjerio vrijeme ni težinu. Svaka tvrdnja ispod je iz koda ili dokumenta, a gdje ne znam, piše „nepoznato".

## 1. Šta je već dobro

- **Jaka premisa.** Unuk se vraća u bakinu kuću, knjiga recepata nema skoro nijednu stranicu, tajanstveni Putnik. Dva sloja: emotivni (baka Savka) i misterija (Putnik). To hrani istraživače i one koje vuče priča.
- **Dobar plan priče.** 4 poglavlja, 20 stranica, 3 kraja (potraga, selo, podjela) u docs/PRICA.md. Svaka stranica je cijela mala zagonetka (trag, tabla, pregled mjesta, ispitivanje, zagonetka).
- **Uvod kroz priču, ne kroz uputstvo.** Komšinica kuca na prozor kad je kuhinja oko 60% čista, pa tek tada počinje uputstvo. Koraci se prebacuju sami kad igrač uradi traženo (ne klikom na „Dalje"). To je učenje kroz igranje.
- **Zatvorena petlja.** Narudžbina na papiriću, konobar, kuhinja, serviranje, kraj dana sa zaradom, ocjenom gostiju i ugledom.
- **Istraga ima izbor.** Tri pitanja, pogrešno pitanje zatvara temu, tragovi idu u beležnicu. To daje autonomiju.

## 2. Šta nedostaje ili je rizično

1. **Priča je za sada samo početak.** Plan ima 20 stranica, a js/istraga.js (oko 280 linija) igra samo prvu. Poslije nje igrač nema šta dalje. To je najveći rizik za zadržavanje.
2. **Nema vidljivog cilja.** U kodu igre nisam našao ni listu ciljeva ni dostignuća. U gornjoj traci su dan, vrijeme i novac, ali ne „stranice 1 od 8". Igrač ne vidi koliko je daleko.
3. **Novac nema jasnu svrhu.** Zaradom se kupuje posuđe u prodavnici, ali veza „novac, nova posuda, novi recept, nova stranica" nigdje nije izrečena igraču.
4. **Uputstvo je kratko.** Pokriva prvi dio (srpska salata, do kupovine na pijaci). Nije jasno šta igrač radi poslije toga. Ne pali se samo od sebe nego preko komšinice ili `?uputstvo`.
5. **Razvojna dugmad su vidljiva.** Na slici igre desno stoje „Maska posude", „Senke sunca", „Vreme i svetlo", „Predmeti u reni", „Granice testa", a lijevo „Kutlača", „Animacije gostiju", „Kese". To su alati za pravljenje igre. Igraču kvare utisak svijeta.
6. **Težina i tempo su nepoznati.** Ne znam da li se težina i tempo gostiju mijenjaju kroz dane (testerasta krivulja: napetost pa olakšanje na višem nivou). Treba igrati i izmjeriti.
7. **Povratna informacija je dobra tamo gdje smo radili** (para, sjene, voda, odmotavanje), ali nije provjereno da li svaka akcija odgovara u 0,5 s.

## 3. Prijedlog (po redu važnosti)

| # | Šta | Zašto |
|---|---|---|
| A | **Vidljiv cilj:** „Stranice knjige 1/8" u gornjoj traci, i veliki trenutak nagrade kad se stranica nađe i zalijepi u knjigu | kompetencija, razlog da se nastavi |
| B | **Mali razlog za sutra:** svaki dan jedna novina (novi gost sa tragom, novi zahtjev, novo vrijeme) | dnevno zadržavanje bez prisile |
| C | **Veza novac-recept-stranica:** pri kupovini nove posude pokazati koji recept otvara | novac dobija svrhu |
| D | **Završiti uputstvo** do prve nađene stranice, pa onda pustiti igrača | prvih 10 minuta |
| E | **Sakriti razvojna dugmad** iza prekidača (npr. `?razvoj`) | utisak svijeta |
| F | **Napisati stranice 2 i 3** (sataraš, kiseli kupus) po već gotovom planu | sadržaj poslije prve stranice |

## 4. Odluke koje su tvoje (ja ih ne mogu donijeti)

1. **Koliko stranica u prvom izdanju?** PRICA.md kaže 8, 12 ili 20. Preporuka: 8 (kraće, da se vidi kraj).
2. **Ko je Putnik?** (stranac, rođak ili nekadašnji kuvar). Od toga zavisi koje tragove stavljamo sada.
3. **Pritisak vremena u razgovorima:** da ili ne.

## 5. Šta bih prvo uradio

E (sakriti razvojna dugmad) i A (cilj u gornjoj traci). Mali su, vide se odmah, i ne diraju priču dok ne odlučiš o tačkama iz dijela 4.
