#!/bin/bash
cd "/sessions/amazing-eager-dijkstra/mnt/FRQNCY WEBSITE/engine"
N=0
while IFS='|' read -r ID NAME; do
  N=$((N+1))
  echo "[$(date +%T)] START $N $ID ($NAME)" >> batch.log
  bash run_scene.sh "$ID" "$N" >> batch.log 2>&1 || echo "[$(date +%T)] FAIL $N $ID" >> batch.log
done < scenes.txt
echo "[$(date +%T)] ALL COMPLETE" >> batch.log
