---
title: "SEO for Static Sites: Beyond the Basics"
description: "JSON-LD, Open Graph, sitemaps, llms.txt, and content negotiation — the SEO features built into this starter."
date: 2026-05-05
author: admin
tags:
  - seo
  - tutorial
keywords: "SEO, JSON-LD, Open Graph, sitemap, static site, structured data, llms.txt"
---

Static sites have a natural SEO advantage: fast load times, clean HTML, and no JavaScript-dependent rendering. But there's more you can do. This starter includes several SEO features that go beyond the basics.

## Structured data with JSON-LD

Every page includes structured data using JSON-LD (JavaScript Object Notation for Linked Data). This helps search engines understand the content without guessing:

**Homepage**: `WebSite`, `WebPage`, `Person`, and `BreadcrumbList` schemas tell search engines about the site, its author, and navigation structure.

**Blog posts**: `BlogPosting` with `datePublished`, `dateModified`, `author`, `headline`, and `image` properties. This powers rich snippets in search results — the date, author name, and thumbnail that appear below a result.

**Author pages**: `Person` and `ProfilePage` schemas link the author's social profiles and establish identity.

All structured data is generated from the same data files you edit (`site.json`, `users.json`, `person.json`), so it stays in sync automatically.

## Open Graph and Twitter Cards

Every page emits Open Graph meta tags for social sharing:

```html
<meta property="og:title" content="..." />
<meta property="og:description" content="..." />
<meta property="og:image" content="..." />
<meta property="og:type" content="article" />
```

Blog posts also include `article:published_time`, `article:modified_time`, and `article:author`. Twitter Card tags ensure large image previews when shared on X.

## Sitemaps that reflect reality

The sitemap is generated dynamically from all pages. What makes it useful:

- Pages with `eleventyExcludeFromCollections` or `unlisted: true` are excluded
- `lastmod` uses the *computed* modified date — the newer of the Git history date and the global `site.modified` setting
- Dates are in ISO 8601 format as required by the spec

## RSS that's human-readable

The RSS feed includes an XSL stylesheet that renders it as a readable page in browsers. When someone visits `/feed.xml` directly, they see a styled page explaining what RSS is and how to subscribe — not raw XML.

## llms.txt for AI agents

The starter includes `llms.txt`, a proposed standard for helping AI language models discover and read site content. It provides:

- A site description
- Links to all blog posts as Markdown files
- Links to all pages
- A full-text version of the entire site

This is the equivalent of `robots.txt` for AI — a structured way to say "here's my content, and here's how to read it."

## Content negotiation

On Apache servers, the `.htaccess` file enables content negotiation. When a client sends `Accept: text/markdown`, blog posts are served as raw Markdown instead of HTML. This is useful for:

- AI agents that prefer Markdown over HTML
- Tools that want to fetch the source content
- RSS readers that process Markdown natively

---

SEO for static sites isn't about tricks. It's about giving machines the same clear structure you give humans — and doing it at build time so it's always correct.
