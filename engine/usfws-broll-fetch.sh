#!/bin/bash
# USFWS public-domain nature b-roll fetcher (source: youtube.com/@usfws — US gov = PD; credit "USFWS")
# The official b-roll collection (fws.gov/library/collections/b-roll-videos) is Vbrick-streamed with NO
# public download — not scriptable. These YouTube equivalents ARE downloadable. Requires: yt-dlp, ffmpeg.
# Usage: point OUT at a Google-Drive-synced folder to avoid laptop clutter, then run.
set -e
OUT="${1:-./usfws-broll}"
mkdir -p "$OUT"; cd "$OUT"
# curated scenic / wildlife b-roll (id  # title)
IDS=(
  UdbuUD9tB4g   # Chimney Swifts b-roll
  S6LMlgMOmGY   # Sandhill Cranes Gathering B-roll
  27NTHJRZcec   # Birds & Scenic Footage - Breton & Delta NWR
  KyznrTCZkRY   # Nowitna Wild and Scenic River, Alaska
  d3j3hJQW2EA   # Wind Wild and Scenic River - Arctic Refuge
  m7Mp3EEt9Yk   # Winter at Klamath Basin NWR
  X7mNWz_cfeg   # Prime Hook Salt Marsh (airboat)
  oVPaYYIeFnY   # Bat b-roll
  ILdJYiA8XOY   # White bison calf - Neal Smith NWR
  TFC_1GoNsa8   # America's Wildest Refuge - Arctic (scenic)
  44Pc7BUTMlA   # High Desert Wildlife
  kv9jMjNY_ac   # Secrets of Santee NWR
)
for id in "${IDS[@]}"; do
  yt-dlp -f "bv*[height<=1080]+ba/b[height<=1080]" --merge-output-format mp4 \
    -o "%(title).70s [%(id)s].mp4" "$id"
done
echo "Done -> $OUT"
