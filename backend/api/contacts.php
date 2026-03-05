<?php
declare(strict_types=1);

require_once __DIR__ . '/../config.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'POST') {
    $data = json_input();
    $name = trim((string)($data['name'] ?? ''));
    $email = trim((string)($data['email'] ?? ''));
    $message = trim((string)($data['message'] ?? ''));

    if ($name === '' || $email === '' || $message === '') {
        error('Name, email, and message are required.');
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        error('Invalid email format.');
    }

    $stmt = db()->prepare('INSERT INTO contacts (name, email, message) VALUES (?, ?, ?)');
    if (!$stmt) {
        error('Failed to prepare statement.', 500);
    }
    $stmt->bind_param('sss', $name, $email, $message);
    if (!$stmt->execute()) {
        error('Failed to save contact message.', 500);
    }

    respond([
        'ok' => true,
        'id' => $stmt->insert_id,
    ], 201);
}

if ($method === 'GET') {
    $result = db()->query('SELECT id, name, email, message, created_at FROM contacts ORDER BY created_at DESC LIMIT 50');
    if (!$result) {
        error('Failed to fetch contacts.', 500);
    }

    $rows = [];
    while ($row = $result->fetch_assoc()) {
        $rows[] = $row;
    }

    respond([
        'ok' => true,
        'contacts' => $rows,
    ]);
}

error('Method not allowed.', 405);
