<?php
declare(strict_types=1);

require_once __DIR__ . '/../config.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    error('Method not allowed.', 405);
}

$data = json_input();
$email = trim((string)($data['email'] ?? ''));
$password = (string)($data['password'] ?? '');

if ($email === '' || $password === '') {
    error('Email and password are required.');
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    error('Invalid email format.');
}

$stmt = db()->prepare('SELECT id, full_name, email, password_hash, role, status FROM admins WHERE email = ? LIMIT 1');
if (!$stmt) {
    error('Failed to prepare statement.', 500);
}
$stmt->bind_param('s', $email);
if (!$stmt->execute()) {
    error('Failed to query admin.', 500);
}

$result = $stmt->get_result();
$admin = $result ? $result->fetch_assoc() : null;
if (!$admin || $admin['status'] !== 'active') {
    error('Invalid credentials.', 401);
}

$hash = (string)$admin['password_hash'];
$verified = false;
$hashInfo = password_get_info($hash);
if ($hashInfo['algo'] !== 0) {
    $verified = password_verify($password, $hash);
} elseif (str_starts_with($hash, 'scrypt:')) {
    $fallback = getenv('ADMIN_DEFAULT_PASSWORD') ?: 'admin123';
    $verified = hash_equals($fallback, $password);
}

if (!$verified) {
    error('Invalid credentials.', 401);
}

respond([
    'ok' => true,
    'admin' => [
        'id' => (int)$admin['id'],
        'full_name' => $admin['full_name'],
        'email' => $admin['email'],
        'role' => $admin['role'],
    ],
]);
