---
title: "Markdown and the Open Web"
description: "Serving content as Markdown for AI agents, RSS for humans, and the value of multiple content representations."
date: 2026-04-28
author: admin
tags:
  - open-web
  - markdown
keywords: "markdown, open web, content negotiation, RSS, AI, llms.txt"
---

There's a quiet idea gaining traction: your content should be available in more than one format. Not just HTML for browsers, but Markdown for machines, RSS for readers, and plain text for everything else.

This starter is built around that idea.

## One source, many formats

Every blog post is written in Markdown. At build time, Eleventy renders it as HTML. But the source Markdown doesn't disappear — it's served alongside the HTML through several mechanisms:

**Direct Markdown files**: Each blog post is available as a `.md` file at a predictable URL. `/blog/my-post/` gives you HTML; `/blog/my-post.md` gives you Markdown.

**Content negotiation**: On Apache, requesting a blog post with `Accept: text/markdown` in the HTTP header returns the Markdown source instead of HTML. Same URL, different representation.

**llms.txt**: A machine-readable index at `/llms.txt` lists all content with Markdown links, following the proposed standard for AI agent discovery.

## Why this matters

### For readers

RSS gives readers a way out of the algorithm. A subscription that delivers content on their terms, in their reader, without tracking or recommendations. The RSS feed in this starter includes an XSL stylesheet so it's human-readable in a browser — because the first step to more RSS usage is making it less intimidating.

### For AI agents

Language models increasingly crawl the web. Markdown is dramatically easier for them to parse than HTML. By offering content as Markdown, you're giving AI agents a clean signal of your content without the noise of navigation, sidebars, and footer boilerplate.

The `llms.txt` file serves as a directory. Instead of crawling your entire site, an AI agent can read one file and understand what's available and how to access it.

### For the open web

Every additional format you serve is a vote for interoperability. It says: I don't control how you consume this content. I just make it available, in standard formats, at stable URLs.

## The Markdown alternate link

Each HTML page includes a `<link rel="alternate">` header pointing to its Markdown equivalent:

```html
<link rel="alternate" type="text/markdown" href="/blog/my-post.md" />
```

This is the same pattern used for RSS (`application/rss+xml`) and translations (`hreflang`). It's a standard mechanism — we're just applying it to a new media type.

## Full-text dumps

The starter also generates a full-text file at `/llms-full.txt` that contains every piece of content on the site in a single document. This is useful for AI training, archival, and anyone who wants to read the entire site offline.

---

The web is better when content is portable. Markdown is the format that makes portability practical — it's readable by humans, parseable by machines, and convertible to anything else. By serving it alongside HTML, we're not replacing the web. We're completing it.
