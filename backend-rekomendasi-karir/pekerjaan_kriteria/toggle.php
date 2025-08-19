<?php
// backend-rekomendasi-karir/pekerjaan_kriteria/toggle.php

// Sertakan file koneksi database PDO yang baru
require_once '../config/database.php'; // Sesuaikan path ini jika struktur folder Anda berbeda

// Header CORS sudah diatur di database.php, tetapi bisa diulang untuk memastikan jika diakses langsung
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header('Content-Type: application/json'); // Pastikan ini dikirim sebelum echo JSON

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    // Tangani preflight request
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    $pekerjaan_id = $input['pekerjaan_id'] ?? null;
    $kriteria_id = $input['kriteria_id'] ?? null;
    $aktif = $input['aktif'] ?? null; // Ini akan menjadi 0 atau 1

    if ($pekerjaan_id === null || $kriteria_id === null || $aktif === null) {
        echo json_encode(['message' => 'Data tidak lengkap.', 'status' => 'error']);
        http_response_code(400);
        exit();
    }

    try {
        // Cek apakah entri sudah ada
        $stmt = $pdo->prepare("SELECT id FROM pekerjaan_kriteria WHERE pekerjaan_id = ? AND kriteria_id = ?");
        $stmt->execute([$pekerjaan_id, $kriteria_id]);
        $existingEntry = $stmt->fetch();

        if ($existingEntry) {
            // Jika sudah ada, update status aktifnya
            $stmt = $pdo->prepare("UPDATE pekerjaan_kriteria SET aktif = ? WHERE pekerjaan_id = ? AND kriteria_id = ?");
            $stmt->execute([$aktif, $pekerjaan_id, $kriteria_id]);
            $message = 'Status kriteria utama berhasil diperbarui.';
        } else {
            // Jika belum ada, masukkan entri baru
            $stmt = $pdo->prepare("INSERT INTO pekerjaan_kriteria (pekerjaan_id, kriteria_id, aktif) VALUES (?, ?, ?)");
            $stmt->execute([$pekerjaan_id, $kriteria_id, $aktif]);
            $message = 'Kriteria utama berhasil ditambahkan ke pekerjaan.';
        }

        echo json_encode(['message' => $message, 'status' => 'success']);
        http_response_code(200);

    } catch (PDOException $e) {
        echo json_encode(['message' => 'Terjadi kesalahan database: ' . $e->getMessage(), 'status' => 'error']);
        http_response_code(500);
    }
} else {
    echo json_encode(['message' => 'Metode request tidak diizinkan.', 'status' => 'error']);
    http_response_code(405); // Method Not Allowed
}
?>