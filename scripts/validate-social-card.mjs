import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { DOMParser } from '@xmldom/xmldom';

const cardDir = 'src/card';
let errors = 0;

try {
    const files = readdirSync(cardDir).filter(f => f.endsWith('.svg'));

    if (files.length === 0) {
        console.log('No SVG templates found in src/card/ — skipping.');
        process.exit(0);
    }

    const parser = new DOMParser({
        errorHandler: {
            warning: () => {},
            error: (msg) => { throw new Error(msg); },
            fatalError: (msg) => { throw new Error(msg); },
        },
    });

    for (const file of files) {
        const filePath = join(cardDir, file);
        const svg = readFileSync(filePath, 'utf-8');
        try {
            parser.parseFromString(svg, 'image/svg+xml');
            console.log(`✓ ${filePath}`);
        } catch (e) {
            errors++;
            console.error(`✗ ${filePath}: ${e.message}`);
        }
    }
} catch (e) {
    if (e.code === 'ENOENT') {
        console.log('src/card/ directory not found — skipping.');
        process.exit(0);
    }
    throw e;
}

if (errors > 0) {
    console.error(`Found ${errors} error(s).`);
    process.exit(1);
} else {
    console.log('All SVG templates are valid XML.');
}
