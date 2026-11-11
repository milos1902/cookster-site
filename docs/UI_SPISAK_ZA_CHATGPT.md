# Cookster: spisak UI slika za ChatGPT (sve na providnoj pozadini)

Ovo je spisak za tebe (Miloš) da ga zalepiš u ChatGPT. Redom: prvo opšta pravila, pa grupe (svaka grupa je jedna narudžbina, 6–8 slika, isti raspored).

## Opšta pravila (zalepi ih UVEK na početak svake narudžbine)
> Style: the same hand-painted Serbian village UI as my reference sheets (cream parchment and linen, red embroidery motifs, dark wood, brass clips, green primary buttons). Draw each element as a SEPARATE image on a fully TRANSPARENT background (PNG with alpha, no shadow box, no background colour). NO text, NO numbers and NO letters inside any element: leave the text areas empty, the game writes the text. Frames and bars must be stretchable: ornamented corners/ends, plain flat middle part. Same light direction (top-left), same line thickness, same colours on all elements. Give every element in the states listed. Output a grid with equal spacing so I can cut them automatically, plus each element also as its own file named exactly as listed.

## Veličine
- Okviri/paneli: širina 1200 px (visina po proporciji). Trake: 800 × 120 px. Dugmad: 400 × 120 px. Ikone: 256 × 256 px. Zvezdice i katanci: 256 × 256 px. Kartice drveta: 480 × 300 px.
- (Cela slika dva puta veća nego što će biti na ekranu; ja je smanjim.)

## Grupa 1: zvezdice i ugled (imena fajlova)
- `zvezda_prazna.png`, `zvezda_pola.png`, `zvezda_puna.png` (obična, srebrnasta okvir; puna je zlatna, pola je napola zlatna)
- `zvezda_zlatna_majstor.png` (veća, ukrašena: majstorski nivo)
- `katanac_zvezda.png` (zlatni katanac sa praznom zvezdicom u sredini: zaključano), `katanac_otvoren.png`
- `znacka_nivo.png` (okrugla značka za broj nivoa, prazna), `traka_bodova_prazna.png`, `traka_bodova_puna.png` (puna boja, ista veličina, da se otkriva s leva na desno)

## Grupa 2: lista zadataka i beležnica
- `zadaci_okvir.png` (pergament okvir liste zadataka, gore prazna traka za naslov, mesto za 5–6 redova)
- `zadatak_red_prazan.png`, `zadatak_red_gotov.png` (sa zelenom kvačicom), `zadatak_red_glavni.png` (istaknut, sa zlatnim rubom)
- `kvacica_kutija_prazna.png`, `kvacica_kutija_puna.png`
- `brojac_okvir.png` (mali okvir za "0/10")
- `kartica_tab_aktivna.png`, `kartica_tab_neaktivna.png` (kartice Recepti / Zadaci / Pisma, prazne)
- `obavestenje_otkljucano.png` (kartica "Otključano!", prazna, sa ikonom zvezdice), `obavestenje_nova_zvezda.png` (veća)

## Grupa 3: drvo napretka
- `cvor_otkljucan.png`, `cvor_zakljucan.png` (siv, sa katancem), `cvor_kupljen.png`, `cvor_oznacen.png` (svaki prazan: mesto za ikonu, naziv i cenu)
- `strelica_cvor.png` (strelica između čvorova), `strelica_cvor_zakljucana.png` (siva isprekidana)
- `drvo_kartica_kuhinja.png`, `drvo_kartica_kafana.png`, `drvo_kartica_odrzavanje.png` (aktivna), iste neaktivne: `..._neaktivna.png`
- `cena_bodovi.png` (mala pločica za cenu u bodovima znanja), `cena_novac.png` (za novac)

## Grupa 4: dnevni izveštaj
- `izvestaj_okvir.png` (veliki pergament, sa trakom za naslov)
- `recenzije_dobre_okvir.png` (zelenkast), `recenzije_lose_okvir.png` (crvenkast) — prazni, za 4 reda
- `recenzija_red.png`, `smajli_srecan.png`, `smajli_neutralan.png`, `smajli_ljut.png`, `smajli_mrzovoljan.png`
- `baksis_traka_prazna.png`, `baksis_traka_puna.png`
- `dugme_zatvori.png` (zeleno, prazno), svaka u stanjima: normalno, hover, pritisnuto, onemogućeno (`_n`, `_h`, `_p`, `_x` na kraju imena)

## Grupa 5: alati i popravke (čekić)
- Slotovi alata (kao red 1–6 u Waterpark-u): `slot_alata_n.png`, `slot_alata_izabran.png`, `slot_alata_prazan.png`, `slot_alata_zakljucan.png`
- Ikone alata (bez okvira): `alat_ruka.png`, `alat_cekic.png`, `alat_sunder.png`, `alat_metla.png`, `alat_malj.png`, `alat_kofa.png`
- `prsten_napretka_prazan.png`, `prsten_napretka_pun.png` (okrugli, ista veličina; za popravku i sečenje)
- `ikona_polomljeno.png` (mali ključ/čekić sa upozorenjem)

## Grupa 6: kafana i gosti
- `raspolozenje_zadovoljan.png`, `raspolozenje_nestrpljiv.png`, `raspolozenje_ljut.png` (oblačić sa smajlijem)
- `strpljenje_traka_prazna.png`, `strpljenje_traka_puna.png`
- `narudzbina_kartica.png` (prazna, mesto za sto, jelo, broj)

## Grupa 7: opšte
- Kursori: `kursor_strelica.png`, `kursor_ruka.png`, `kursor_ruka_drzi.png`, `kursor_cekic.png` (32 × 32 px i 64 × 64 px)
- `tooltip_okvir.png` (mali oblačić za opis, prazan)
- Ikone 256 × 256: `ikona_novac.png`, `ikona_bodovi_znanja.png`, `ikona_gosti.png`, `ikona_sat.png`, `ikona_sunce.png`, `ikona_kisa.png`, `ikona_noc.png`
- Poruke (toast), prazne, 3 boje: `toast_uspeh.png` (zelena), `toast_upozorenje.png` (žuta), `toast_greska.png` (crvena)
- Dugmad u 4 stanja (`_n`, `_h`, `_p`, `_x`): `dugme_zeleno.png` (glavna radnja), `dugme_krem.png` (sporedna), `dugme_crveno.png` (opasno: obriši), `dugme_malo_kvadrat.png` (pauza, podešavanja), `dugme_zatvori_x.png`

## Društvena mreža (samo ako je radimo, kasnije)
- `telefon_okvir.png`, `ikona_srce.png`, `ikona_komentar.png`, `ikona_pratioci.png`, `znacka_pratioci.png`

## Napomene za mene (Claude)
- Svaku sliku ću smanjiti na pravu veličinu; tekst pišem u kodu (latinica, osim ako Miloš kaže drugačije).
- Kad stignu slike, proveravam: providnost, isti stil, jednake veličine i da li su okviri razvlačivi.
