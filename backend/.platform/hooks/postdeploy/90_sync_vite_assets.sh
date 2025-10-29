#!/bin/bash
set -euo pipefail

APP_DIR="/var/app/current"

if [ -d "$APP_DIR/frontend_build/assets" ]; then
  mkdir -p "$APP_DIR/staticfiles/assets"
  rsync -a --delete "$APP_DIR/frontend_build/assets/" "$APP_DIR/staticfiles/assets/"
fi
