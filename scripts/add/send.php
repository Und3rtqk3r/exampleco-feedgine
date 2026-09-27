<?php
/**
 * ExampleFeed Web API Handler
 * ALL SENSITIVE DATA IS IN config.php — NOT HERE
 * Handles: contact forms, KI chat, cookie consent, tracking events
 */

require_once dirname(__DIR__, 2) . '/config.php';

// ============================================================
// SECURITY HEADERS
// ============================================================
header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');
header('Referrer-Policy: strict-origin-when-cross-origin');

// CORS
$allowedOrigins = unserialize(ALLOWED_ORIGINS);
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header('Access-Control-Allow-Origin: *');
}
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Max-Age: 86400');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function sendResponse($success, $message, $data = null, $statusCode = 200) {
    http_response_code($statusCode);
    $response = ['success' => $success, 'message' => $message, 'timestamp' => date('c')];
    if ($data !== null && (!USE_PRODUCTION || DEBUG_MODE)) {
        $response['data'] = $data;
    }
    echo json_encode($response);
    exit();
}

function sanitizeInput($input) {
    return htmlspecialchars(trim($input ?? ''), ENT_QUOTES, 'UTF-8');
}

function getClientIP() {
    foreach (['HTTP_CF_CONNECTING_IP','HTTP_X_FORWARDED_FOR','HTTP_X_REAL_IP','REMOTE_ADDR'] as $key) {
        if (!empty($_SERVER[$key])) {
            $ip = explode(',', $_SERVER[$key])[0];
            return filter_var(trim($ip), FILTER_VALIDATE_IP) ?: 'unknown';
        }
    }
    return 'unknown';
}

function checkRateLimit($ip) {
    $file = __DIR__ . '/data/rate_limits.json';
    $limits = file_exists($file) ? json_decode(file_get_contents($file), true) : [];
    $now = time();
    // Clean old entries
    foreach ($limits as $k => $v) {
        if ($now - $v['first'] > RATE_LIMIT_WINDOW) unset($limits[$k]);
    }
    if (!isset($limits[$ip])) {
        $limits[$ip] = ['count' => 1, 'first' => $now];
    } else {
        $limits[$ip]['count']++;
        if ($limits[$ip]['count'] > RATE_LIMIT_REQUESTS) {
            file_put_contents($file, json_encode($limits));
            return false;
        }
    }
    file_put_contents($file, json_encode($limits));
    return true;
}

function sendToWebhook($data, $webhookUrl) {
    $payload = json_encode($data);
    if (function_exists('curl_init')) {
        $ch = curl_init($webhookUrl);
        curl_setopt_array($ch, [
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => $payload,
            CURLOPT_HTTPHEADER     => ['Content-Type: application/json', 'Content-Length: ' . strlen($payload)],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 15,
            CURLOPT_SSL_VERIFYPEER => false,
        ]);
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error    = curl_error($ch);
        curl_close($ch);
        return ['success' => $httpCode >= 200 && $httpCode < 300, 'http_code' => $httpCode, 'response' => $response, 'error' => $error];
    }
    // Fallback
    $ctx = stream_context_create(['http' => [
        'method'  => 'POST',
        'header'  => "Content-Type: application/json\r\nContent-Length: " . strlen($payload) . "\r\n",
        'content' => $payload,
        'timeout' => 15,
    ]]);
    $result = @file_get_contents($webhookUrl, false, $ctx);
    return ['success' => $result !== false, 'response' => $result, 'method' => 'file_get_contents'];
}

function storeLead($data) {
    $file   = __DIR__ . '/data/leads.json';
    $leads  = file_exists($file) ? json_decode(file_get_contents($file), true) : [];
    $leads[] = array_merge($data, ['timestamp' => date('c'), 'ip' => getClientIP()]);
    if (count($leads) > 200) $leads = array_slice($leads, -200);
    file_put_contents($file, json_encode($leads, JSON_PRETTY_PRINT));
}

// ============================================================
// REQUEST HANDLERS
// ============================================================

function handleContactForm($data) {
    $name    = sanitizeInput($data['name']    ?? '');
    $contact = sanitizeInput($data['contact'] ?? '');
    $message = sanitizeInput($data['message'] ?? '');
    $company = sanitizeInput($data['company'] ?? '');

    if (empty($name) || empty($contact)) {
        sendResponse(false, 'Name und Kontakt sind Pflichtfelder.', null, 400);
    }

    $payload = ['source' => 'examplefeed.example', 'name' => $name, 'contact' => $contact,
                'message' => $message, 'company' => $company, 'timestamp' => date('c'), 'ip' => getClientIP()];
    storeLead($payload);
    sendToWebhook($payload, EXAMPLEFEED_WEBHOOK_URL);
    sendResponse(true, 'Anfrage erfolgreich übermittelt. Wir melden uns in Kürze.');
}

function handleChatMessage($data) {
    $message    = sanitizeInput($data['message']    ?? '');
    $session_id = sanitizeInput($data['session_id'] ?? '');

    if (empty($message)) {
        sendResponse(false, 'Nachricht darf nicht leer sein.', null, 400);
    }

    $payload  = ['message' => $message, 'session_id' => $session_id, 'source' => 'examplefeed.example'];
    $result   = sendToWebhook($payload, KI_CHAT_WEBHOOK_URL);
    $botReply = 'Vielen Dank für Ihre Nachricht. Unser Team meldet sich schnellstmöglich.';

    if ($result['success'] && !empty($result['response'])) {
        $decoded = json_decode($result['response'], true);
        foreach (['message','output','text','response','answer','result'] as $key) {
            if (!empty($decoded[$key])) { $botReply = $decoded[$key]; break; }
        }
    }
    sendResponse(true, 'OK', ['message' => $botReply, 'session_id' => $session_id]);
}

function handleCookieConsent($data) {
    $file    = __DIR__ . '/data/cookie_consent.json';
    $records = file_exists($file) ? json_decode(file_get_contents($file), true) : [];
    $records[] = ['consent' => $data, 'timestamp' => date('c'), 'ip' => getClientIP()];
    if (count($records) > 1000) $records = array_slice($records, -1000);
    file_put_contents($file, json_encode($records));
    sendResponse(true, 'Consent gespeichert.');
}

// ============================================================
// ROUTER
// ============================================================

$ip = getClientIP();
if (!checkRateLimit($ip)) {
    sendResponse(false, 'Zu viele Anfragen. Bitte warten.', null, 429);
}

$raw  = file_get_contents('php://input');
$body = json_decode($raw, true);

if (json_last_error() !== JSON_ERROR_NONE || empty($body)) {
    sendResponse(false, 'Ungültige Anfrage.', null, 400);
}

$type = sanitizeInput($body['type'] ?? '');

switch ($type) {
    case 'contact': handleContactForm($body);    break;
    case 'chat':    handleChatMessage($body);    break;
    case 'cookie_consent': handleCookieConsent($body); break;
    default:        sendResponse(false, "Unbekannter Typ: $type", null, 400);
}
