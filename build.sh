#!/usr/bin/env bash
# Собирает docs/ для GitHub Pages: оборачивает index.html в полноценный HTML-документ
# и копирует скрипты. Запуск: ./build.sh
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p docs
{
  echo '<!doctype html><html lang="ru"><head><meta charset="utf-8">'
  echo '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
  echo '</head><body>'
  cat index.html
  echo '</body></html>'
} > docs/index.html
cp data.js images.js search.js app.js docs/
mkdir -p docs/img && cp img/* docs/img/
touch docs/.nojekyll
echo "docs/ собран"
