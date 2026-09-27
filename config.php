<?php
/**
 * ExampleFeed — Centralized Credentials & Configuration
 * ALL SENSITIVE DATA IS STORED HERE — NOT VISIBLE TO CLIENT
 *
 * Include this file in send.php: require_once dirname(__DIR__, 2) . '/config.php';
 */

// ============================================================
// ENVIRONMENT
// ============================================================
define('USE_PRODUCTION', false);   // set to true on live server
define('DEBUG_MODE',     true);    // set to false on live server

// ============================================================
// N8N WEBHOOKS
// ============================================================
define('EXAMPLEFEED_WEBHOOK_TEST', 'https://n8n.support-space.de/webhook-test/REPLACE_WITH_EXAMPLEFEED_WEBHOOK');
define('EXAMPLEFEED_WEBHOOK_PROD', 'https://n8n.support-space.de/webhook/REPLACE_WITH_EXAMPLEFEED_WEBHOOK');
define('EXAMPLEFEED_WEBHOOK_URL',   USE_PRODUCTION ? EXAMPLEFEED_WEBHOOK_PROD : EXAMPLEFEED_WEBHOOK_TEST);

// KI Chat Webhook
define('KI_CHAT_WEBHOOK_TEST', 'https://n8n.support-space.de/webhook-test/8a25bce2-ff83-4676-a3a2-a0e1174fcffe');
define('KI_CHAT_WEBHOOK_PROD', 'https://n8n.support-space.de/webhook/8a25bce2-ff83-4676-a3a2-a0e1174fcffe');
define('KI_CHAT_WEBHOOK_URL',   USE_PRODUCTION ? KI_CHAT_WEBHOOK_PROD : KI_CHAT_WEBHOOK_TEST);

// ============================================================
// GOOGLE
// ============================================================
define('GA_MEASUREMENT_ID',   'G-XXXXXXXXXX');   // Google Analytics 4 Measurement ID
define('GA_API_SECRET',       '');                // GA4 Measurement Protocol API Secret
define('GTM_CONTAINER_ID',    'GTM-XXXXXXX');     // Google Tag Manager container ID
define('GADS_CONVERSION_ID',  'AW-XXXXXXXXXX');   // Google Ads Conversion ID
define('GADS_CONVERSION_LABEL', '');              // Google Ads Conversion Label

// Flowise Chatbot
define('FLOWISE_CHATFLOW_ID', '00000000-0000-0000-0000-000000000000');
define('FLOWISE_API_HOST',    'https://flowise.example-company.example');

// ============================================================
// META / FACEBOOK
// ============================================================
define('FB_PIXEL_ID',      '');  // Facebook Pixel ID
define('FB_ACCESS_TOKEN',  '');  // Facebook Conversions API Access Token

// ============================================================
// LINKEDIN
// ============================================================
define('LINKEDIN_PARTNER_ID', '');

// ============================================================
// GENERAL API SECURITY
// ============================================================
define('API_SECRET_KEY',        'REPLACE_WITH_STRONG_RANDOM_KEY');
define('RATE_LIMIT_REQUESTS',   100);  // max requests per window
define('RATE_LIMIT_WINDOW',     3600); // window in seconds (1 hour)

// ============================================================
// ALLOWED ORIGINS (CORS)
// ============================================================
define('ALLOWED_ORIGINS', serialize([
    'https://examplefeed.example',
    'https://www.examplefeed.example',
    'https://example-company.example',
    'https://www.example-company.example',
    'http://localhost',
    'http://127.0.0.1',
]));
