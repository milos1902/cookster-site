#!/bin/sh
# usage: tools/make_stove_overlay.sh <picture of the tavern with the stove fire OUT (1672x941)> [output]
# Cuts the stove (and the wall / floor around it, with soft edges) out of that picture; everything else becomes transparent.
# The top of the table next to the stove is left out, so the dirt of the table stays visible.
IN="$1"; OUT="${2:-assets/tavern/dirt/stove_off.webp}"
TMP="$(mktemp -d)"
convert -size 1672x941 xc:black -fill white -draw "rectangle 1130,262,1400,490" \
  -fill black -draw "polygon 1160,530 1170,476 1400,388 1450,420 1450,540" -blur 0x10 -level 0,100% "$TMP/alpha.png"
convert "$IN" "$TMP/alpha.png" -alpha off -compose copy_opacity -composite -quality 90 "$OUT"
rm -rf "$TMP"; echo "written $OUT"
