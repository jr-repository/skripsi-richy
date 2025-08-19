<?php
header("Access-Control-Allow-Origin: http://localhost:8080"); // Sesuaikan dengan origin frontend Anda
header("Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, X-User-Role, x-client-id, X-User-Branch-Id");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    // Respons preflight
    http_response_code(204);
    exit();
}