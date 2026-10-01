#!/usr/bin/env bash
# Sestaví aplikaci pro GitHub Pages a pushne ji do větve gh-pages.
set -euo pipefail
cd "$(dirname "$0")"
BASE_PATH=/minihry-prvouky/ npx vite build
cp dist/index.html dist/404.html
touch dist/.nojekyll
rev=$(git rev-parse --short HEAD)
tmp=$(mktemp -d)
cp -R dist/. "$tmp"
cd "$tmp"
git init -q -b gh-pages
git add -A
git -c user.name="$(git -C "$OLDPWD" config user.name)" -c user.email="$(git -C "$OLDPWD" config user.email)" commit -q -m "Nasazení $rev"
git push -q -f "$(git -C "$OLDPWD" remote get-url origin)" gh-pages
rm -rf "$tmp"
echo "Nasazeno: https://vividbooks.github.io/minihry-prvouky/ ($rev)"
