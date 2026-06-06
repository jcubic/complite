# complite — Implementation Plan

Turn the static HTML/CSS design in `design/` into a fully functional Eleventy 3 starter project
with all the key features from the WikiZEIT architecture, adapted for a generic English-language
blog.

---

## Phase 1 — Project Scaffold

### 1.1 Initialize Node.js project

- `package.json` with `"type": "module"` (ESM)
- Scripts: `build`, `dev`, `watch`, `lint`
- Dev dependencies: `@11ty/eleventy` ^3.1, `@11ty/eleventy-plugin-syntaxhighlight`,
  `eleventy-plugin-svg-social-card`, `terser`, `eslint`, `@eslint/markdown`
- Production dependency: `html-minifier-next`

### 1.1b Initialize Composer (PHP)

- `composer.json` with `wikimedia/minify` ^2.10 and `wikizeit/html-minifier` ^0.1.0
- `vendor/` copied to output via passthrough
- `config.json` in `.gitignore`

### 1.2 Eleventy config (`.eleventy.js`)

- Input: `src/`, output: `_site/`, includes: `_includes/`, data: `_data/`
- Template formats: `liquid`, `md`, `html`
- Liquid as HTML and Markdown template engine
- `pathPrefix: "/"`
- Passthrough copy: `src/static/` → output root, `api/` → `/api`, `vendor/` → `/vendor`
- Social card plugin with SVG templates

**Collections:**
- `post` — `src/blog/posts/*.md` sorted by date DESC
- `author` — `src/authors/*.md`
- `tagsList` — unique tags excluding internal ones (`post`, `all`)

**Filters:**
- `dateFormat` — English locale ("May 12, 2026", ISO, short)
- `readingTime` — word count / 200 wpm
- `excerpt` — first N chars, strip HTML
- `limit` — array slice
- `contentHash` — MD5 of file for cache busting
- `xml_escape` — RSS-safe escaping
- `jsonify` — JSON.stringify for JSON-LD
- `slugify` — URL-safe slugs
- `mdAlternate` — map page URL to its markdown equivalent
- `rawMarkdown` — read source file, strip front matter
- `markdownLinks` — rewrite internal links to `.md` in markdown output
- `markdownify` — inline markdown rendering (markdown-it)
- `newerDate` — return the more recent of two dates
- `utmRss` — append UTM params to URLs

**Transform (production only):**
- `html-minifier-next` for `.html` files
- Inline JS minified via Terser (compress: false)
- Inline CSS minified
- Comments removed except `form-message-placeholder`

### 1.3 Computed data (`src/src.11tydata.js`)

- `modified` field computed from the **newer** of:
  - git history date (`git log -1 --format=%ai`)
  - global `site.modified` from `site.json` (a site-wide "last updated" date for sitemap)
- Only surfaces when the inferred date is genuinely newer than the page's `date` (compared at
  day precision to avoid false positives from time-of-day differences)
- Explicit `modified` in frontmatter always wins over both git and global
- The global `site.modified` field sets a floor — update it in `site.json` whenever a
  non-content change (CSS, layout, config) affects all pages

### 1.4 Data files (`src/_data/`)

**`site.json`:**
```json
{
  "title": "Eleventy Starter",
  "description": "A minimal, fast static site starter for writers.",
  "url": "https://example.com",
  "language": "en",
  "author": "admin",
  "modified": "2026-05-19",
  "email": "hello@example.com",
  "socialImage": "/img/social-card.png",
  "foundingDate": "2026-01-01"
}
```

**`users.json`:**
```json
{
  "admin": {
    "name": "admin",
    "fullname": "Your Name",
    "bio": "A short author bio. Edit src/_data/users.json to customize.",
    "photo": "/img/avatars/admin.jpg",
    "social": {
      "github": "https://github.com/yourusername",
      "mastodon": "",
      "twitter": "",
      "linkedin": ""
    }
  }
}
```

**`person.json`:**
- JSON-LD Person schema (configurable name, jobTitle, sameAs links)

### 1.5 ESLint config (`eslint.config.js`)

- `@eslint/markdown` recommended config
- Ignore `.#*` (Emacs lock files)
- `npm run lint` script

### 1.6 `.gitignore`

Only project specific:

- `_site/`, `node_modules/`, `*.log`, `api/config.json`, `api/mail/`, `api/logs/`

---

## Phase 2 — Layouts and Partials

Convert design HTML into Liquid templates. All SVG icons from the design are extracted into
partials for reuse.

### 2.1 `src/_includes/head.liquid`

From design `<head>` + WikiZEIT patterns:
- `<title>`, `<meta description>`, `<meta keywords>`
- `<meta robots content="noindex, nofollow">` when `unlisted: true`
- Favicon links (PNG 96x96, SVG, ICO, apple-touch-icon, web manifest)
- Open Graph: url, type (article vs website), locale, site_name, title, description, image
- Article OG: published_time, modified_time, author
- Twitter Card: summary_large_image
- Canonical URL
- Pagination prev/next links
- RSS alternate link
- Markdown alternate link via `mdAlternate` filter
- CSS with cache-busting hash (`?v={{ hash }}`)
- Conditional Prism CSS for articles with code blocks
- Google Fonts preconnect + Inter + JetBrains Mono (from design)

### 2.2 `src/_includes/layouts/base.liquid`

From design global frame:
- Inline theme script in `<head>` (localStorage check → set `data-theme`)
- `<body class="no-transitions">` to prevent flash
- Include: head, nav, content, footer, mobile-nav
- Schema conditional include (home, article, author)
- Inline JS: theme toggle, mobile menu, transition guard removal
- `no-transitions` class removed via `requestAnimationFrame` after load

**Dark mode — three-layer priority system (like WikiZEIT):**

The theme toggle is a pair of **radio buttons** (`<input type="radio" name="mode">`) with
`<label>` wrappers showing sun/moon SVG icons. The radios are visually hidden (`appearance:none;
opacity:0`) and the labels are styled as icon buttons.

**Priority 1 (lowest): System preference (pure CSS, no JS)**
```css
@media (prefers-color-scheme: dark) {
  :root { /* dark variables */ }
}
```

**Priority 2: JS `data-theme` attribute (overrides system)**
```css
:root[data-theme="dark"] { /* dark variables */ }
:root[data-theme="light"] { /* light variables */ }
```
JS reads localStorage on load and sets `data-theme`. Also listens for radio `change`
events and persists the choice.

**Priority 3 (highest): CSS `:has()` radio check (overrides everything, pure CSS)**
```css
:root:has(#mode_dark:checked) { /* dark variables */ }
:root:has(#mode_light:checked) { /* light variables */ }
```
When a user clicks the label, the radio gets `:checked` and CSS applies immediately
via `:has()` — no JS needed for the visual change.

**Icon visibility** follows the same three layers:
- Default: show moon (switch to dark). In `prefers-color-scheme: dark`: show sun.
- `[data-theme="dark"]`: show sun. `[data-theme="light"]`: show moon.
- `:has(#mode_dark:checked)`: show sun. `:has(#mode_light:checked)`: show moon.

**Result:** Works fully without JS (system preference). With JS disabled but radio
clicked, CSS `:has()` handles the switch. JS adds localStorage persistence across pages.

### 2.3 `src/_includes/layouts/home.liquid`

From design `index.html`:
- Hero section (eyebrow, headline, lede, CTAs)
- Recent posts grid (4 posts, 2-column)
- Social sharing image placeholder section

### 2.4 `src/_includes/layouts/article.liquid`

From design `post.html`:
- Cover image (featuredImage or placeholder) only for HTML meta tags
- Post header: tags, title, author (avatar + name link), date, reading time, modified date
- Two-column layout: prose content + sidebar
- Sidebar: author card + related articles (3 latest posts)
- Comments placeholder section (toggled globally)

### 2.5 `src/_includes/layouts/blog.liquid`

From design `blog.html`:
- Eyebrow with page number
- Post card list
- Pagination: 6 posts per page
- Prev/next with page counter

### 2.6 `src/_includes/layouts/author.liquid`

From design `author.html`:
- Author hero: large avatar, name, role, bio, social links
- Published posts list (title + date rows)

### 2.7 `src/_includes/layouts/contact.liquid`

From design `contact.html`:
- Contact intro
- Form card wrapper

### 2.8 `src/_includes/layouts/page.liquid`

From design `about.html`:
- Generic prose content layout with `.bio` wrapper

### 2.9 Partials (`src/_includes/partials/`)

| Partial                 | Source                    |
|-------------------------|---------------------------|
| `nav.liquid`            | Design header nav         |
| `mobile-nav.liquid`     | Design hamburger + panel  |
| `footer.liquid`         | Design footer + subscribe |
| `post-card.liquid`      | Design `.post-card`       |
| `pagination.liquid`     | Design `.pagination`      |
| `tag-list.liquid`       | Design `.tag-list`        |
| `subscribe.liquid`      | Design subscribe form     |
| `author-card.liquid`    | Design sidebar author card|
| `social-icons.liquid`   | SVG icons extracted       |
| `schema-home.liquid`    | JSON-LD for homepage      |
| `schema-article.liquid` | JSON-LD for blog posts    |
| `schema-author.liquid`  | JSON-LD for author pages  |

---

## Phase 3 — CSS

### 3.1 Convert dark mode to CSS-first (three-layer system)

Current design CSS has dark mode only via `[data-theme="dark"]`. Convert to three layers:

```css
/* Light mode (default) */
:root { --bg: oklch(99% ...); ... }

/* --- Priority 1: system preference (lowest) --- */
@media (prefers-color-scheme: dark) {
  :root { --bg: oklch(15% ...); ... }
}

/* --- Priority 2: JS data-theme attribute (overrides system) --- */
:root[data-theme="dark"] { --bg: oklch(15% ...); ... }
:root[data-theme="light"] { --bg: oklch(99% ...); ... }

/* --- Priority 3: CSS :has() radio (highest, overrides everything) --- */
:root:has(#mode_dark:checked) { --bg: oklch(15% ...); ... }
:root:has(#mode_light:checked) { --bg: oklch(99% ...); ... }
```

Also convert the `.theme-toggle` button styles to **radio button + label** styles:
- Radio inputs: `appearance: none; opacity: 0; position: absolute; pointer-events: none`
- Labels: styled as icon buttons (same dimensions as current `.theme-toggle`)
- Icon visibility: three layers matching the variable priority

The design's current `<button class="theme-toggle">` in each HTML page will be replaced
by radio inputs + labels in the `nav.liquid` partial.

### 3.2 Main stylesheet (`src/static/css/style.css`)

- Copy design `styles.css` with the dark mode conversion above
- Remove `overview.html`-specific styles (not needed in starter)
- Keep all component styles as-is (they map directly to the Liquid partials)

### 3.3 Syntax highlighting (`src/static/css/prism-tomorrow.css`)

- Use Prism theme that respects the CSS custom properties for code colors
- Or use the design's built-in `--code-*` variables with Prism token overrides
- Loaded conditionally on articles containing code blocks

---

## Phase 4 — Content

### 4.1 Blog posts (`src/blog/posts/`)

Write 4–5 posts about the starter itself, SSGs, and Eleventy:

1. **`welcome-to-eleventy-starter.md`** — Introduction to the starter, what's included, how to
   get started. Tags: `eleventy`, `getting-started`.
2. **`why-static-site-generators.md`** — Why SSGs matter: speed, security, simplicity,
   version control. Tags: `ssg`, `essay`.
3. **`dark-mode-done-right.md`** — CSS-first dark mode with JS augmentation, the approach used
   in this starter. Tags: `css`, `design`, `tutorial`.
4. **`seo-for-static-sites.md`** — JSON-LD, Open Graph, sitemaps, llms.txt, and content
   negotiation in a static site context. Tags: `seo`, `tutorial`.
5. **`markdown-and-the-open-web.md`** — Serving content as markdown for AI agents, RSS for
   humans, and the value of multiple content representations. Tags: `open-web`, `markdown`.

Each post has front matter: `title`, `description`, `date`, `author`, `tags`, `keywords`.

### 4.2 Author profile (`src/authors/admin.md`)

- Front matter: name, layout, permalink (`/author/admin/`)
- Content: placeholder bio text
- References `users.json` for data

### 4.3 Static pages

| Page                        | File                      | Layout          |
|-----------------------------|---------------------------|-----------------|
| Home                        | `src/index.liquid`        | `home.liquid`   |
| About                       | `src/about.md`            | `page.liquid`   |
| Contact                     | `src/contact/index.liquid`| `contact.liquid` |
| Privacy Policy              | `src/privacy.md`          | `page.liquid`   |
| 404                         | `src/404.md`              | `base.liquid`   |
| Tags index                  | `src/tags/index.liquid`   | `base.liquid`   |
| Tag archive (per tag)       | `src/tags/tag.liquid`     | `base.liquid`   |

### 4.4 Contact form (PHP-backed)

The contact page outputs as `.php` (not `.html`) so it can inject form feedback messages
via the PHP wrapper pattern (like WikiZEIT).

**HTML form** (`src/contact/index.liquid`):
- `action="{{ site.apiUrl }}/contact/"` with `method="POST"`
- Hidden `redirect_url` field pointing back to the contact page
- Fields: name, email, subject, message
- Honeypot field (`confirm_email`, hidden via `.hp` class)
- Privacy consent notice linking to `/privacy/`
- `<!-- form-message-placeholder -->` comment (preserved by minifier)

**PHP wrapper** (`src/static/contact/index.php`):
- Reads sibling `index.html` generated by Eleventy
- Checks `?msg=` query parameter
- Replaces `<!-- form-message-placeholder -->` with styled message HTML
- Messages: `contact_success`, `contact_error`, `bot_error`

**PHP handler** (`api/contact/index.php`):
- POST only (405 for other methods)
- Reads `config.json` for recipient email address
- **If `config.json` is missing:** redirects with `config_error` message telling the user
  to set up `api/config.json` (copy from `api/config.example.json`)
- Honeypot check → log + redirect with `bot_error`
- Sanitize: `sanitizeHeader()` strips CR/LF, `FILTER_VALIDATE_EMAIL`
- Open redirect prevention: `sanitizeRedirectUrl()` validates path prefix
- Sends plain-text email via `mail()` with Reply-To from form submitter
- Falls back to mock email (`api/mail/index.html`) when `mail()` is unavailable (local dev)
- Redirects with `contact_success` or `contact_error`

**Configuration files:**

`api/config.example.json` (committed):
```json
{
  "contact_email": "you@example.com",
  "site_url": "https://example.com/"
}
```

`api/config.json` (gitignored, user creates from example):
- Same structure, with real values
- Read by `api/lib/common.php` on every request

**PHP shared lib** (`api/lib/common.php`):
- Loads `config.json` (or exits with error if missing)
- `sendPlainEmail()` with Reply-To
- `mockMail()` fallback for local dev (saves to `api/mail/index.html`)
- `isMailAvailable()` check
- `sanitizeHeader()`, `sanitizeRedirectUrl()`, `buildRedirectUrl()`
- `logBotAttempt()` to `api/logs/bot.log`

**base.liquid PHP wrapping** (same pattern as WikiZEIT):
- When `page.outputPath` contains `.php`: `ob_start()` at top, minify + flush at bottom
- Uses `WikiZEIT\HTMLMinifier` with `preserveComment('form-message-placeholder')`

---

## Phase 5 — SEO and Discovery

### 5.1 JSON-LD structured data

**Homepage (`schema-home.liquid`):**
- `@graph` with: Person, WebPage, WebSite, BreadcrumbList

**Article (`schema-article.liquid`):**
- `@graph` with: Person, BlogPosting (dates, author, headline, image, speakable),
  WebPage, Blog, WebSite, BreadcrumbList (Home → Blog → Article)
- Conditional FAQPage from front matter `faq` array

**Author (`schema-author.liquid`):**
- Person with sameAs links, ProfilePage

### 5.2 Sitemap (`src/sitemap.liquid`)

- Dynamic from `collections.all`
- Excludes pages with `eleventyExcludeFromCollections` or `unlisted`
- `lastmod` uses `modified` (computed from git + `site.modified`) or `date`
- ISO date format

### 5.3 RSS feed (`src/feed.liquid`)

- RSS 2.0 with Atom self-link
- UTM tracking on post links via `utmRss` filter
- XSL stylesheet for human-readable browser rendering (`src/static/pretty-feed.xsl`)
- Categories from tags
- Author per post

### 5.4 robots.txt (`src/static/robots.txt`)

```
Sitemap: https://example.com/sitemap.xml

User-agent: *
Allow: /

User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Applebot-Extended
Allow: /
```

### 5.5 llms.txt (`src/llms.txt.liquid`)

- Project description
- Blog post list with markdown links
- Pages list with markdown links
- Authors list
- Link to full-text version

### 5.6 Markdown content views

- `src/llms-posts.liquid` — raw markdown per blog post (pagination, 1 per page)
- `src/llms-full.txt.liquid` — full text of entire site
- Per-section views: `llms-about.liquid`, `llms-blog.liquid`, `llms-contact.liquid`,
  `llms-privacy.liquid`

### 5.7 .htaccess (Apache content negotiation + security)

- `AddCharset UTF-8 .txt .md`
- `AddType text/markdown .md`
- HTTP Link headers: sitemap + llms.txt
- Content negotiation: `Accept: text/markdown` → serve `.md` files
- Custom 404 handler → `404.html`
- Rewrite rules for blog, about, contact, privacy, author

**Security rules:**
- Block access to `api/config.json`, `api/lib/`, `api/logs/`, `api/mail/`
- Block `vendor/`
- Block `api/composer.json|lock`

**Note in README:** This file is for Apache deployments. Nginx/Netlify/Vercel users need
equivalent configuration.

---

## Phase 6 — Social Cards

### 6.1 SVG templates

**`src/card/social-card.svg`:**
- Blog post OG image template (1200×630)
- Liquid placeholders: `{{ title }}`, `{{ fullname }}`, `{{ date }}`
- Design matches the starter's visual style (Inter font, accent color)

**`src/card/default-card.svg`:**
- Site-wide fallback OG image
- Shows "Eleventy Starter" branding

### 6.2 Plugin config in `.eleventy.js`

- `eleventy-plugin-svg-social-card` configured for the `article` card type
- Output to `_site/img/social-cards/`
- Data function extracts title, author name, date from context

### 6.3 Static fallback image

- `src/static/img/social-card.png` — default site-wide OG image
- Referenced in `site.json` as `socialImage`
- Used when no dynamic card is generated (non-article pages)

---

## Phase 7 — JavaScript

### 7.1 Inline only (no external JS files)

All JS is inline in Liquid templates, minified by Terser in production:

**`base.liquid` `<head>` (pre-render):**
```js
(function() {
  try {
    var s = localStorage.getItem('theme');
    if (s === 'dark' || s === 'light') {
      document.documentElement.setAttribute('data-theme', s);
    }
  } catch(_) {}
})();
```

**`base.liquid` end of `<body>`:**
- Radio `change` listener on `input[name="mode"]`: sets `data-theme`, persists to localStorage
- Restore checked radio from localStorage on load
- Mobile menu toggle (body class, ARIA attributes)
- Escape key closes mobile nav
- `no-transitions` class removal via requestAnimationFrame

### 7.2 No external JS requirement

Site works without JavaScript:
- Dark mode defaults to system preference via `@media (prefers-color-scheme: dark)`
- Radio click applies theme via CSS `:has(#mode_dark:checked)` — no JS needed
- Navigation works as standard links (no JS-dependent menu on desktop)
- Forms submit normally via HTTP POST to PHP backend
- Content is fully rendered in HTML
- JS only adds: localStorage persistence across pages, mobile nav panel

---

## Phase 8 — Static Assets and Docker

### 8.1 Favicon set (`src/static/favicon/`)

- `favicon.svg` — simple "11" mark from the design
- `favicon-96x96.png`
- `favicon.ico`
- `apple-touch-icon.png` (180×180)
- `site.webmanifest`

### 8.2 Placeholder images

- `src/static/img/avatars/admin.jpg` — placeholder avatar (gradient or initials)
- `src/static/img/social-card.png` — default OG image

### 8.3 Docker (local development with PHP)

**`Dockerfile`:**
- `php:8.3-apache`
- Enable `mod_rewrite`, `mod_headers`
- Install `pdo_sqlite` extension (for future use)
- Configure `AllowOverride All` for `.htaccess`
- Port 8080 (non-root)
- Copy `_site/` to `/var/www/html`

**`docker-compose.yaml`:**
```yaml
services:
  web:
    build: .
    ports: ["8080:8080"]
    volumes: ["./_site:/var/www/html"]
    security_opt: ["label:disable"]
    user: "${UID:-1000}:${GID:-1000}"
```

**Usage:** `npm run build && docker compose up -d` → `http://localhost:8080/`
The PHP contact form, `.htaccess` rewrites, and form message injection all work locally.

---

## Phase 9 — Validation and CI

### 9.1 Validation scripts (`scripts/`)

**`validate-jsonld.mjs`:**
- Scan all `_site/**/*.html` for `application/ld+json` script blocks
- Parse each as JSON, exit 1 on failure

**`validate-social-card.mjs`:**
- Validate SVG templates are well-formed XML

### 9.2 GitHub Actions (`.github/workflows/deploy.yaml`)

```yaml
jobs:
  lint:
    - Checkout, setup Node 22
    - npm ci
    - npm run lint (ESLint markdown)

  build:
    needs: lint
    - Checkout, setup Node 22
    - npm ci
    - composer install --no-dev --optimize-autoloader
    - Install Playwright Chromium (for social cards)
    - npm run build
    - Validate JSON-LD
    - Upload _site/ artifact (for manual download or further deploy steps)
```

**Note:** The deploy step is left as a placeholder — users configure their own deployment
target. Requires PHP-capable hosting (Apache with mod_rewrite) for the contact form and
content negotiation.

---

## Phase 10 — Documentation

### 10.1 README.md

Sections:
- **Overview** — what the starter includes
- **Quick start** — clone, npm install, composer install, npm run dev
- **Features** — bulleted list of all features
- **Project structure** — directory tree with annotations
- **Configuration** — how to edit `site.json`, `users.json`, `person.json`
- **Writing posts** — front matter reference, tags, FAQ schema
- **Contact form** — PHP backend setup: copy `config.example.json` → `config.json`,
  set `contact_email`; Docker for local testing with `mockMail` fallback
- **Dark mode** — three-layer CSS-first approach (system → JS → radio `:has()`)
- **SEO** — JSON-LD, OG, sitemap, robots.txt
- **llms.txt** — LLM agent discovery
- **Content negotiation** — .htaccess for Apache, notes for other servers
- **Social cards** — how they're generated, customizing the SVG template
- **Local development** — Docker (PHP 8.3 + Apache) for testing forms and .htaccess
- **Deployment** — requires PHP-capable hosting; GitHub Actions placeholder
- **License** — MIT

### 10.2 LICENSE

MIT license, copyright 2026 Jakub T. Jankiewicz.

### 10.3 CLAUDE.md

Project instructions for AI assistants working on the codebase.

---

## File Inventory (final)

```
eleventy-starter/
├── .eleventy.js
├── package.json
├── composer.json
├── eslint.config.js
├── .gitignore
├── Dockerfile
├── docker-compose.yaml
├── README.md
├── LICENSE
├── CLAUDE.md
├── design/                          # Original design files (reference only)
├── scripts/
│   ├── validate-jsonld.mjs
│   └── validate-social-card.mjs
├── .github/workflows/
│   └── build.yaml
├── api/                             # PHP backend (copied to output via passthrough)
│   ├── contact/index.php            # Contact form handler
│   ├── lib/
│   │   └── common.php               # Shared: config, email, security utilities
│   ├── config.example.json          # Committed — copy to config.json with real values
│   ├── config.json                  # Gitignored — user's real config
│   ├── logs/                        # Gitignored — bot attempt logs
│   └── mail/                        # Gitignored — mock emails for local dev
├── vendor/                          # Composer dependencies (copied to output)
├── src/
│   ├── _data/
│   │   ├── site.json
│   │   ├── users.json
│   │   └── person.json
│   ├── _includes/
│   │   ├── head.liquid
│   │   ├── layouts/
│   │   │   ├── base.liquid          # PHP wrapping for .php output (ob_start + minify)
│   │   │   ├── home.liquid
│   │   │   ├── article.liquid
│   │   │   ├── blog.liquid
│   │   │   ├── author.liquid
│   │   │   ├── contact.liquid
│   │   │   └── page.liquid
│   │   └── partials/
│   │       ├── nav.liquid           # Includes theme radio buttons (sun/moon)
│   │       ├── footer.liquid
│   │       ├── post-card.liquid
│   │       ├── pagination.liquid
│   │       ├── tag-list.liquid
│   │       ├── subscribe.liquid
│   │       ├── author-card.liquid
│   │       ├── social-icons.liquid
│   │       ├── schema-home.liquid
│   │       ├── schema-article.liquid
│   │       └── schema-author.liquid
│   ├── static/
│   │   ├── robots.txt
│   │   ├── .htaccess                # Content negotiation + security rules
│   │   ├── pretty-feed.xsl
│   │   ├── contact/index.php        # PHP wrapper for form message injection
│   │   ├── css/
│   │   │   └── style.css
│   │   ├── favicon/
│   │   │   ├── favicon.svg
│   │   │   ├── favicon-96x96.png
│   │   │   ├── favicon.ico
│   │   │   ├── apple-touch-icon.png
│   │   │   └── site.webmanifest
│   │   └── img/
│   │       ├── avatars/admin.jpg
│   │       └── social-card.png
│   ├── blog/posts/
│   │   ├── welcome-to-eleventy-starter.md
│   │   ├── why-static-site-generators.md
│   │   ├── dark-mode-done-right.md
│   │   ├── seo-for-static-sites.md
│   │   └── markdown-and-the-open-web.md
│   ├── authors/
│   │   └── admin.md
│   ├── contact/
│   │   └── index.liquid             # Outputs .php via permalink
│   ├── tags/
│   │   ├── index.liquid
│   │   └── tag.liquid
│   ├── card/
│   │   └── social-card.svg
│   ├── index.liquid
│   ├── about.md
│   ├── privacy.md
│   ├── 404.md
│   ├── sitemap.liquid
│   ├── feed.liquid
│   ├── llms.txt.liquid
│   ├── llms-posts.liquid
│   ├── llms-full.txt.liquid
│   ├── llms-about.liquid
│   ├── llms-blog.liquid
│   ├── llms-contact.liquid
│   ├── llms-privacy.liquid
│   └── src.11tydata.js
└── _site/                           # Build output (gitignored)
```

---

## Implementation Order

1. **Phase 1** — Scaffold: package.json, composer.json, .eleventy.js, data files, eslint, gitignore
2. **Phase 3** — CSS: convert dark mode to three-layer system, copy design styles
3. **Phase 2** — Layouts and partials (needs CSS in place to test)
4. **Phase 7** — JavaScript (inline in layouts, radio change listeners)
5. **Phase 4** — Content: blog posts, author, static pages, PHP contact form + backend
6. **Phase 5** — SEO: JSON-LD, sitemap, RSS, robots.txt, llms.txt, .htaccess
7. **Phase 6** — Social cards: SVG template, plugin config
8. **Phase 8** — Static assets, Docker setup, favicons, placeholder images
9. **Phase 9** — Validation scripts and GitHub Actions (with composer install)
10. **Phase 10** — README, LICENSE, CLAUDE.md

**Build and test after each phase.** Verify `npm run build` succeeds and inspect output.
Test the contact form via Docker (`docker compose up -d`).
