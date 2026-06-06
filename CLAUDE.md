# complite

## Build

```bash
npm install          # Install Node dependencies
npm run dev          # Dev server at localhost:8080
npm run build        # Production build to _site/
npm run lint         # ESLint on Markdown files
```

## Architecture

- **Eleventy 3** with ESM, Liquid templates, Markdown content
- Input: `src/`, Output: `_site/`, Includes: `src/_includes/`, Data: `src/_data/`
- Layouts chain: page → `layouts/*.liquid` → `layouts/base.liquid`
- Blog posts: `src/blog/posts/*.md` with shared `posts.json` for layout/tags
- CSS: single `src/static/css/style.css` with three-layer dark mode (system → JS → `:has()` radio)
- JS: all inline in `base.liquid`, no external scripts
- PHP: contact form backend in `api/`, wrapper in `src/static/contact/index.php`

## Key files

- `.eleventy.js` — config, filters, collections, transforms
- `src/_data/site.json` — site identity
- `src/_data/users.json` — author profiles
- `src/_includes/layouts/base.liquid` — root layout with theme JS
- `src/static/css/style.css` — all styles

## Conventions

- Template engine: Liquid (not Nunjucks)
- Date format filter: `dateFormat` with optional "iso", "short", "rfc822" argument
- Production HTML minification via `html-minifier-next` transform (only `.html` files)
- Passthrough copy: `src/static/` → root, `api/` → `/api`, `vendor/` → `/vendor`
