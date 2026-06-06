import { readFileSync, readdirSync, statSync, existsSync, unlinkSync } from 'fs';
import { join, relative } from 'path';
import Database from 'better-sqlite3';

const SITE_DIR = join(process.cwd(), '_site');
const DB_PATH = join(SITE_DIR, 'search.db');

const SKIP_FILES = new Set(['404.html', 'sitemap.xml', 'feed.xml', 'robots.txt', 'pretty-feed.xsl']);
const SKIP_DIRS = new Set(['api', 'vendor', 'favicon', 'css', 'img', 'search']);
const SKIP_EXTENSIONS = new Set(['.xml', '.json', '.txt', '.xsl', '.md', '.webmanifest', '.ico', '.png', '.svg', '.jpg']);

function stripTags(html) {
    return html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
        .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
        .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&[a-z]+;/gi, ' ')
        .replace(/&#\d+;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function extractTitle(html) {
    const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    if (match) {
        let title = stripTags(match[1]).trim();
        title = title.replace(/\s*[|–—]\s*[^|–—]*$/, '').trim();
        return title;
    }
    const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    if (h1) return stripTags(h1[1]).trim();
    return '';
}

function extractContent(html) {
    const main = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
    const body = main ? main[1] : html;
    return stripTags(body);
}

function walkHtml(dir) {
    const files = [];
    for (const entry of readdirSync(dir)) {
        const fullPath = join(dir, entry);

        if (SKIP_DIRS.has(entry)) continue;

        const stat = statSync(fullPath);
        if (stat.isDirectory()) {
            files.push(...walkHtml(fullPath));
        } else if (entry.endsWith('.html') && !SKIP_FILES.has(entry)) {
            files.push(fullPath);
        }
    }
    return files;
}

export function buildSearchIndex() {
    if (!existsSync(SITE_DIR)) {
        console.error('_site/ directory not found. Run eleventy build first.');
        process.exit(1);
    }

    console.log('Building search index...');

    if (existsSync(DB_PATH)) {
        unlinkSync(DB_PATH);
    }

    const db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');

    db.exec(`
        CREATE VIRTUAL TABLE pages USING fts5(
            title,
            url UNINDEXED,
            content,
            tokenize = 'unicode61'
        );
    `);

    const insert = db.prepare('INSERT INTO pages (title, url, content) VALUES (?, ?, ?)');

    const htmlFiles = walkHtml(SITE_DIR);
    let count = 0;

    const insertAll = db.transaction((files) => {
        for (const filePath of files) {
            const html = readFileSync(filePath, 'utf-8');
            const title = extractTitle(html);
            const content = extractContent(html);

            if (!title && !content.trim()) continue;

            let url = '/' + relative(SITE_DIR, filePath).replace(/\\/g, '/');
            url = url.replace(/\/index\.html$/, '/');

            insert.run(title, url, content);
            count++;
        }
    });

    insertAll(htmlFiles);
    db.close();

    console.log(`Indexed ${count} pages → ${relative(process.cwd(), DB_PATH)}`);
}

buildSearchIndex();
