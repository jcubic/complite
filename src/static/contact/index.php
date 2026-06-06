<?php
$htmlFile = __DIR__ . '/index.html';
if (!file_exists($htmlFile)) {
    http_response_code(500);
    echo 'Contact page not built. Run npm run build first.';
    exit;
}

$html = file_get_contents($htmlFile);

$msg = $_GET['msg'] ?? '';
$messageHtml = '';

switch ($msg) {
    case 'contact_success':
        $messageHtml = '<div class="form-message form-message-success">Thank you! Your message has been sent. We\'ll get back to you within a few business days.</div>';
        break;
    case 'contact_error':
        $messageHtml = '<div class="form-message form-message-error">Something went wrong. Please check your details and try again, or email us directly.</div>';
        break;
    case 'bot_error':
        $messageHtml = '<div class="form-message form-message-error">We could not process your submission.</div>';
        break;
    case 'config_error':
        $messageHtml = '<div class="form-message form-message-info">Contact form is not configured yet. Copy api/config.example.json to api/config.json and set your email address.</div>';
        break;
}

if ($messageHtml) {
    $html = str_replace('<!-- form-message-placeholder -->', $messageHtml, $html);
}

echo $html;
