#!/usr/bin/env bash
# FRQNCY assembler — voice + background (image or video) + music + burned captions -> 9:16 MP4
# Usage: ./assemble.sh VOICE.mp3 BACKGROUND(.jpg|.mp4) MUSIC.mp3 CAPTIONS.srt OUT.mp4
set -e
VOICE="$1"; BG="$2"; MUSIC="$3"; SRT="$4"; OUT="${5:-out.mp4}"
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$VOICE")
W=1080; H=1920
# background: loop image or trim/loop video to voice duration, cover-crop to 9:16
case "$BG" in
  *.mp4|*.mov|*.webm)
    BGIN=(-stream_loop -1 -i "$BG"); BGFILT="[0:v]scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},setsar=1[bg]";;
  *)
    BGIN=(-loop 1 -i "$BG"); BGFILT="[0:v]scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},setsar=1[bg]";;
esac
# subtitle burn (styled: Lato, big, bottom-third, semi-transparent box)
SUB="subtitles=${SRT}:force_style='FontName=Lato,FontSize=16,Bold=1,PrimaryColour=&H00FFFFFF,OutlineColour=&HC8000000,BorderStyle=1,Outline=3,Shadow=1,Alignment=2,MarginV=330'"
ffmpeg -y "${BGIN[@]}" -i "$VOICE" -i "$MUSIC" \
  -filter_complex "${BGFILT};[bg]${SUB}[v];[2:a]volume=0.12[m];[1:a][m]amix=inputs=2:duration=first:dropout_transition=0[a]" \
  -map "[v]" -map "[a]" -t "$DUR" -r 30 \
  -c:v libx264 -pix_fmt yuv420p -preset veryfast -crf 20 -c:a aac -b:a 192k -shortest "$OUT"
echo "WROTE $OUT ($(printf '%.1f' $DUR)s)"
