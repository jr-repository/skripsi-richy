<?php
// backend-rekomendasi-karir/config/database.php

// Atur header CORS terlebih dahulu
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Atur laporan error PHP untuk debugging.
// **PENTING:** Untuk lingkungan produksi, ubah display_errors menjadi Off dan error_reporting menjadi yang lebih terbatas (misalnya, E_ALL & ~E_NOTICE & ~E_WARNING)
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

$host = 'localhost';
$db   = 'sipemale_career_recommendation'; // Ganti dengan nama database Anda yang sebenarnya
$user = 'sipemale_career_recommendation'; // Ganti dengan username database Anda yang sebenarnya
$pass = 'career_recommendation'; // Ganti dengan password database Anda yang sebenarnya
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION, // Mengaktifkan exception untuk error database
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,     // Mengatur fetch mode default menjadi associative array
    PDO::ATTR_EMULATE_PREPARES   => false,                // Mematikan emulasi prepare statement (untuk keamanan dan kinerja)
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
    // echo "Koneksi database berhasil!"; // Untuk debugging awal, bisa dihapus setelah yakin koneksi berhasil
} catch (\PDOException $e) {
    // Jika koneksi gagal, langsung output JSON error dan hentikan eksekusi
    http_response_code(500);
    echo json_encode(['message' => 'Koneksi database gagal: ' . $e->getMessage(), 'status' => 'error']);
    exit(); // Penting: Hentikan eksekusi setelah mengirim error JSON
}
?>