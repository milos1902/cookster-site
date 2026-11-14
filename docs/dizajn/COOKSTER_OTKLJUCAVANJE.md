# Cookster: šta je otključano na početku i kako se sve otključava

Tvoja ideja: na početku **nije sve otključano** (ni posuđe, ni bašta), a sve se otvara kako igrač napreduje.

## 1. Kako je sada u igri (provjereno u kodu)

- Od **66 predmeta** u „Kuhinjskim elementima", **63 su „starter"** (znači, igrač ih ima od prvog trenutka). Van toga su samo velika vangla, veliki emajlirani lavor i naraslo testo.
- U igri je uključeno `FREE_MODE` (sve je besplatno dok se igra pravi), pa novac ništa ne zaključava.
- Prostorije (kuhinja, kafana, bašta, špajz, pijaca) su sve otvorene preko putokaza.
- Alata za sječenje ima samo jedan (`nož`).

Znači: **sistem otključavanja treba napraviti**, a ne samo preraspodijeliti. Sada se ništa ne otključava.

## 2. Početak: mali, jasan skup

Cilj: igrač ima **taman koliko mu treba za prvi zadatak** i ništa više, pa svaka sljedeća stvar izgleda kao nagrada.

**Prostorije na početku:** kuhinja i pijaca (potrebna za prvu salatu). **Zaključano:** kafana, bašta, špajz/podrum, terasa.

**Predmeti na početku (oko 10):** mala vangla, srednja vangla, mali tiganj, drvena kašika, ravni tanjir, daska za serviranje, metla, korpa za otpatke, nož, i namirnice so, ulje, biber (povrće se kupuje na pijaci).

Sa tim se skuva srpska salata i jedno prženo jelo, pa je prvih 10 minuta moguće bez ikakvog dodatnog posuđa.

## 3. Raspored otključavanja

### Male nagrade (zadaci, svaki dan)
Otključavaju se pojedinačno, kao nagrada za mali zadatak (zadatak daje nagradu **koju igrač odmah može da iskoristi**):

| Zadatak | Otključava |
|---|---|
| prva salata gotova | cediljka, mala činija |
| skuvaj jaje ili pržen obrok | duboki tanjir, jaje, hleb |
| prvi dan završen | oval (tanjir), šećer |
| 3 posluženog jela | džezva + posuda za kafu |
| očisti kuhinju do kraja | bolji nož (nivo 2) |
| peti dan | mala/velika tegla, lovorov list |

### Velike nagrade (zvezdice)

| Zvezdica | Prostorija | Otključava (predmeti) |
|---|---|---|
| **★1** | **kafana** | kuhinja ↔ kafana: ticket rail, zvonce, šolje, čaše, flaše vina, soda, rakija |
| **★2** | **bašta** (zapuštena, treba je srediti) | zalivka, velika činija, mlevena i tucana paprika, povrće iz bašte |
| **★3** | **špajz / podrum** | bačve za kiseljenje (3), poklopac bačve, list kupusa (sarma), mast, džak brašna, kvasac |
| **★4** | **terasa** (više stolova) | velika šerpa, veliki liveni tiganj, okrugli i pravougaoni pleh, oklagija, lampe, tepih, hoklica |
| **★5** | **pekara ili roštilj** | junetina (parče), mleveno meso, roštilj, nož nivo 3 |

(Kiseli kupus je tek u ★3 jer tada dolazi bačva. To je namjerno: prvi „veliki" recept traži da prvo otvoriš podrum.)

## 4. Pravila koja drže tok lijepim

1. **Zaključano se vidi.** U „Kuhinjskim elementima" zaključane kartice su tamne sa katancem i natpisom šta ih otvara („★2: bašta" ili „zadatak: posluži 3 jela"). Igrač zna šta mu je sljedeće, to je razlog da nastavi.
2. **Nikad ćorsokak.** Svaki zadatak traži samo ono što je u tom trenutku otključano. Prije puštanja provjeriti tabelu: *jelo → potrebne stvari → kada se otključaju*.
3. **Jedna novina odjednom.** Nikad dva nova alata ili dvije nove prostorije istog dana (tempo koji uči, ne zatrpava).
4. **Nagrada je odmah upotrebljiva.** Otključana džezva → odmah zadatak „skuvaj kafu".
5. **Novac i otključavanje su dvije odvojene stvari.** Zvezdica/zadatak **otvara** stavku, a bodovi/novac je **kupuju** (već dogovoreno: bodovi za trošenje). Tako se ne može preskočiti napredak parama.
6. **Postojeći sačuvani progres** (tvoje igre koje već imaju sve) ostaje kako jeste. Novi raspored važi za **Novu igru**, da niko ne izgubi ono što već ima.

## 5. Šta bi se promijenilo u kodu (kratko)

- Svakom predmetu dodati polje otključavanja (npr. `unlock: {star: 2}` ili `unlock: {task: 'prva_salata'}`) umjesto sadašnjeg `starter`.
- Prozor „Kuhinjski elementi" prikazuje zaključane kartice tamno (pergament sa katancem već ima slike u repou).
- Putokazi (BAŠTA, KAFANA, ŠPAJZ) postaju zaključani dok se ne otvori zvezdica.
- Čuvanje igre pamti šta je otključano.

## 6. Šta nisam provjerio
- Tabelu u dijelu 3 sam sastavio iz imena predmeta, **nisam provjerio** da li za svaki recept u igri svi potrebni predmeti stignu na vrijeme. To je prvi posao prije pravljenja (tabela *jelo → potrebne stvari*).
- Ne znam koji predmeti se koriste u već postojećim receptima na drugim mjestima u kodu.

## 7. Odluke koje su tvoje
1. **Da li ti je početni skup (oko 10 predmeta) taman?** Previše malo, ili previše?
2. **Da li kafana ide tek sa ★1** (a prije toga samo kuhinja i pijaca), kako sam napisao?
3. **Kiseli kupus tek sa ★3 (podrum)** ili ranije?
4. **Novi raspored samo za Novu igru** (preporuka) ili i za postojeće sačuvane igre?
