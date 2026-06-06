---
title: "Welcome to Eleventy Starter"
description: "An introduction to what's included in this starter, how it's structured, and how to make it yours."
date: 2026-05-20
author: admin
tags:
  - eleventy
  - getting-started
keywords: "eleventy, starter, static site, blog, getting started"
---

You're looking at the first post of a new site built with Eleventy Starter — a small, opinionated template for people who write in Markdown and ship static HTML.

This post is a quick tour of what's included and how to get started.

## What you get

Out of the box, this starter ships with:

- **Eleventy 3** with ESM configuration and Liquid templates
- **Five layouts**: home, blog archive, article, author profile, and a generic page
- **Dark mode** that works without JavaScript, using a three-layer CSS priority system
- **RSS feed** with an XSL stylesheet for human-readable browser rendering
- **JSON-LD** structured data for search engines
- **Syntax highlighting** via Prism, loaded only on pages that need it
- **Contact form** backed by a PHP handler with honeypot spam protection

## Project structure

The source lives in `src/`. Data files in `src/_data/` control the site's identity. Layouts and partials live in `src/_includes/`. Blog posts go in `src/blog/posts/`.

```text
src/
├── _data/          # site.json, users.json, person.json
├── _includes/
│   ├── layouts/    # base, home, article, blog, author, contact, page
│   └── partials/   # nav, footer, post-card, pagination, ...
├── blog/posts/     # your markdown posts
├── static/         # CSS, favicons, images
└── index.liquid    # homepage
```

## Writing your first post

Create a new `.md` file in `src/blog/posts/` with front matter like this:

```yaml
---
title: "My First Post"
description: "A short description for search engines and social cards."
date: 2026-05-21
author: admin
tags:
  - writing
---
```

Then write your content in Markdown. Eleventy handles the rest — layout, navigation, RSS, sitemap, and social cards are all automatic.

## Configuration

Edit three files to make the starter yours:

1. **`src/_data/site.json`** — site title, URL, description, email
2. **`src/_data/users.json`** — author profiles (name, bio, social links)
3. **`src/_data/person.json`** — JSON-LD identity for search engines

## Running locally

```bash
npm install
npm run dev
```

The dev server starts at `http://localhost:8080` with live reload. For production builds:

```bash
npm run build
```

This minifies HTML, inlines CSS/JS, and outputs everything to `_site/`.

---

That's the tour. Delete this post when you're ready, or keep it as a reference. Happy writing.
