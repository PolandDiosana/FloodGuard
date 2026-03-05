<?php
declare(strict_types=1);

require_once __DIR__ . '/../config.php';

respond([
    'ok' => true,
    'service' => 'FloodGuard API',
    'timestamp' => gmdate('c'),
]);
