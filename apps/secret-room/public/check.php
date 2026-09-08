<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
    exit;
}

$runtimeCandidates = [];
$configuredRuntime = getenv('SECRET_ROOM_GATE');
if (is_string($configuredRuntime) && $configuredRuntime !== '') {
    $runtimeCandidates[] = $configuredRuntime;
}
$runtimeCandidates[] = dirname(__DIR__) . '/server/runtime/gate.php';

$runtime = null;
foreach ($runtimeCandidates as $candidate) {
    if (is_file($candidate)) {
        $runtime = $candidate;
        break;
    }
}

if ($runtime === null) {
    http_response_code(503);
    echo json_encode(['error' => 'Service Unavailable']);
    exit;
}

require_once $runtime;

$body = file_get_contents('php://input');
$data = json_decode($body ?: '', true);
$raw = is_array($data) && isset($data['answer']) ? (string) $data['answer'] : '';

try {
    [$status, $payload] = secret_room_process_answer($raw);
} catch (Throwable $error) {
    http_response_code(503);
    echo json_encode(['error' => 'Service Unavailable']);
    exit;
}

http_response_code($status);
echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
