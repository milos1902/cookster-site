# Cookster: tok igre (zadaci, zvezdice, prestiž) — prijedlog

Putnik je izbačen iz priče. Ostaje ono što si opisao: **igra stalno daje mali zadatak, mali zadaci otvaraju veliki cilj, zvezdice otvaraju nove dijelove kafane, a gosti ocjenama određuju napredak.** Ispod je kako bih to složio, plus dodatne ideje.

Napomena: svi brojevi su **procjene za podešavanje**. Nisam igrao igru, pa ništa od ovoga nije provjereno u igri.

---

## 1. Četiri kruga (svaki ima svoju nagradu)

| Krug | Traje | Šta igrač radi | Nagrada |
|---|---|---|---|
| **Trenutak** | 5–30 s | jedna radnja (sječe, miješa, služi) | odmah vidi/čuje odgovor (para, zvuk, osmijeh gosta) |
| **Zadatak** | ~5 min | jedan zadatak sa liste | bodovi + malo otključavanje |
| **Dan** | ~18 min | 3–4 zadatka + „glavni" zadatak dana | izvještaj dana, ocjene, zarada |
| **Zvezdica** | 2–60 dana igre | puno dana | nova prostorija ili velika promjena |

Pravilo: **u svakom trenutku igrač zna šta je sljedeće** (zadatak) i **zašto** (zvezdica).

## 2. Zadaci: nov na svakih ~5 minuta

- Uvijek **1 glavni zadatak** (sa brojačem, npr. „posluži 10 gostiju") i **do 3 mala** na listi gore desno.
- Novi mali zadatak se pojavi **kad se jedan završi ili poslije 5 minuta**, šta god prije. Nikad prazna lista, nikad više od 3 odjednom.
- Zadaci uče igru: ne postoji posebno uputstvo, nego **prvi zadaci su uputstvo** (isječi luk, skuvaj kafu, operi sudove).

**Vrste malih zadataka** (sve su stvari koje igra već ima):
- skuvaj jelo X (sataraš, kiseli kupus, kafa),
- posluži N gostiju / posluži gosta u roku,
- očisti stolove, operi sudove u sudoperi,
- skuvaj jelo „savršeno" (iznad ocjene kvaliteta),
- koristi novu stvar (nov nož, nova posuda),
- kupi na pijaci određenu namirnicu,
- snimi jelo telefonom (popularnost).

**Pravilo težine:** zadatak je malo teži od onoga što igrač već zna, nikad dva nova koncepta odjednom (tempo koji ne dosađuje i ne frustrira).

## 3. Bodovi i zvezdice

Dva brojača (kao u dokumentima):
1. **Bodovi za trošenje** (zarađeni − potrošeni): kupuju posuđe i alate.
2. **Ukupni bodovi** (nikad ne padaju): pune zvezdicu.

Bodovi dolaze iz **tri izvora** (kafana, kuhinja, popularnost), sa **dnevnom granicom** i minimumom iz svakog izvora, da se ne može „ispeglati" samo jednim poslom.

**Velika zvezdica** traži bodove **i** glavni zadatak (npr. „popravi šank").

| Zvezdica | Tempo | Otvara |
|---|---|---|
| ★1 | 2–3 dana igre | kafana |
| ★2 | ~7 dana | zapuštena bašta |
| ★3 | ~15 dana | špajz/podrum |
| ★4 | ~30 dana | terasa kafane (više stolova) |
| ★5 | ~60 dana | pekara ili roštilj |

**Male nagrade (svaki dan, poluzvezdica):** bolje posuđe, bolji noževi, tanjir, začin, dekoracija, savjet, novi stalni gost. Stavke u prodavnici su **tamne i zaključane** dok ih zadaci ne otvore (već imamo prozor „Kuhinjski elementi").

## 4. Gosti ocjenjuju, prestiž raste i pada

**Šta gost ocjenjuje** (1–5 zvjezdica):
- kvalitet jela (igra već ima ocjenu kvaliteta),
- čekanje (koliko dugo je čekao),
- tačnost (da li je dobio ono što je naručio),
- zagoreno / hladno,
- čistoća stola.

**Prestiž** je prosjek ocjena gostiju (poluzvezdice), prikazan gore.
- **Raste** kad su gosti zadovoljni, **pada** kad nisu.
- Da bi se otvorila nova velika zvezdica, treba **ukupni bodovi + prestiž iznad praga** (npr. za ★3 prestiž ≥ 3,0). Tako napredak stvarno zavisi od zadovoljstva, kako si tražio.
- **Preporuka (tvoja odluka):** prestiž može da padne, ali **ne ispod nivoa već otvorene zvezdice**. Loš dan ne smije da ti oduzme terasu, samo da uspori sljedeću zvezdicu.

**Izvještaj dana** (već postoji, `js/day-report.js`) proširiti: ocjena gostiju, dobre i loše recenzije u govoru likova (južnosrpski, kao što je u igri), bakšiš, bodovi, šta je otvoreno danas, **i jedan red šta je sjutra** (razlog da se vrati).

## 5. Dodatne ideje (iz pročitanih repoa i iz igre)

1. **Stalni gosti sa svojim jelom.** Mileva, Stojan, Mića, Ljubica, Radovan, Stana, Vukašin, Smilja: svaki ima omiljeno jelo. Ako ga pogodiš tri puta, bakšiš je veći i otkrije ti uspomenu o Savki. Povezanost sa likovima drži igrača više od bodova.
2. **Jelo dana (specijal).** Svako jutro jedno jelo dana: dupli bodovi za to jelo. Razlog da se skuva nešto novo.
3. **Gužva (rush hour).** Povremeno grupa od 4–6 gostiju odjednom. To je „vrh" u ritmu: tri mirna zadatka, pa jedna gužva, pa opet mirno. Napetost pa olakšanje na malo višem nivou.
4. **Događaji dana.** Kiša (više kafe, manje roštilja), svadbarski gosti, nenajavljeni inspektor (ocjenjuje strože, bolja nagrada). Daju raznolikost bez novih sistema.
5. **Savkine primjedbe na margini.** Kad skuvaš jelo savršeno, na stranici knjige se pojavi njena rukom pisana napomena. **Priča ostaje, samo bez Putnika:** Savka je ostavila knjigu sa receptima, stranice se otključavaju zvezdicama.
6. **Majstorstvo kroz poluzvezdice.** Za svako jelo ocjena kvaliteta se pamti (bronza/srebro/zlato). Igrač vidi napredak kao kuvar, ne samo kao vlasnik.
7. **Tri nivoa istog predmeta** (već u dokumentima): tiganj → bakarni tiganj → veliki. Bolji = brže, ljepše, veći kapacitet.
8. **Opravka kao zadatak.** Čekić i porušena kafana kao prvi veliki zadatak (već planirano). Zapuštena prostorija je zadatak za ★2, ne kazna.
9. **Telefon i popularnost.** Snimanje jela (već postoji `recorder.js`) daje bodove popularnosti, treći izvor bodova.
10. **Kratki ciljevi sedmice.** Svaki 7. dan „velika sedmica": jedan cilj koji traje cijelu sedmicu (npr. posluži 40 gostiju). Dnevni ritam + sedmični ritam (iz „live-ops" pristupa).

## 6. Prvi sat igre (kako se slaže tok)

| Minut | Šta igrač radi | Šta dobija |
|---|---|---|
| 0–5 | Čisti kuhinju, komšinica kuca | prvi zadatak, jasno obećanje |
| 5–10 | Zadatak: srpska salata | prva pobjeda, prvi bodovi |
| 10–15 | Zadatak: skuvaj kafu, prvi gost | prvi osmijeh i ocjena gosta |
| 15–20 | **Kraj prvog dana:** izvještaj | prva zvezdica se puni (npr. 25/100) |
| 20–30 | Dan 2: 3–4 zadatka, jelo dana | prvo malo otključavanje (nov tanjir) |
| 30–55 | Dan 3: čekić, popravka šanka (glavni zadatak) | **★1: kafana otvorena** |

★1 u ~40–55 minuta, kako si tražio. Sve poslije je sporije.

## 7. Šta paziti (greške koje drže igrače dalje)

- **Ekonomija:** bodovi ne smiju da se skupe previše (inflacija) ni da fale. Za svaku stvar koja daje bodove treba nešto na čemu se troše.
- **Ne kažnjavati teško:** žalba gosta ne završava dan; pogrešan zadatak ne poništava napredak.
- **Nema tajmera čekanja ni energije.** Zvezdice ne zavise od proteklog vremena nego od urađenih zadataka.
- **Zadaci ne smiju da budu posao.** Ako se isti zadatak ponavlja, igrač se umori. Zadaci se vrte kroz različite vrste (dio 2).
- **Igrati sa 3–5 novih ljudi** prije nego što se podese brojevi.

## 8. Redoslijed pravljenja (svaki dio u svom PR-u)

| # | Šta | Slike |
|---|---|---|
| 1 | **Lista zadataka gore desno** (1 glavni + do 3 mala, novi na ~5 min) i bodovi | postoje |
| 2 | **Ocjene gostiju i prestiž** (raste/pada) + zvezdice u gornjoj traci | postoje |
| 3 | **Proširen izvještaj dana** (recenzije, bakšiš, „sjutra") | postoje |
| 4 | **Zaključane stavke u prodavnici** + male nagrade (posuđe, noževi) | postoje |
| 5 | **Čekić + porušena kafana** (★1) | fale polomljeni stolovi i šank |
| 6 | **Prve zvezdice:** ★2 (bašta) | fale slike bašte |
| 7 | **Jelo dana, gužva, događaji** | — |
| 8 | **Stalni gosti sa omiljenim jelom** | — |

Paket 1–3 ne traži nijednu novu sliku i daje igri cilj, tok i razlog da se vrati.

## 9. Odluke koje su tvoje

1. **Može li prestiž da padne ispod otvorene zvezdice?** (preporuka: ne, loš dan samo usporava sljedeću)
2. **Šta sa postojećom istragom** (`js/istraga.js`) koja pominje Putnika: da je izbacim, ili da ostane kao nezavisna „tajna stranica" iz Savkine knjige bez Putnika?
3. **Tempo ★1:** da li ti je 2–3 dana igre (oko 40–55 minuta) i dalje taman?
4. **Počinjemo od paketa 1–3?** (lista zadataka, ocjene i prestiž, izvještaj dana)
