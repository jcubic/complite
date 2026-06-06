import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const siteDir = '_site';
let errors = 0;
let checked = 0;

function walkDir(dir) {
    for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        const stat = statSync(full);
        if (stat.isDirectory()) {
            walkDir(full);
        } else if (full.endsWith('.html')) {
            checkFile(full);
        }
    }
}

function checkFile(filePath) {
    const html = readFileSync(filePath, 'utf-8');
    const regex = /<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/gi;
    let match;
    while ((match = regex.exec(html)) !== null) {
        checked++;
        try {
            JSON.parse(match[1]);
        } catch (e) {
            errors++;
            console.error(`Invalid JSON-LD in ${filePath}: ${e.message}`);
        }
    }
}

walkDir(siteDir);
console.log(`Checked ${checked} JSON-LD blocks across ${siteDir}/`);

if (errors > 0) {
    console.error(`Found ${errors} error(s).`);
    process.exit(1);
} else {
    console.log('All JSON-LD is valid.');
}
