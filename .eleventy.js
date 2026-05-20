import path from 'path';
import { readFileSync } from 'fs';
import { createHash } from 'crypto';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import markdownIt from 'markdown-it';
import syntaxHighlight from '@11ty/eleventy-plugin-syntaxhighlight';
import { minify } from 'html-minifier-next';
import { minify as minifyJS } from 'terser';

const __dirname = dirname(fileURLToPath(import.meta.url));

const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

function formatDate(date) {
    const d = new Date(date);
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export default function(eleventyConfig) {

    eleventyConfig.addFilter("mdAlternate", function(pageUrl) {
        if (pageUrl === '/') return '/llms.txt';
        const blogPost = pageUrl.match(/^\/blog\/([^/]+)\/$/);
        if (blogPost) return `/blog/${blogPost[1]}.md`;
        const author = pageUrl.match(/^\/author\/([^/]+)\/$/);
        if (author) return `/author/${author[1]}.md`;
        if (['/about/', '/contact/', '/blog/', '/privacy/'].includes(pageUrl)) {
            return pageUrl.slice(0, -1) + '.md';
        }
        return null;
    });

    eleventyConfig.addFilter("rawMarkdown", function(inputPath) {
        const content = readFileSync(path.resolve(inputPath), 'utf-8');
        return content.replace(/^---[\s\S]*?---\n*/, '');
    });

    const md = markdownIt({ html: true, linkify: true });
    eleventyConfig.addFilter("markdownify", function(content) {
        if (!content) return "";
        return md.renderInline(content);
    });

    eleventyConfig.addFilter("markdownLinks", function(content) {
        if (!content) return "";
        return content.replace(
            /\]\(((https:\/\/example\.com)?(\/[^)]+))\)/g,
            (match, fullUrl, domain, urlPath) => {
                const d = domain || '';
                const blogPost = urlPath.match(/^\/blog\/([^/]+)\/$/);
                if (blogPost) {
                    return `](${d}/blog/${blogPost[1]}.md)`;
                }
                const author = urlPath.match(/^\/author\/([^/]+)\/$/);
                if (author) {
                    return `](${d}/author/${author[1]}.md)`;
                }
                if (['/about/', '/contact/', '/blog/', '/privacy/'].includes(urlPath)) {
                    return `](${d}${urlPath.slice(0, -1)}.md)`;
                }
                return match;
            }
        );
    });

    eleventyConfig.addPassthroughCopy({ "src/static": "/" });
    eleventyConfig.addPassthroughCopy({ "src/static/favicon/favicon.ico": "/favicon.ico" });
    eleventyConfig.addPassthroughCopy({ "api": "/api" });
    eleventyConfig.addPassthroughCopy({ "vendor": "/vendor" });

    eleventyConfig.addPlugin(syntaxHighlight);

    eleventyConfig.addCollection("post", function(collectionApi) {
        return collectionApi.getFilteredByGlob("src/blog/posts/*.md").sort((a, b) => {
            return b.date - a.date;
        });
    });

    eleventyConfig.addCollection("author", function(collectionApi) {
        return collectionApi.getFilteredByGlob("src/authors/*.md");
    });

    eleventyConfig.addCollection("tagsList", function(collectionApi) {
        const tagsSet = new Set();
        collectionApi.getAll().forEach(item => {
            if (item.data.tags) {
                item.data.tags.forEach(tag => {
                    if (tag !== "post" && tag !== "all") {
                        tagsSet.add(tag);
                    }
                });
            }
        });
        return [...tagsSet].sort();
    });

    eleventyConfig.addFilter("dateFormat", function(date, format) {
        const d = new Date(date);
        if (format === "iso") {
            return d.toISOString().split("T")[0];
        }
        if (format === "short") {
            const month = String(d.getMonth() + 1).padStart(2, "0");
            return `${d.getDate()}.${month}.${d.getFullYear()}`;
        }
        if (format === "rfc822") {
            return d.toUTCString();
        }
        return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
    });

    eleventyConfig.addFilter("newerDate", function(a, b) {
        return new Date(a) > new Date(b) ? a : b;
    });

    eleventyConfig.addFilter("readingTime", function(content) {
        if (!content) return "1 min";
        const words = content.split(/\s+/).length;
        const minutes = Math.ceil(words / 200);
        return `${minutes} min`;
    });

    eleventyConfig.addFilter("excerpt", function(content, length) {
        if (!content) return "";
        const len = length || 200;
        const text = content.replace(/<[^>]+>/g, "").trim();
        if (text.length <= len) return text;
        return text.substring(0, len).replace(/\s+\S*$/, "") + "...";
    });

    eleventyConfig.addFilter("limit", function(arr, limit) {
        if (!Array.isArray(arr)) return arr;
        return arr.slice(0, limit);
    });

    eleventyConfig.addFilter("xml_escape", function(str) {
        if (!str) return "";
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&apos;");
    });

    eleventyConfig.addFilter("jsonify", function(value) {
        return JSON.stringify(value, null, 2);
    });

    eleventyConfig.addFilter("contentHash", function(filePath) {
        const fullPath = path.join(__dirname, 'src/static', filePath);
        const content = readFileSync(fullPath);
        return createHash('md5').update(content).digest('hex').slice(0, 8);
    });

    eleventyConfig.addFilter("utmRss", function(url) {
        const sep = url.includes('?') ? '&' : '?';
        return `${url}${sep}utm_source=rss&utm_medium=feed`;
    });

    eleventyConfig.addFilter("slugify", function(str) {
        return str
            .toString()
            .toLowerCase()
            .trim()
            .replace(/\s+/g, "-")
            .replace(/[^\w-]+/g, "")
            .replace(/--+/g, "-")
            .replace(/^-+/, "")
            .replace(/-+$/, "");
    });

    const isProduction = process.env.ELEVENTY_RUN_MODE === 'build';

    if (isProduction) {
        eleventyConfig.addTransform('html-minifier-next', async function(content) {
            if (this.page.outputPath && this.page.outputPath.endsWith('.html')) {
                return await minify(content, {
                    collapseWhitespace: true,
                    conservativeCollapse: true,
                    removeComments: true,
                    ignoreCustomComments: [/^\s*form-message-placeholder\s*$/],
                    minifyCSS: true,
                    minifyJS: async (text) => {
                        const result = await minifyJS(text, { compress: false });
                        return result.code;
                    },
                });
            }
            return content;
        });
    }

    return {
        dir: {
            input: "src",
            output: "_site",
            includes: "_includes",
            data: "_data"
        },
        templateFormats: ["liquid", "md", "html"],
        htmlTemplateEngine: "liquid",
        markdownTemplateEngine: "liquid",
        pathPrefix: "/"
    };
};
