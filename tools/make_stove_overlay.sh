#!/bin/sh
# usage: tools/make_stove_overlay.sh <picture of the tavern with the stove fire OUT (1672x941)> [output]
# keeps only the pixels that differ from assets/tavern/kafana_cista.webp around the stove (soft edges), everything else becomes transparent
IN="$1"; OUT="${2:-assets/tavern/dirt/stove_off.webp}"; CLEAN="$(dirname "$0")/../assets/tavern/kafana_cista.webp"
TMP="$(mktemp -d)"
convert -size 1672x941 xc:black -fill white -draw "rectangle 1080,230,1440,530" "$TMP/rect.png"
convert "$IN" "$CLEAN" -compose difference -composite -colorspace Gray -level 4%,16% -morphology Dilate Disk:5 -blur 0x4 -level 0,70% \
  "$TMP/rect.png" -compose multiply -composite "$TMP/alpha.png"
convert "$IN" "$TMP/alpha.png" -alpha off -compose copy_opacity -composite -quality 88 "$OUT"
rm -rf "$TMP"; echo "written $OUT"
