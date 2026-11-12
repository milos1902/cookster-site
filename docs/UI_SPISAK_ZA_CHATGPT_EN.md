# Cookster: UI image list for ChatGPT (everything on a transparent background)

Paste the GENERAL RULES at the start of every request, then paste ONE group at a time (6-8 images per group works best).

## GENERAL RULES (paste first, every time)
Style: the same hand-painted Serbian village UI as my reference sheets (cream parchment and linen, red embroidery motifs, dark wood, brass clips, green primary buttons).
Draw each element as a SEPARATE image on a fully TRANSPARENT background (PNG with alpha channel, no background colour, no shadow box).
NO text, NO numbers and NO letters inside any element: leave the text areas empty, the game writes the text.
Frames and bars must be stretchable: ornamented corners/ends and a plain flat middle part.
Same light direction (from top-left), same line thickness and same colours on all elements.
Draw every element in the states listed for it.
Output one grid image with equal spacing (so I can cut it automatically), and also each element as its own file named exactly as listed.

## SIZES (draw about 2x the size it will have on screen)
- Frames and panels: 1200 px wide (height in proportion).
- Bars: 800 x 120 px.
- Buttons: 400 x 120 px.
- Icons, stars, padlocks: 256 x 256 px.
- Tree node cards: 480 x 300 px.

## STATE SUFFIXES FOR BUTTONS AND SLOTS
`_n` normal, `_h` hover, `_p` pressed, `_x` disabled.

---

## GROUP 1: stars and reputation
- `zvezda_prazna.png` - empty star (silver frame, empty inside)
- `zvezda_pola.png` - half-filled star (left half gold)
- `zvezda_puna.png` - full gold star
- `zvezda_zlatna_majstor.png` - larger ornate gold star ("master" level)
- `katanac_zvezda.png` - gold padlock with an empty star in the middle (locked)
- `katanac_otvoren.png` - the same padlock, open (unlocked)
- `znacka_nivo.png` - round level badge, empty (a number goes inside)
- `traka_bodova_prazna.png` - empty experience bar (800 x 120)
- `traka_bodova_puna.png` - the same bar, full colour, exactly the same size (the game reveals it from left to right)

## GROUP 2: task list and notebook
- `zadaci_okvir.png` - parchment frame of the task list: empty title strip on top, room for 5-6 rows
- `zadatak_red_prazan.png` - task row, not done (empty checkbox, empty text area)
- `zadatak_red_gotov.png` - task row, done (green check mark)
- `zadatak_red_glavni.png` - highlighted main task row (golden border)
- `kvacica_kutija_prazna.png` - empty checkbox
- `kvacica_kutija_puna.png` - checkbox with green check mark
- `brojac_okvir.png` - small frame for a counter like "0/10" (empty)
- `kartica_tab_aktivna.png` - notebook tab, active (empty)
- `kartica_tab_neaktivna.png` - notebook tab, inactive (empty)
- `obavestenje_otkljucano.png` - small "unlocked" notification card (empty, star icon on the left)
- `obavestenje_nova_zvezda.png` - bigger "new star" notification card (empty)

## GROUP 3: progress tree
- `cvor_otkljucan.png` - tree node, unlocked (empty: room for icon, name and price)
- `cvor_zakljucan.png` - tree node, locked (grey, with a padlock)
- `cvor_kupljen.png` - tree node, bought (green accent)
- `cvor_oznacen.png` - tree node, selected (glowing edge)
- `strelica_cvor.png` - arrow between nodes
- `strelica_cvor_zakljucana.png` - the same arrow, grey and dashed (locked)
- `drvo_kartica_kuhinja.png`, `drvo_kartica_kafana.png`, `drvo_kartica_odrzavanje.png` - three tab cards (active), empty
- `drvo_kartica_kuhinja_neaktivna.png`, `drvo_kartica_kafana_neaktivna.png`, `drvo_kartica_odrzavanje_neaktivna.png` - same three, inactive
- `cena_bodovi.png` - small plate for a price in knowledge points (empty)
- `cena_novac.png` - small plate for a price in money (empty)

## GROUP 4: daily report
- `izvestaj_okvir.png` - large parchment frame with an empty title strip
- `recenzije_dobre_okvir.png` - "good reviews" box, greenish, empty, room for 4 rows
- `recenzije_lose_okvir.png` - "bad reviews" box, reddish, empty, room for 4 rows
- `recenzija_red.png` - single review row (empty)
- `smajli_srecan.png`, `smajli_neutralan.png`, `smajli_ljut.png`, `smajli_mrzovoljan.png` - four round emoji faces: happy, neutral, angry, grumpy
- `baksis_traka_prazna.png`, `baksis_traka_puna.png` - tip bar, empty and full (same size)
- `dugme_zatvori_n.png`, `dugme_zatvori_h.png`, `dugme_zatvori_p.png`, `dugme_zatvori_x.png` - green "close" button, 4 states, empty

## GROUP 5: tools and repairs (hammer)
- Tool slots (like the numbered 1-6 row in Waterpark Simulator): `slot_alata_n.png` (normal), `slot_alata_izabran.png` (selected), `slot_alata_prazan.png` (empty), `slot_alata_zakljucan.png` (locked)
- Tool icons, no frame: `alat_ruka.png` (hand), `alat_cekic.png` (hammer), `alat_sunder.png` (sponge), `alat_metla.png` (broom), `alat_malj.png` (sledgehammer), `alat_kofa.png` (bucket)
- `prsten_napretka_prazan.png`, `prsten_napretka_pun.png` - round progress ring, empty and full, same size (for repairing and cutting)
- `ikona_polomljeno.png` - small "broken" icon (wrench or hammer with a warning mark)

## GROUP 6: tavern and guests
- `raspolozenje_zadovoljan.png`, `raspolozenje_nestrpljiv.png`, `raspolozenje_ljut.png` - small speech bubbles with a happy, impatient and angry face
- `strpljenje_traka_prazna.png`, `strpljenje_traka_puna.png` - guest patience bar, empty and full, same size
- `narudzbina_kartica.png` - order card (empty: room for the table, the dish and a number)

## GROUP 7: general
- Cursors (draw each at 64 x 64 px and 32 x 32 px): `kursor_strelica.png` (arrow), `kursor_ruka.png` (hand), `kursor_ruka_drzi.png` (grabbing hand), `kursor_cekic.png` (hammer)
- `tooltip_okvir.png` - small tooltip bubble (empty)
- Icons 256 x 256: `ikona_novac.png` (money), `ikona_bodovi_znanja.png` (knowledge points, e.g. a small flask or book), `ikona_gosti.png` (guests), `ikona_sat.png` (clock), `ikona_sunce.png` (sun), `ikona_kisa.png` (rain), `ikona_noc.png` (night)
- Message toasts (empty, 3 colours): `toast_uspeh.png` (green, success), `toast_upozorenje.png` (yellow, warning), `toast_greska.png` (red, error)
- Buttons in the 4 states (`_n`, `_h`, `_p`, `_x`): `dugme_zeleno` (green, main action), `dugme_krem` (cream, secondary), `dugme_crveno` (red, dangerous), `dugme_malo_kvadrat` (small square button for pause and settings), `dugme_zatvori_x` (round close "X")

## LATER (only if we make the social network part)
`telefon_okvir.png` (phone frame), `ikona_srce.png` (heart), `ikona_komentar.png` (comment), `ikona_pratioci.png` (followers), `znacka_pratioci.png` (followers badge)

---
Notes for Claude: when the images arrive, check transparency, the same style across all of them, equal sizes, and that frames are stretchable.
