# Cookster: LARGE panels in the parchment style (round 5, replaces the old large frames)

Reference: my "Kitchen items" page image: a hanging linen/parchment page with soft slightly irregular edges, red embroidery borders in the corners, dark brass clips on top, warm painted light from top-left. Attach that image to the request.
Small controls (buttons, bars, slots, icons) are NOT redrawn: they stay as they are. Only the LARGE backgrounds below are redrawn so that all large panels match the reference.

## GENERAL RULES (paste first)
Style: exactly like my attached reference page (cream parchment and fine linen, soft irregular torn-linen edges, red cross-stitch embroidery corners, brass clips, warm painted light).
Each element is a SEPARATE PNG on a fully TRANSPARENT background (no white outline, no halo, clean edges). NO text, NO numbers, NO letters, NO example content: all content areas EMPTY.
Frames must stay usable when scaled: keep corners/embroidery in the corners and a plain calm middle part.
Return a ZIP with the exact file names below, one full-size PNG per element, and for the ones marked [mask] also a `_mask.png` copy where every EMPTY content area is filled with flat pure magenta (#FF00FF).

## GROUP P1: window frames (replace window_frame_*)
- `pg_okvir_veliki.png` (1600 x 1100) [mask]: large window, hanging page with two brass clips on top, EMPTY title strip, a round close-button slot (no X) top right, empty content area
- `pg_okvir_srednji.png` (1100 x 750) [mask]: same, medium
- `pg_okvir_mali.png` (800 x 480) [mask]: same, small (for "quit game?" dialogs)
- `pg_naslov_traka.png` (1000 x 140): separate title banner (empty)
- `pg_razdelnik.png` (1000 x 40): thin ornamental divider with a small red embroidery motif in the centre

## GROUP P2: panels and cards (replace the old large cards)
- `pg_izvestaj.png` (900 x 1300) [mask]: daily report page, empty title strip, big empty area
- `pg_recenzije_dobre.png`, `pg_recenzije_lose.png` (700 x 700) [mask]: two review boxes, one with a soft green tint, one with a soft red tint, empty title strip and empty body
- `pg_zadaci.png` (700 x 1000) [mask]: task list page with an empty title strip and room for 6 rows
- `pg_recept_kartica.png` (800 x 1100) [mask]: recipe card, empty picture area, empty title, empty text
- `pg_korak_kartica.png` (800 x 700) [mask]: step card
- `pg_narudzbina_kartica.png` (800 x 500) [mask]: order card
- `pg_razgovor.png` (1400 x 420) [mask]: dialogue box with a round portrait slot on the left (frame drawn, centre empty) and an EMPTY name ribbon above it
- `pg_novi_dan.png` (1000 x 600) [mask]: "new day" card with a small sun-and-moon emblem on top, empty
- `pg_kartica_stavka_n.png`, `pg_kartica_stavka_h.png`, `pg_kartica_stavka_zakljucana.png` (400 x 520) [mask]: item card in 3 states (normal, hover with a soft warm glow, locked grey): empty picture area, empty name strip, empty price/count plate
- `pg_kartica_recept_n.png`, `pg_kartica_recept_h.png`, `pg_kartica_recept_zakljucana.png` (500 x 640) [mask]: recipe card in 3 states, with 3 empty star slots at the bottom

## GROUP P3: the four full pages (see UI_STRANICE_SPISAK_ZA_CHATGPT_EN.md)
Kitchen items, Drinks, Fridge, Market: full-page images (1672 x 941) in this same style. They are described in the other list.

---
Notes for Claude: after the ZIPs arrive I replace the old frames (window_frame_*, window_title_strip, izvestaj_okvir, recenzije_*, hud_tasks_panel, zadaci_okvir, card_*, dialog_okvir, novi_dan_okvir, kartica_stavka_*, kartica_recept_*) and read the magenta masks for exact content rectangles. Old files stay in the repo (no deletion).
