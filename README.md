# Minihry prvouky (Vividbooks)

Minihry k pracovním učebnicím prvouky pro 1. a 2. ročník: poznávačka zvířat, ovoce a zelenina,
hodiny, rok a den, bezpečně venku. Vzhled i ovládání jsou převzaté z matematických Miniher
(projekt `Vividbooks minihry`), jde ale o samostatnou aplikaci.

Učitel si hru nastaví (ročník, témata podle stran sešitu, počet úloh), nasdílí odkaz nebo QR
kód a žáci ji spustí s tím nastavením. Vše se zvětšuje podle obrazovky – počítá se
s interaktivní tabulí.

## Vývoj

```bash
npm install
npm run dev
```

## Kde co je

- `src/app/prvouka/data` – úlohy a generátory (stejná data jako v Vividbooks Ultra, `features/prvouka-hry`)
- `src/app/prvouka/PrvoukaGame.tsx`, `PrvoukaKit.tsx`, `PrvoukaBoards.tsx` – herní plocha
- `src/app/prvouka/registry.ts` – seznam her pro rozcestník a konfigurátor
- `public/prvouka` – fotky (licence v `foto/credits.json`), ilustrace z Figmy, dopravní značky

## Nasazení

GitHub Pages z větve `gh-pages` (https://vividbooks.github.io/minihry-prvouky/):

```bash
./deploy-pages.sh
```

Skript sestaví aplikaci s `BASE_PATH=/minihry-prvouky/` a pushne obsah `dist` do `gh-pages`.
