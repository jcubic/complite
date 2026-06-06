<?php
$htmlFile = __DIR__ . '/index.html';
if (!file_exists($htmlFile)) {
    http_response_code(500);
    echo 'Search page not built. Run npm run build first.';
    exit;
}

$html = file_get_contents($htmlFile);

$dbPath = __DIR__ . '/../search.db';
$query = trim($_GET['q'] ?? '');

$resultsHtml = '';

if ($query !== '' && file_exists($dbPath)) {
    try {
        $db = new SQLite3($dbPath, SQLITE3_OPEN_READONLY);
        $results = searchPages($db, $query);
        $db->close();
        $resultsHtml = renderResults($results, $query);
    } catch (Exception $e) {
        $resultsHtml = '<div class="form-message form-message-error">Search is temporarily unavailable.</div>';
    }
} elseif ($query !== '') {
    $resultsHtml = '<div class="form-message form-message-info">Search index not found. The site needs to be rebuilt with search indexing enabled.</div>';
}

if ($query !== '') {
    $escaped = htmlspecialchars($query, ENT_QUOTES, 'UTF-8');
    $html = preg_replace(
        '/id="search-q"([^>]*)value=""/',
        'id="search-q"$1value="' . $escaped . '"',
        $html
    );
}

$html = str_replace('<!-- search-results-placeholder -->', $resultsHtml, $html);

echo $html;

function searchPages(SQLite3 $db, string $query): array {
    $terms = preg_split('/\s+/', $query);
    $terms = array_filter($terms, fn($t) => mb_strlen($t) > 0);
    if (empty($terms)) return [];

    $ftsAnd = implode(' AND ', array_map(fn($t) => '"' . SQLite3::escapeString($t) . '"*', $terms));
    $results = ftsQuery($db, $ftsAnd);
    if (!empty($results)) return $results;

    if (count($terms) > 1) {
        $ftsOr = implode(' OR ', array_map(fn($t) => '"' . SQLite3::escapeString($t) . '"*', $terms));
        $results = ftsQuery($db, $ftsOr);
        if (!empty($results)) return $results;
    }

    return likeQuery($db, $terms);
}

function ftsQuery(SQLite3 $db, string $matchExpr): array {
    $stmt = $db->prepare("
        SELECT title, url,
               snippet(pages, 2, '<mark>', '</mark>', '…', 40) as snippet,
               bm25(pages) as rank
        FROM pages
        WHERE pages MATCH :q
        ORDER BY rank
        LIMIT 20
    ");
    $stmt->bindValue(':q', $matchExpr, SQLITE3_TEXT);
    $result = $stmt->execute();

    $rows = [];
    while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
        $rows[] = $row;
    }
    return $rows;
}

function likeQuery(SQLite3 $db, array $terms): array {
    $conditions = [];
    $params = [];
    foreach ($terms as $i => $term) {
        $safe = '%' . SQLite3::escapeString($term) . '%';
        $key = ':t' . $i;
        $conditions[] = "(content LIKE {$key} OR title LIKE {$key})";
        $params[$key] = $safe;
    }

    $sql = 'SELECT title, url, content FROM pages WHERE '
         . implode(' OR ', $conditions)
         . ' LIMIT 20';
    $stmt = $db->prepare($sql);
    foreach ($params as $key => $val) {
        $stmt->bindValue($key, $val, SQLITE3_TEXT);
    }
    $result = $stmt->execute();

    $rows = [];
    while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
        $rows[] = [
            'title' => $row['title'],
            'url' => $row['url'],
            'snippet' => extractSnippet($row['content'], $terms),
        ];
    }
    return $rows;
}

function extractSnippet(string $content, array $terms): string {
    $pattern = '/(' . implode('|', array_map('preg_quote', $terms)) . ')/iu';
    if (preg_match($pattern, $content, $m, PREG_OFFSET_CAPTURE)) {
        $pos = $m[0][1];
        $len = mb_strlen($content);
        $start = max(0, $pos - 80);
        $end = min($len, $pos + 120);
        $snippet = mb_substr($content, $start, $end - $start);
        if ($start > 0) $snippet = '…' . $snippet;
        if ($end < $len) $snippet .= '…';
        $snippet = htmlspecialchars($snippet, ENT_QUOTES, 'UTF-8');
        return preg_replace($pattern, '<mark>$1</mark>', $snippet);
    }
    return htmlspecialchars(mb_substr($content, 0, 200), ENT_QUOTES, 'UTF-8') . '…';
}

function renderResults(array $results, string $query): string {
    $count = count($results);
    $escaped = htmlspecialchars($query, ENT_QUOTES, 'UTF-8');

    if ($count === 0) {
        return '<div class="search-results">'
             . '<p class="search-summary">No results found for <strong>&ldquo;' . $escaped . '&rdquo;</strong>. Try different keywords.</p>'
             . '</div>';
    }

    $html = '<div class="search-results">'
          . '<p class="search-summary">' . $count . ' result' . ($count !== 1 ? 's' : '')
          . ' for <strong>&ldquo;' . $escaped . '&rdquo;</strong></p>';

    foreach ($results as $row) {
        $title = htmlspecialchars($row['title'], ENT_QUOTES, 'UTF-8');
        $url = htmlspecialchars($row['url'], ENT_QUOTES, 'UTF-8');
        $snippet = $row['snippet'];

        $html .= '<article class="search-result">'
               . '<h3><a href="' . $url . '">' . $title . '</a></h3>'
               . '<cite class="search-result__url">' . $url . '</cite>'
               . '<p class="search-result__snippet">' . $snippet . '</p>'
               . '</article>';
    }

    return $html . '</div>';
}
