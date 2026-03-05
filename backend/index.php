<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';

respond([
    'ok' => true,
    'service' => 'FloodGuard API',
    'endpoints' => [
        '/api/health.php',
        '/api/contacts.php',
        '/api/login.php',
    ],
]);
