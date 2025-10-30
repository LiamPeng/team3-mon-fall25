#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/var/app/current"
BUILD_DIR="$APP_DIR/frontend_build"
STATIC_ROOT="$APP_DIR/staticfiles"

#
echo "[postdeploy] Sync Vite build assets -> $STATIC_ROOT"
mkdir -p "$STATIC_ROOT"

# Copy index.html
if [ -f "$BUILD_DIR/index.html" ]; then
  cp -f "$BUILD_DIR/index.html" "$STATIC_ROOT/index.html"
else
  echo "[postdeploy][WARN] $BUILD_DIR/index.html not found"
fi

# copy assets dir
if [ -d "$BUILD_DIR/assets" ]; then
  rsync -a --delete "$BUILD_DIR/assets/" "$STATIC_ROOT/assets/"
else
  echo "[postdeploy][WARN] $BUILD_DIR/assets not found"
fi

if [ -f "$BUILD_DIR/vite.svg" ]; then
  cp -f "$BUILD_DIR/vite.svg" "$STATIC_ROOT/vite.svg"
fi

echo "[postdeploy] Done."