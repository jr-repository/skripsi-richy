<?php
// statistics.php

// Aktifkan output buffering untuk mencegah output tidak terduga mengganggu JSON
ob_start();

// Pengaturan error reporting untuk debugging (PENTING: NONAKTIFKAN DI LINGKUNGAN PRODUKSI!)
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Sertakan file konfigurasi dan controller yang dibutuhkan
require_once 'corsheader.php';
require_once 'db_connect.php';
require_once 'controllers/BaseController.php'; // Pastikan BaseController di-require sebelum controller lain
require_once 'controllers/RecommendationController.php'; // Controller yang berisi logika statistik

// Mendapatkan method HTTP dari request
$method = $_SERVER['REQUEST_METHOD'];

// Mendapatkan ID pekerjaan dari path URI
// Misalnya, jika URL: http://localhost/backend-rekomendasi-karir/statistics.php/1
// $_SERVER['PATH_INFO'] akan menjadi '/1'
$pekerjaanId = null;
if (isset($_SERVER['PATH_INFO']) && $_SERVER['PATH_INFO'] != '/') {
    $path_info = explode('/', trim($_SERVER['PATH_INFO'], '/'));
    $pekerjaanId = $path_info[0] ?? null;
}

// Mendapatkan body request (untuk data input user)
$input = json_decode(file_get_contents('php://input'), true);

// Inisialisasi RecommendationController
$recController = new RecommendationController($conn);

// Hanya menangani request POST ke endpoint ini untuk statistik
// Pastikan pekerjaanId tersedia dan method adalah POST
if ($method == 'POST' && $pekerjaanId !== null) {
    $recController->getJobCalculationStatistics((int)$pekerjaanId);
} else {
    // Jika request tidak sesuai, kirim error 404
    http_response_code(404);
    echo json_encode(["message" => "Endpoint statistik tidak ditemukan atau method tidak didukung."]);
}

// Tutup koneksi database
$conn->close();

// Bersihkan output buffer dan kirim konten JSON
ob_end_flush();