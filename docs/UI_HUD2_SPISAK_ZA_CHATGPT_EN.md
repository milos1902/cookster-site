# Cookster: UI image list for ChatGPT, round 3 (completing the UI)

Paste the GENERAL RULES first, then ONE group at a time. Return each group as a ZIP of separate full-size PNG files with the exact names below (no grid needed, no white background).

## GENERAL RULES (paste first, every time)
Style: the same hand-painted Serbian village UI as my previous groups (cream parchment and fine linen, red embroidery motifs, dark wood, brass corners and rims, green primary buttons, warm painted lighting from top-left).
Draw each element as a SEPARATE image on a fully TRANSPARENT background (PNG with alpha). NO white outline, NO halo, NO grey fringe. Clean anti-aliased edges that look correct on a dark background.
NO text, NO numbers and NO letters inside any element. Icons have no frame (just the object), unless the name says "medallion".
Frames must be stretchable: ornamented corners and a plain flat middle part.
Same light direction, line thickness and colours on every element. Draw at about 2x the on-screen size.

---

## GROUP I1: dock icons that are still missing (256 x 256, no frame)
- `icon_fridge.png` - old wooden/enamel fridge or ice box, door slightly open
- `icon_cookware.png` - a pot and a frying pan together (for "Kitchen items")
- `icon_save.png` - a book or box with a small green check, "save game"
- `icon_load.png` - an open box or folder with an arrow coming out, "load game"
- `icon_quit.png` - wooden door with an arrow going out
- `icon_help.png` - round medallion with an empty question-mark shape drawn as a simple curl (no letters)
- `icon_sound_on.png`, `icon_sound_off.png` - a small brass horn/bell with sound waves, and the same crossed out
- `icon_star_small.png` - tiny gold star (64 x 64) for text lines
- `icon_lock_small.png` - tiny brass padlock (64 x 64)
- `icon_new_badge.png` - small round red "new" ribbon shape, no letters (128 x 128)

## GROUP I2: more tool icons for the tool bar (256 x 256, no frame)
Same style as my existing hammer, bucket, sponge, broom, sledgehammer, hand:
- `alat_noz.png` (kitchen knife), `alat_daska.png` (cutting board), `alat_kasika.png` (wooden spoon), `alat_kutlaca.png` (ladle), `alat_tiganj.png` (frying pan), `alat_sipka.png` (small pot with lid), `alat_vatra.png` (poker for the stove), `alat_cetka.png` (scrub brush), `alat_krpa.png` (cloth), `alat_telefon.png` (phone for recording), `alat_olovka.png` (pencil), `alat_cekic_zlatni.png` (golden hammer, master version)

## GROUP I3: state and status marks (128 x 128 unless noted)
- `stanje_zakljucano.png` (padlock badge), `stanje_novo.png` (small ribbon), `stanje_upozorenje.png` (triangle with an empty exclamation shape), `stanje_greska.png` (round red cross), `stanje_uspeh.png` (round green check), `stanje_info.png` (round blue-ish brass "i" shape drawn as a simple stroke)
- `stanje_sat_pesak.png` (hourglass, for waiting), `stanje_zagorelo.png` (small burnt/smoking flame icon), `stanje_gotovo.png` (steaming plate icon)
- `znacka_brojac_crvena.png` (small round red badge for a number), `znacka_brojac_zelena.png`
- `strelica_gore.png`, `strelica_dole.png` (small brass arrows 128 x 128), `plus_znak.png`, `minus_znak.png` (brass signs, 128 x 128, to place on the +/- buttons)

## GROUP I4: character dialogue frame (for Baba Savka and neighbours)
- `dialog_okvir.png` - wide dialogue box (1400 x 420), parchment with brass corners, EMPTY, with an empty round slot for a portrait on the left
- `dialog_portret_okvir.png` - round or oval portrait frame (400 x 400), EMPTY centre, brass + wood
- `dialog_ime_traka.png` - name ribbon (600 x 120), EMPTY, with brass clips
- `dialog_dugme_dalje_n.png`, `_h.png`, `_p.png` - small green "next" button with an arrow shape (360 x 110)
- `dialog_izbor_n.png`, `_h.png`, `_p.png` - answer choice row (1000 x 110), cream, EMPTY, small arrow on the left
- `dialog_trougao.png` - tiny "continue" triangle marker (64 x 64)

## GROUP I5: main menu and loading (large)
- `menu_logo_baner.png` - linen banner with a pot motif on top, EMPTY for the logo text (1200 x 900)
- `menu_dugme_n.png`, `_h.png`, `_p.png`, `_x.png` - big menu button (900 x 200), parchment, EMPTY
- `menu_pozadina_okvir.png` - decorative border for the start screen (1920 x 1080, transparent centre)
- `ucitavanje_prsten.png` - round loading ring (300 x 300) and `ucitavanje_prsten_pun.png` (same ring filled)
- `novi_dan_okvir.png` - "new day" card (1000 x 600), EMPTY, with a sun-and-moon emblem on top

## GROUP I6: item and dish cards (for the market, recipes and orders)
- `kartica_stavka_n.png`, `_h.png`, `_izabrana.png`, `_zakljucana.png` - item card (400 x 520): empty picture area on top, empty name strip, empty price plate at the bottom
- `kartica_recept_n.png`, `_h.png`, `_zakljucana.png` - recipe card (500 x 640): empty picture area, a row of 3 empty star slots at the bottom
- `kolicina_okvir.png` - quantity stepper frame (360 x 110) with empty centre
- `cena_plocica.png` - price plate with a coin on the left, empty (300 x 100)
- `etiketa_kategorija_n.png`, `_aktivna.png` - category filter pill (300 x 90), EMPTY

## GROUP I7: HUD extras
- `hud_zvezda_ugled_okvir.png` - round medallion for the reputation star on the HUD (300 x 300), EMPTY centre
- `hud_zvezda_ugled_puna.png` - gold star fill for it, same size, to be revealed from the bottom
- `hud_vreme_ikone_okvir.png` - small round frame for weather icon (160 x 160)
- `hud_gosti_brojac.png` - small plate for the guest counter (360 x 110), EMPTY, with a guests icon slot on the left
- `hud_ugled_traka_prazna.png`, `hud_ugled_traka_puna.png` - reputation bar (800 x 100), empty and full
- `hud_obavestenje_zvezda.png` - big celebration banner for "new star" (1400 x 500), EMPTY, ornate, with room for an icon

---
Notes for Claude: when the ZIPs arrive, check transparency (no halo), the file names, the sizes, that nothing has text in it, and that frames are stretchable. Then build the new HUD and windows in the game.
