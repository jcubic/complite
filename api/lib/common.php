<?php

function loadConfig() {
    $configPath = __DIR__ . '/../config.json';
    if (!file_exists($configPath)) {
        return null;
    }
    $config = json_decode(file_get_contents($configPath), true);
    if (!$config) {
        return null;
    }
    return $config;
}

function sanitizeHeader($value) {
    return preg_replace('/[\r\n]/', '', $value);
}

function sanitizeRedirectUrl($url, $siteUrl = '') {
    $parsed = parse_url($url);
    if (isset($parsed['host'])) {
        if ($siteUrl) {
            $siteParsed = parse_url($siteUrl);
            if ($parsed['host'] !== ($siteParsed['host'] ?? '')) {
                return '/';
            }
        } else {
            return '/';
        }
    }
    $path = $parsed['path'] ?? '/';
    if (strpos($path, '..') !== false) {
        return '/';
    }
    return $url;
}

function buildRedirectUrl($baseUrl, $msg) {
    $sep = strpos($baseUrl, '?') !== false ? '&' : '?';
    return $baseUrl . $sep . 'msg=' . urlencode($msg);
}

function isMailAvailable() {
    return function_exists('mail');
}

function sendPlainEmail($to, $subject, $body, $replyTo = '') {
    $headers = "Content-Type: text/plain; charset=UTF-8\r\n";
    if ($replyTo) {
        $headers .= "Reply-To: " . sanitizeHeader($replyTo) . "\r\n";
    }
    return mail($to, $subject, $body, $headers);
}

function mockMail($to, $subject, $body, $replyTo = '') {
    $mailDir = __DIR__ . '/../mail';
    if (!is_dir($mailDir)) {
        mkdir($mailDir, 0755, true);
    }

    $html = "<!DOCTYPE html><html><head><title>Mock Email</title><style>"
        . "body{font-family:system-ui,sans-serif;max-width:600px;margin:2rem auto;padding:1rem;}"
        . "dt{font-weight:bold;margin-top:1rem;}dd{margin:0;}"
        . "pre{background:#f5f5f5;padding:1rem;white-space:pre-wrap;border-radius:4px;}"
        . "</style></head><body>"
        . "<h1>Mock Email</h1>"
        . "<dl>"
        . "<dt>To</dt><dd>" . htmlspecialchars($to) . "</dd>"
        . "<dt>Subject</dt><dd>" . htmlspecialchars($subject) . "</dd>"
        . "<dt>Reply-To</dt><dd>" . htmlspecialchars($replyTo) . "</dd>"
        . "<dt>Date</dt><dd>" . date('Y-m-d H:i:s') . "</dd>"
        . "</dl>"
        . "<h2>Body</h2>"
        . "<pre>" . htmlspecialchars($body) . "</pre>"
        . "</body></html>";

    file_put_contents($mailDir . '/index.html', $html);
    return true;
}

function logBotAttempt($data) {
    $logDir = __DIR__ . '/../logs';
    if (!is_dir($logDir)) {
        mkdir($logDir, 0755, true);
    }
    $entry = date('Y-m-d H:i:s') . ' BOT '
        . ($_SERVER['REMOTE_ADDR'] ?? 'unknown') . ' '
        . json_encode($data) . "\n";
    file_put_contents($logDir . '/bot.log', $entry, FILE_APPEND | LOCK_EX);
}
