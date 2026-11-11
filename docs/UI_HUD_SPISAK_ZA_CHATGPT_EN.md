# Cookster: HUD and window frames, image list for ChatGPT (round 2)

Paste the GENERAL RULES first, then ONE group at a time. Return each group as a ZIP of separate files (exact names below) plus the grid image.
These elements REPLACE the old wooden HUD in the game, so they must match the sets we already have (brass, linen, red embroidery, dark wood).

## GENERAL RULES (paste first, every time)
Style: the same hand-painted Serbian village UI as my reference sheets and the previous UI groups (cream parchment and linen, red embroidery motifs, dark wood, brass corners and rims, green primary buttons).
Draw each element as a SEPARATE image on a fully TRANSPARENT background (PNG with alpha channel). NO white outline, NO halo, NO grey fringe, NO background colour around edges. Clean anti-aliased edges that look correct on a dark background.
NO text, NO numbers, NO letters and NO example content (no food, no faces, no pictures) inside any element: leave all content areas EMPTY, the game fills them in. Icons are separate files.
Frames and bars must be stretchable: ornamented corners/ends and a plain flat middle part.
Same light direction (from top-left), same line thickness and same colours on all elements.
Draw every element in the states listed. Draw at about 2x the size it will have on screen (sizes below).
Output one grid image with equal spacing AND each element as its own file named exactly as listed, in a ZIP.

---

## GROUP H1: top bar (always visible, top left)
Size 1000 x 160 unless noted.
- `hud_top_bar.png` - long horizontal bar with 4 empty compartments (date, clock, money, weather)
- `hud_day_badge.png` - round or shield badge for the day number, empty (300 x 300)
- `hud_money_plate.png` - small plate for the money amount (400 x 120)
- `hud_pause_n.png`, `hud_pause_h.png`, `hud_pause_p.png` - small square pause button, 3 states, no icon (160 x 160)
- `hud_settings_n.png`, `hud_settings_h.png`, `hud_settings_p.png` - small square settings button, 3 states, no icon (160 x 160)

## GROUP H2: level and tasks (always visible, top right)
- `hud_level_badge.png` - round level badge with a rim for a number, empty (300 x 300)
- `hud_xp_bar_empty.png`, `hud_xp_bar_full.png` - experience bar (1000 x 120), same size, the full one is revealed left to right
- `hud_tasks_panel.png` - tall task list frame with an empty title strip on top and room for 6 rows (700 x 1000)
- `hud_tasks_title_strip.png` - separate title strip (700 x 140)
- `hud_task_row_n.png` - task row, empty, with an empty checkbox slot on the left (700 x 120)
- `hud_task_row_done.png` - same row, done, with a green check mark
- `hud_task_row_main.png` - highlighted main task row (golden border)
- `hud_task_counter.png` - small plate for a counter like "0/10" (240 x 100)
- `hud_star_row_frame.png` - frame for a row of 5 stars (800 x 160)

## GROUP H3: tool bar (always visible, bottom centre)
- `hud_toolbar.png` - long wooden-and-brass bar holding 6 slots, with 6 EMPTY slot recesses (1600 x 260)
- `hud_toolbar_number_plate.png` - small number plate for the key 1-6 (80 x 80), empty
- `hud_toolbar_tooltip.png` - small label plate above a slot for the tool name (400 x 100), empty
- `hud_toolbar_cooldown_ring.png` - thin round ring around a slot for tool progress (260 x 260)

## GROUP H4: side buttons (always visible, bottom left and right)
Round buttons WITHOUT icons, 4 states each (`_n` normal, `_h` hover, `_p` pressed, `_x` disabled), 220 x 220:
- `hud_round_green_n/h/p/x.png`, `hud_round_cream_n/h/p/x.png`
- `hud_round_badge_notify.png` - small round notification dot/badge (100 x 100), empty
Icons as SEPARATE files (256 x 256, no frame): `icon_notebook.png`, `icon_phone_record.png`, `icon_map.png`, `icon_recipes.png`, `icon_basket.png`, `icon_pantry.png`, `icon_drink.png`, `icon_dishes.png`, `icon_settings.png`, `icon_pause.png`

## GROUP H5: cooking bars (above a pot or pan while cooking)
All 800 x 120, each as EMPTY frame + FULL fill (same size, fill revealed left to right):
- `bar_stir_empty.png`, `bar_stir_full.png` (with a spoon icon medallion on the left)
- `bar_cook_empty.png`, `bar_cook_full.png` (pot medallion)
- `bar_bake_empty.png`, `bar_bake_full.png` (oven medallion)
- `bar_cut_empty.png`, `bar_cut_full.png` (knife medallion)
- `bar_wash_empty.png`, `bar_wash_full.png` (sponge medallion)
- `bar_fire_empty.png`, `bar_fire_full.png` (flame medallion)
- `doneness_slider.png` - horizontal bar with three zones raw / ready / burnt (1000 x 160), empty (no pictures, only colour zones green-yellow-brown), plus `doneness_knob.png` (round knob, 120 x 120)
- `hold_ring_empty.png`, `hold_ring_full.png` - big round ring for "hold to act" (400 x 400)

## GROUP H6: small info plates
- `plate_temperature.png`, `plate_timer.png`, `plate_portions.png` (400 x 120 each, empty)
- `button_minus_n/h/p.png`, `button_plus_n/h/p.png` (160 x 160, no sign drawn, I add the sign)
- `card_recipe.png` (800 x 1100), `card_step.png` (800 x 700), `card_table_order.png` (800 x 500), all empty with a title strip
- `notice_ok.png` (green), `notice_warn.png` (yellow), `notice_bad.png` (red) - message strips (900 x 140), empty, with an empty round icon slot on the left
- `notice_saved.png` - small "saved" plate (500 x 100)

## GROUP H7: window frames (menus and dialogs)
All stretchable (ornamented corners, flat middle), with a title strip and a close-button slot. Sizes are minimum, draw large:
- `window_frame_large.png` (1600 x 1100) - for menus, market, notebook, settings
- `window_frame_medium.png` (1100 x 750) - dialogs
- `window_frame_small.png` (800 x 480) - confirm dialogs ("quit game?")
- `window_title_strip.png` (1000 x 140) - separate title banner with brass clips
- `window_tab_active.png`, `window_tab_inactive.png` (360 x 110), empty
- `window_scrollbar_track.png` (60 x 800), `window_scrollbar_thumb.png` (60 x 200)
- `window_search_field.png` (700 x 100), empty
- `window_list_item_n.png`, `window_list_item_h.png`, `window_list_item_selected.png` (900 x 180) - list row, empty
- `window_save_slot.png` (900 x 200) - save slot, empty
- `window_divider.png` (1000 x 40) - ornamental divider line
- `slider_track.png` (700 x 60), `slider_knob.png` (100 x 100) - settings slider
- `checkbox_off.png`, `checkbox_on.png` (100 x 100), `toggle_off.png`, `toggle_on.png` (200 x 100)
- `loading_bar_empty.png`, `loading_bar_full.png` (1000 x 80)
- `page_arrow_left_n/h/p.png`, `page_arrow_right_n/h/p.png` (140 x 140, no arrow drawn... draw the arrow)

## GROUP H8: map and big art (optional, later)
- `map_pin.png` (200 x 260), `map_pin_locked.png`, `map_frame.png` (1600 x 1100, empty centre)
- `menu_logo_banner.png` - empty linen banner for the game logo (1200 x 900)

---
Notes for Claude: when ZIPs arrive, check transparency (no halo), equal sizes within a state set, names, stretchability. Then replace the old HUD (clock dial bottom-left, 6-slot bar, "Dan 1" box, Beležnica button) with these.
