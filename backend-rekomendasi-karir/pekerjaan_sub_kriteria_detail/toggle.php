<?php
// backend-rekomendasi-karir/pekerjaan_sub_kriteria_detail/toggle.php

// Sertakan file koneksi database PDO yang baru
require_once '../config/database.php'; // Sesuaikan path ini jika struktur folder Anda berbeda

// Header CORS sudah diatur di database.php, tetapi bisa diulang untuk memastikan jika diakses langsung
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header('Content-Type: application/json'); // Pastikan ini dikirim sebelum echo JSON

// Tangani permintaan OPTIONS (preflight request)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(); // Penting: Hentikan eksekusi setelah preflight
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Ambil input JSON dari body request
    $input = json_decode(file_get_contents('php://input'), true);

    // Validasi data input
    $pekerjaan_id = $input['pekerjaan_id'] ?? null;
    $sub_kriteria_global_id = $input['sub_kriteria_global_id'] ?? null;
    $aktif = $input['aktif'] ?? null; // Nilai ini akan menjadi 0 atau 1

    // Periksa apakah semua data yang diperlukan ada
    if ($pekerjaan_id === null || $sub_kriteria_global_id === null || $aktif === null) {
        http_response_code(400); // Bad Request
        echo json_encode(['message' => 'Data tidak lengkap.', 'status' => 'error']);
        exit();
    }

    try {
        // Mulai transaksi untuk memastikan integritas data
        $pdo->beginTransaction();

        // Cek apakah entri sudah ada di tabel pekerjaan_sub_kriteria_detail
        $stmt = $pdo->prepare("SELECT id FROM pekerjaan_sub_kriteria_detail WHERE pekerjaan_id = :pekerjaan_id AND sub_kriteria_global_id = :sub_kriteria_global_id");
        $stmt->execute([
            ':pekerjaan_id' => $pekerjaan_id,
            ':sub_kriteria_global_id' => $sub_kriteria_global_id
        ]);
        $existingEntry = $stmt->fetch();

        if ($existingEntry) {
            // Jika entri sudah ada, update status 'aktif'
            $stmt = $pdo->prepare("UPDATE pekerjaan_sub_kriteria_detail SET aktif = :aktif WHERE pekerjaan_id = :pekerjaan_id AND sub_kriteria_global_id = :sub_kriteria_global_id");
            $stmt->execute([
                ':aktif' => $aktif,
                ':pekerjaan_id' => $pekerjaan_id,
                ':sub_kriteria_global_id' => $sub_kriteria_global_id
            ]);
            $message = 'Status sub-kriteria berhasil diperbarui.';
        } else {
            // Jika entri belum ada, masukkan entri baru
            // Asumsi: nilai_ideal default adalah 0 jika tidak disediakan dari frontend
            $stmt = $pdo->prepare("INSERT INTO pekerjaan_sub_kriteria_detail (pekerjaan_id, sub_kriteria_global_id, aktif, nilai_ideal) VALUES (:pekerjaan_id, :sub_kriteria_global_id, :aktif, :nilai_ideal)");
            $stmt->execute([
                ':pekerjaan_id' => $pekerjaan_id,
                ':sub_kriteria_global_id' => $sub_kriteria_global_id,
                ':aktif' => $aktif,
                ':nilai_ideal' => 0 // Nilai default untuk nilai_ideal jika tidak disediakan
            ]);
            $message = 'Sub-kriteria berhasil ditambahkan ke pekerjaan.';
        }

        // Commit transaksi jika semua operasi berhasil
        $pdo->commit();

        http_response_code(200); // OK
        echo json_encode(['message' => $message, 'status' => 'success']);

    } catch (PDOException $e) {
        // Rollback transaksi jika terjadi error
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        http_response_code(500); // Internal Server Error
        echo json_encode(['message' => 'Terjadi kesalahan database: ' . $e->getMessage(), 'status' => 'error']);
    } catch (Exception $e) {
        // Tangani error umum lainnya
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        http_response_code(500); // Internal Server Error
        echo json_encode(['message' => 'Terjadi kesalahan server: ' . $e->getMessage(), 'status' => 'error']);
    }
} else {
    // Metode request tidak diizinkan
    http_response_code(405); // Method Not Allowed
    echo json_encode(['message' => 'Metode request tidak diizinkan.', 'status' => 'error']);
}
?>
