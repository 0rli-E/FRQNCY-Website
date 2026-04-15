#!/bin/bash
# FRQNCY local dev server — double-click this file in Finder to start
cd "$(dirname "$0")"
echo "Starting FRQNCY server at http://localhost:3000"
echo "Press Ctrl+C to stop"
open http://localhost:3000
python3 -m http.server 3000
