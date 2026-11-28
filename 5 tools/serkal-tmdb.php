<?php
declare(strict_types=1);

ini_set('display_errors', '0');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function reply(int $status, array $data): never
{
    http_response_code($status);
    echo json_encode($data, JSON_INVALID_UTF8_SUBSTITUTE | JSON_UNESCAPED_UNICODE);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') {
    header('Allow: GET');
    reply(405, ['error' => 'method_not_allowed']);
}

$token = trim((string) @file_get_contents(__DIR__ . '/privat/tmdb-pilot-token.txt'));
if (!preg_match('/\A[a-f0-9]{64}\z/i', $token)) {
    reply(503, ['error' => 'pilot_not_configured']);
}
if (!hash_equals('Bearer ' . $token, $_SERVER['HTTP_AUTHORIZATION'] ?? '')) {
    header('WWW-Authenticate: Bearer');
    reply(401, ['error' => 'unauthorized']);
}

$route = $_GET['route'] ?? '';
$language = $_GET['language'] ?? 'de-DE';
if (!in_array($language, ['de-DE', 'en-US'], true)) {
    reply(400, ['error' => 'invalid_language']);
}
$params = ['language' => $language];

switch ($route) {
    case 'search':
        $query = $_GET['query'] ?? null;
        $page = $_GET['page'] ?? '1';
        if (!is_string($query) || trim($query) === '' || strlen($query) > 200 ||
            !is_string($page) || !preg_match('/\A[1-9][0-9]{0,2}\z/', $page) || (int) $page > 500) {
            reply(400, ['error' => 'invalid_search']);
        }
        $path = '/search/tv';
        $params += ['query' => trim($query), 'page' => $page, 'include_adult' => 'false'];
        break;
    case 'series':
    case 'season':
        $id = $_GET['id'] ?? '';
        if (!is_string($id) || !preg_match('/\A[1-9][0-9]{0,9}\z/', $id)) {
            reply(400, ['error' => 'invalid_series_id']);
        }
        $path = '/tv/' . $id;
        if ($route === 'season') {
            $season = $_GET['season'] ?? '';
            if (!is_string($season) || !preg_match('/\A(?:0|[1-9][0-9]{0,3})\z/', $season)) {
                reply(400, ['error' => 'invalid_season']);
            }
            $path .= '/season/' . $season;
        } else {
            $params['append_to_response'] = 'translations,alternative_titles';
        }
        break;
    default:
        reply(404, ['error' => 'unknown_route']);
}

$key = trim((string) @file_get_contents(__DIR__ . '/privat/tmdb-key.txt'));
if (!preg_match('/\A[0-9a-f]{32}\z/i', $key) || !function_exists('curl_init')) {
    reply(503, ['error' => 'tmdb_not_configured']);
}

$params['api_key'] = $key;
$request = curl_init('https://api.themoviedb.org/3' . $path . '?' . http_build_query($params));
curl_setopt_array($request, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CONNECTTIMEOUT => 5,
    CURLOPT_TIMEOUT => 12,
    CURLOPT_HTTPHEADER => ['Accept: application/json'],
]);
$body = curl_exec($request);
$status = curl_getinfo($request, CURLINFO_RESPONSE_CODE);
if ($body === false || $status !== 200) {
    $clientStatus = in_array($status, [404, 429], true) ? $status : 502;
    reply($clientStatus, ['error' => 'tmdb_request_failed']);
}
$data = json_decode($body, true);
if (!is_array($data)) {
    reply(502, ['error' => 'invalid_tmdb_response']);
}
reply(200, $data);
