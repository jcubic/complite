<?php

require_once __DIR__ . '/../lib/common.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    header('Allow: POST');
    echo 'Method Not Allowed';
    exit;
}

$config = loadConfig();
$redirectUrl = sanitizeRedirectUrl($_POST['redirect_url'] ?? '/contact/', $config['site_url'] ?? '');

if (!$config) {
    header('Location: ' . buildRedirectUrl($redirectUrl, 'config_error'));
    exit;
}

if (!empty($_POST['confirm_email'])) {
    logBotAttempt([
        'form' => 'contact',
        'name' => $_POST['name'] ?? '',
        'email' => $_POST['email'] ?? '',
        'honeypot' => $_POST['confirm_email'],
    ]);
    header('Location: ' . buildRedirectUrl($redirectUrl, 'bot_error'));
    exit;
}

$name = trim($_POST['name'] ?? '');
$email = trim($_POST['email'] ?? '');
$subject = trim($_POST['subject'] ?? '');
$message = trim($_POST['message'] ?? '');

if (!$name || !$email || !$subject || !$message) {
    header('Location: ' . buildRedirectUrl($redirectUrl, 'contact_error'));
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    header('Location: ' . buildRedirectUrl($redirectUrl, 'contact_error'));
    exit;
}

$to = $config['contact_email'];
$emailSubject = sanitizeHeader('[Contact] ' . $subject);
$body = "Name: {$name}\nEmail: {$email}\nSubject: {$subject}\n\nMessage:\n{$message}";

if (isMailAvailable()) {
    $sent = sendPlainEmail($to, $emailSubject, $body, $email);
} else {
    $sent = mockMail($to, $emailSubject, $body, $email);
}

if ($sent) {
    header('Location: ' . buildRedirectUrl($redirectUrl, 'contact_success'));
} else {
    header('Location: ' . buildRedirectUrl($redirectUrl, 'contact_error'));
}
