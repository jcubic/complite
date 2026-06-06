<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:atom="http://www.w3.org/2005/Atom">
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html xmlns="http://www.w3.org/1999/xhtml" lang="en">
      <head>
        <title><xsl:value-of select="/rss/channel/title"/> — RSS Feed</title>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <style>
          *{box-sizing:border-box;margin:0;padding:0}
          body{font-family:-apple-system,BlinkMacSystemFont,system-ui,sans-serif;line-height:1.7;color:#1a1a2e;max-width:700px;margin:0 auto;padding:2rem 1.5rem}
          h1{font-size:1.8rem;letter-spacing:-0.02em;margin-bottom:0.5rem}
          .subtitle{color:#666;margin-bottom:2rem}
          .notice{background:#f0f4ff;border:1px solid #ccd;border-radius:8px;padding:1rem 1.25rem;margin-bottom:2rem;font-size:0.9rem;color:#445}
          .notice strong{color:#1a1a2e}
          .item{border-bottom:1px solid #e8e8e8;padding:1.25rem 0}
          .item:last-child{border:0}
          .item h2{font-size:1.1rem;margin-bottom:0.25rem}
          .item h2 a{color:#1a1a2e;text-decoration:none}
          .item h2 a:hover{color:#3366cc}
          .item .meta{font-size:0.8rem;color:#888;font-family:monospace;letter-spacing:0.02em}
          .item p{color:#555;margin-top:0.5rem;font-size:0.95rem}
          a{color:#3366cc}
        </style>
      </head>
      <body>
        <h1>📡 <xsl:value-of select="/rss/channel/title"/></h1>
        <p class="subtitle"><xsl:value-of select="/rss/channel/description"/></p>
        <div class="notice">
          <strong>This is an RSS feed.</strong> Subscribe by copying the URL into your RSS reader. Visit <a href="https://aboutfeeds.com">aboutfeeds.com</a> to learn more about RSS.
        </div>
        <xsl:for-each select="/rss/channel/item">
          <div class="item">
            <h2><a><xsl:attribute name="href"><xsl:value-of select="link"/></xsl:attribute><xsl:value-of select="title"/></a></h2>
            <div class="meta"><xsl:value-of select="pubDate"/></div>
            <p><xsl:value-of select="description"/></p>
          </div>
        </xsl:for-each>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
