#!/bin/bash
set -e; ID="$1"; N="$2"
SRC="src_$ID.mp4"; OUT="FRQNCY_v$(printf %02d $N).mp4"
# Pass A: last 12s (clean hero zoom) -> 9:16, boomerang to ~24s
ffmpeg -y -sseof -12 -i "$SRC" -filter_complex \
"[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,eq=brightness=-0.04:saturation=1.06,fps=25[s];[s]split[a][b];[b]reverse[r];[a][r]concat=n=2:v=1[v]" \
-map "[v]" -an -preset veryfast -pix_fmt yuv420p boom_$N.mp4 -loglevel error
# Pass B: loop + captions + audio
ffmpeg -y -stream_loop 4 -i boom_$N.mp4 -i voice01b.mp3 -i pad01.mp3 -filter_complex \
"[0:v]subtitles=cap01c.ass[v];[2:a]volume=0.10[m];[1:a][m]amix=inputs=2:duration=first[a]" \
-map "[v]" -map "[a]" -t 44.7 -r 25 -c:v libx264 -preset veryfast -pix_fmt yuv420p -c:a aac -movflags +faststart "$OUT" -loglevel error
echo "DONE $OUT $(du -h "$OUT"|cut -f1)"
