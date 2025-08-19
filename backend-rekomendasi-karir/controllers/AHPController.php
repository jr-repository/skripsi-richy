<?php
// controllers/AHPController.php
require_once 'corsheader.php';
require_once 'BaseController.php';

class AHPController extends BaseController {

    private function checkJobAuthorization($pekerjaanId, $adminId) {
        $sql = "SELECT id FROM pekerjaan WHERE id = ? AND admin_id = ?";
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("ii", $pekerjaanId, $adminId);
        $stmt->execute();
        $result = $stmt->get_result();

        return $result->num_rows > 0;
    }

    // Helper untuk mengambil kriteria aktif untuk pekerjaan tertentu
    private function getActiveCriteria($pekerjaanId) {
        $sql = "SELECT kg.id, kg.nama_kriteria
                FROM pekerjaan_kriteria pk
                JOIN kriteria_global kg ON pk.kriteria_id = kg.id
                WHERE pk.pekerjaan_id = ? AND pk.aktif = TRUE
                ORDER BY kg.id ASC"; // Order by ID to ensure consistent matrix indexing
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("i", $pekerjaanId);
        $stmt->execute();
        $result = $stmt->get_result();
        $criteria = [];
        while ($row = $result->fetch_assoc()) {
            $criteria[$row['id']] = $row['nama_kriteria'];
        }
        $stmt->close();
        return $criteria;
    }

    // Helper untuk mengambil nilai perbandingan berpasangan yang sudah tersimpan
    public function getMatriksPerbandingan($pekerjaanId) {
        $criteria = $this->getActiveCriteria($pekerjaanId);
        if (empty($criteria)) {
            $this->sendResponse([], 200); // Send empty array, not 404
            return;
        }

        $kriteriaIds = array_keys($criteria);
        $placeholders = implode(',', array_fill(0, count($kriteriaIds), '?'));

        $sql = "SELECT kriteria_id_1, kriteria_id_2, nilai FROM ahp_matriks_perbandingan
                WHERE pekerjaan_id = ?
                AND kriteria_id_1 IN ($placeholders)
                AND kriteria_id_2 IN ($placeholders)";
        $stmt = $this->conn->prepare($sql);

        // FIX: Perbaiki bind_param untuk parameter dinamis
        $types = 'i' . str_repeat('i', count($kriteriaIds) * 2);
        $params = array_merge([&$pekerjaanId], $kriteriaIds, $kriteriaIds);
        $bindParams = [$types];
        foreach ($params as &$param) {
            $bindParams[] = &$param;
        }
        call_user_func_array([$stmt, 'bind_param'], $bindParams);
        
        $stmt->execute();
        $result = $stmt->get_result();
        $matriksData = [];
        while ($row = $result->fetch_assoc()) {
            $matriksData[] = $row;
        }

        $this->sendResponse($matriksData);
        $stmt->close();
    }


    // Menyimpan/memperbarui nilai matriks perbandingan
    public function saveMatriksPerbandingan($data, $adminId) {
        if (!isset($data['pekerjaan_id']) || !isset($data['matriks'])) {
            $this->sendError("Data tidak lengkap (pekerjaan_id atau matriks tidak ada).", 400);
            return;
        }

        $pekerjaanId = $data['pekerjaan_id'];

        if (!$this->checkJobAuthorization($pekerjaanId, $adminId)) {
            $this->sendError("Akses ditolak. Anda tidak memiliki izin untuk mengedit pekerjaan ini.", 403);
            return;
        }
        
        $matriks = $data['matriks']; // Array of {kriteria_id_1, kriteria_id_2, nilai}

        $this->conn->begin_transaction();
        try {
            foreach ($matriks as $item) {
                if (!isset($item['kriteria_id_1']) || !isset($item['kriteria_id_2']) || !isset($item['nilai'])) {
                    throw new Exception("Data matriks tidak valid.");
                }

                $stmt = $this->conn->prepare("INSERT INTO ahp_matriks_perbandingan (pekerjaan_id, kriteria_id_1, kriteria_id_2, nilai)
                                              VALUES (?, ?, ?, ?)
                                              ON DUPLICATE KEY UPDATE nilai = VALUES(nilai)");
                $stmt->bind_param("iidd", $pekerjaanId, $item['kriteria_id_1'], $item['kriteria_id_2'], $item['nilai']);
                if (!$stmt->execute()) {
                    throw new Exception("Gagal menyimpan matriks perbandingan: " . $stmt->error);
                }
                $stmt->close();
            }
            $this->conn->commit();
            $this->sendResponse(["message" => "Matriks perbandingan berhasil disimpan."]);
        } catch (Exception $e) {
            $this->conn->rollback();
            $this->sendError($e->getMessage(), 500);
        }
    }

    // Melakukan perhitungan AHP dan menyimpan bobot
    public function calculateAndSaveAHP($pekerjaanId, $adminId) {
        if (!$this->checkJobAuthorization($pekerjaanId, $adminId)) {
            $this->sendError("Akses ditolak. Anda tidak memiliki izin untuk mengedit pekerjaan ini.", 403);
            return;
        }

        $criteria = $this->getActiveCriteria($pekerjaanId);
        if (empty($criteria)) {
            $this->sendError("Tidak ada kriteria aktif untuk pekerjaan ini untuk perhitungan AHP.", 400);
            return;
        }

        $kriteriaIds = array_keys($criteria);
        $n = count($kriteriaIds);

        if ($n < 2) {
            $this->sendError("Dibutuhkan minimal 2 kriteria aktif untuk perhitungan AHP.", 400);
            return;
        }

        // Step 1: Ambil Matriks Perbandingan dari DB
        $matriksPerbandinganRaw = [];
        $placeholders = implode(',', array_fill(0, $n, '?'));
        $sql = "SELECT kriteria_id_1, kriteria_id_2, nilai FROM ahp_matriks_perbandingan
                WHERE pekerjaan_id = ?
                AND kriteria_id_1 IN ($placeholders)
                AND kriteria_id_2 IN ($placeholders)";
        $stmt = $this->conn->prepare($sql);
        
        // FIX: Perbaiki bind_param untuk parameter dinamis
        $types = 'i' . str_repeat('i', $n * 2);
        $params = array_merge([&$pekerjaanId], $kriteriaIds, $kriteriaIds);
        $bindParams = [$types];
        foreach ($params as &$param) {
            $bindParams[] = &$param;
        }
        call_user_func_array([$stmt, 'bind_param'], $bindParams);
        
        $stmt->execute();
        $result = $stmt->get_result();
        while ($row = $result->fetch_assoc()) {
            $matriksPerbandinganRaw[$row['kriteria_id_1']][$row['kriteria_id_2']] = (float)$row['nilai'];
        }
        $stmt->close();

        // Rekonstruksi matriks perbandingan lengkap (termasuk nilai diagonal dan kebalikan)
        $comparisonMatrix = [];
        foreach ($kriteriaIds as $i) {
            $comparisonMatrix[$i] = [];
            foreach ($kriteriaIds as $j) {
                if ($i == $j) {
                    $comparisonMatrix[$i][$j] = 1.0;
                } elseif (isset($matriksPerbandinganRaw[$i][$j])) {
                    $comparisonMatrix[$i][$j] = $matriksPerbandinganRaw[$i][$j];
                } elseif (isset($matriksPerbandinganRaw[$j][$i])) {
                    $comparisonMatrix[$i][$j] = 1.0 / $matriksPerbandinganRaw[$j][$i];
                } else {
                    $this->sendError("Matriks perbandingan tidak lengkap. Pastikan semua pasangan kriteria telah dibandingkan.", 400);
                    return;
                }
            }
        }

        // Inisialisasi untuk menyimpan hasil perantara
        $ahpResults = [
            'matriks_perbandingan' => [],
            'jumlah_kolom_matriks' => [],
            'matriks_normalisasi' => [],
            'vektor_prioritas' => [],
            'lambda_values' => [],
            'lambda_max' => null,
            'ci_value' => null,
            'cr_value' => null,
            'is_consistent' => false,
            'final_bobot' => []
        ];

        // Format matriks perbandingan untuk respons
        $formattedComparisonMatrix = [];
        foreach ($kriteriaIds as $rowId) {
            $row = ['kriteria_id' => $rowId, 'nama_kriteria' => $criteria[$rowId]];
            foreach ($kriteriaIds as $colId) {
                $row[$colId] = $comparisonMatrix[$rowId][$colId];
            }
            $formattedComparisonMatrix[] = $row;
        }
        $ahpResults['matriks_perbandingan'] = $formattedComparisonMatrix;


        // Step 2: Hitung Jumlah Kolom Matriks
        $colSums = array_fill_keys($kriteriaIds, 0.0);
        foreach ($kriteriaIds as $colId) {
            foreach ($kriteriaIds as $rowId) {
                $colSums[$colId] += $comparisonMatrix[$rowId][$colId];
            }
        }
        $ahpResults['jumlah_kolom_matriks'] = $colSums;

        // Step 3: Normalisasi Matriks
        $normalizedMatrix = [];
        foreach ($kriteriaIds as $rowId) {
            $normalizedMatrix[$rowId] = [];
            foreach ($kriteriaIds as $colId) {
                $normalizedMatrix[$rowId][$colId] = $comparisonMatrix[$rowId][$colId] / $colSums[$colId];
            }
        }

        // Format matriks normalisasi untuk respons
        $formattedNormalizedMatrix = [];
        foreach ($kriteriaIds as $rowId) {
            $row = ['kriteria_id' => $rowId, 'nama_kriteria' => $criteria[$rowId]];
            foreach ($kriteriaIds as $colId) {
                $row[$colId] = $normalizedMatrix[$rowId][$colId];
            }
            $formattedNormalizedMatrix[] = $row;
        }
        $ahpResults['matriks_normalisasi'] = $formattedNormalizedMatrix;

        // Step 4: Hitung Vektor Prioritas (Bobot Prioritas Awal)
        $priorityVector = [];
        foreach ($kriteriaIds as $rowId) {
            $rowSum = 0.0;
            foreach ($kriteriaIds as $colId) {
                $rowSum += $normalizedMatrix[$rowId][$colId];
            }
            $priorityVector[$rowId] = $rowSum / $n;
        }
        $ahpResults['vektor_prioritas'] = $priorityVector;

        // Step 5: Hitung Lambda Max (λmax)
        $lambdaValues = [];
        foreach ($kriteriaIds as $rowId) {
            $weightedSum = 0.0;
            foreach ($kriteriaIds as $colId) {
                $weightedSum += $comparisonMatrix[$rowId][$colId] * $priorityVector[$colId];
            }
            $lambdaValues[$rowId] = $weightedSum / $priorityVector[$rowId];
        }
        $lambda_max = array_sum($lambdaValues) / $n;
        $ahpResults['lambda_values'] = $lambdaValues;
        $ahpResults['lambda_max'] = $lambda_max;

        // Step 6: Uji Konsistensi (CI dan CR)
        $CI = ($lambda_max - $n) / ($n - 1);
        $ahpResults['ci_value'] = $CI;

        // Random Index (RI) values for n up to 10
        $RI_values = [
            1 => 0.00, 2 => 0.00, 3 => 0.58, 4 => 0.90, 5 => 1.12,
            6 => 1.24, 7 => 1.32, 8 => 1.41, 9 => 1.45, 10 => 1.49
        ];
        $RI = $RI_values[$n] ?? 0.0; // Default to 0 if n > 10, though generally n is small for AHP
        $CR = ($RI != 0) ? $CI / $RI : 0.0;
        $ahpResults['cr_value'] = $CR;
        $ahpResults['is_consistent'] = ($CR <= 0.1);

        // Simpan Hasil Bobot AHP ke Database
        $this->conn->begin_transaction();
        try {
            // Hapus bobot lama untuk pekerjaan ini
            $stmt_delete = $this->conn->prepare("DELETE FROM ahp_hasil_bobot WHERE pekerjaan_id = ?");
            $stmt_delete->bind_param("i", $pekerjaanId);
            $stmt_delete->execute();
            $stmt_delete->close();

            // Insert bobot baru
            // FIX: Perbaiki format string di bind_param
            $stmt_insert = $this->conn->prepare("INSERT INTO ahp_hasil_bobot (pekerjaan_id, kriteria_id, bobot, lambda_max, ci_value, cr_value, is_consistent) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $isConsistentInt = $ahpResults['is_consistent'] ? 1 : 0;
            foreach ($priorityVector as $kriteriaId => $bobot) {
                $stmt_insert->bind_param("iiddddi", $pekerjaanId, $kriteriaId, $bobot, $lambda_max, $CI, $CR, $isConsistentInt);
                if (!$stmt_insert->execute()) {
                    throw new Exception("Gagal menyimpan bobot AHP: " . $stmt_insert->error);
                }
            }
            $stmt_insert->close();
            $this->conn->commit();

            $ahpResults['final_bobot'] = $priorityVector;
            $ahpResults['message'] = "Perhitungan AHP berhasil dan bobot disimpan.";
            $this->sendResponse($ahpResults);

        } catch (Exception $e) {
            $this->conn->rollback();
            $this->sendError("Kesalahan saat menyimpan hasil AHP: " . $e->getMessage(), 500);
        }
    }

    public function getAHPBobot($pekerjaanId) {
        $sql = "SELECT ahb.kriteria_id, kg.nama_kriteria, ahb.bobot, ahb.lambda_max, ahb.ci_value, ahb.cr_value, ahb.is_consistent
                FROM ahp_hasil_bobot ahb
                JOIN kriteria_global kg ON ahb.kriteria_id = kg.id
                WHERE ahb.pekerjaan_id = ?
                ORDER BY ahb.kriteria_id ASC";
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("i", $pekerjaanId);
        $stmt->execute();
        $result = $stmt->get_result();
        $bobotData = [];
        if ($result->num_rows > 0) {
            while ($row = $result->fetch_assoc()) {
                $bobotData[] = $row;
            }
            $this->sendResponse($bobotData);
        } else {
            $this->sendError("Bobot AHP tidak ditemukan untuk pekerjaan ini.", 404);
        }
        $stmt->close();
    }
}
