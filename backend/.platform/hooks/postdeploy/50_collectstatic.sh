#!/usr/bin/env bash
set -euo pipefail

cd /var/app/current

export DJANGO_SETTINGS_MODULE=core.settings

echo "[postdeploy] Running collectstatic"

/var/app/venv/*/bin/python manage.py collectstatic --noinput
echo "[postdeploy] collectstatic done."