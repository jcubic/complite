import { execSync } from 'child_process';

function gitDate(inputPath) {
    try {
        const result = execSync(
            `git log -1 --format=%ai -- "${inputPath}"`,
            { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
        ).trim();
        return result ? new Date(result) : null;
    } catch {
        return null;
    }
}

function newerDate(a, b) {
    const da = a ? new Date(a) : null;
    const db = b ? new Date(b) : null;
    if (!da && !db) return null;
    if (!da) return db;
    if (!db) return da;
    return da > db ? da : db;
}

function dayKey(d) {
    return d.toISOString().slice(0, 10);
}

export default {
    eleventyComputed: {
        modified(data) {
            if (data.modified) {
                return new Date(data.modified);
            }

            const inferred = newerDate(
                gitDate(data.page.inputPath),
                data.site?.modified ? new Date(data.site.modified) : null,
            );
            if (!inferred) return null;

            const articleDate = data.date ? new Date(data.date) : null;
            if (articleDate && dayKey(inferred) <= dayKey(articleDate)) {
                return null;
            }

            return inferred;
        }
    }
};
