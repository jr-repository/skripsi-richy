<?php
// controllers/ProfileMatchingController.php
require_once 'BaseController.php';

class ProfileMatchingController extends BaseController {

    private function checkJobAuthorization($pekerjaanId, $adminId) {
        $sql = "SELECT id FROM pekerjaan WHERE id = ? AND admin_id = ?";
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("ii", $pekerjaanId, $adminId);
        $stmt->execute();
        $result = $stmt->get_result();
        return $result->num_rows > 0;
    }

    private $gap_conversion = [
        0 => 5,
        1 => 4, -1 => 4,
        2 => 3, -2 => 3,
        3 => 2, -3 => 2,
        4 => 1, -4 => 1
    ];

    // Mengambil nilai ideal sub-kriteria untuk pekerjaan tertentu (yang aktif)
    public function getNilaiIdealSub($pekerjaanId) {
        try {
            $sql = "SELECT psd.id AS pekerjaan_sub_kriteria_detail_id, psd.pekerjaan_id,
                           psd.sub_kriteria_global_id, skg.nama_sub_kriteria, skg.kode_sub_kriteria,
                           skg.kriteria_global_id AS kriteria_id, kg.nama_kriteria, psd.nilai_ideal, psd.aktif
                    FROM pekerjaan_sub_kriteria_detail psd
                    JOIN sub_kriteria_global skg ON psd.sub_kriteria_global_id = skg.id
                    JOIN kriteria_global kg ON skg.kriteria_global_id = kg.id
                    WHERE psd.pekerjaan_id = ? AND psd.aktif = TRUE
                    ORDER BY kg.nama_kriteria ASC, skg.nama_sub_kriteria ASC";
            $stmt = $this->conn->prepare($sql);
            if (!$stmt) { throw new Exception("Prepare failed in getNilaiIdealSub: " . $this->conn->error); }
            $stmt->bind_param("i", $pekerjaanId);
            if (!$stmt->execute()) { throw new Exception("Execute failed in getNilaiIdealSub: " . $stmt->error); }
            $result = $stmt->get_result();
            $nilaiIdealData = [];
            while ($row = $result->fetch_assoc()) {
                $row['aktif'] = (int)$row['aktif'];
                $nilaiIdealData[] = $row;
            }
            $this->sendResponse($nilaiIdealData);
            $stmt->close();
        } catch (Exception $e) {
            $this->sendError("Server error in getNilaiIdealSub: " . $e->getMessage(), 500);
        }
    }

    // Menyimpan/memperbarui nilai ideal sub-kriteria
    public function saveNilaiIdealSub($data, $adminId) {
        $pekerjaan_id = null;
        if(isset($data['pekerjaan_sub_kriteria_detail_id'])) {
            $stmt = $this->conn->prepare("SELECT pekerjaan_id FROM pekerjaan_sub_kriteria_detail WHERE id = ?");
            $stmt->bind_param("i", $data['pekerjaan_sub_kriteria_detail_id']);
            $stmt->execute();
            $stmt->bind_result($pekerjaan_id);
            $stmt->fetch();
            $stmt->close();
        }

        if (!$this->checkJobAuthorization($pekerjaan_id, $adminId)) {
            $this->sendError("Akses ditolak. Anda tidak memiliki izin untuk mengedit pekerjaan ini.", 403);
            return;
        }

        try {
            if (!isset($data['pekerjaan_sub_kriteria_detail_id']) || !isset($data['nilai_ideal'])) {
                $this->sendError("Data nilai ideal sub-kriteria tidak lengkap.", 400);
                return;
            }
            $pekerjaanSubKriteriaDetailId = $data['pekerjaan_sub_kriteria_detail_id'];
            $nilaiIdeal = (int)$data['nilai_ideal'];

            $stmt = $this->conn->prepare("UPDATE pekerjaan_sub_kriteria_detail SET nilai_ideal = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?");
            if (!$stmt) { throw new Exception("Prepare failed in saveNilaiIdealSub: " . $this->conn->error); }
            $stmt->bind_param("ii", $nilaiIdeal, $pekerjaanSubKriteriaDetailId);
            if ($stmt->execute()) {
                if ($stmt->affected_rows > 0) {
                    $this->sendResponse(["message" => "Nilai ideal sub-kriteria berhasil diperbarui."]);
                } else {
                    $this->sendError("Entri sub-kriteria pekerjaan tidak ditemukan atau nilai ideal tidak berubah.", 404);
                }
            } else {
                throw new Exception("Gagal menyimpan nilai ideal sub-kriteria: " . $stmt->error);
            }
            $stmt->close();
        } catch (Exception $e) {
            $this->sendError("Server error in saveNilaiIdealSub: " . $e->getMessage(), 500);
        }
    }

    // Melakukan perhitungan Profile Matching dan menyimpan hasil akhir
    public function calculateAndSavePM($pekerjaanId, $adminId) {
        if (!$this->checkJobAuthorization($pekerjaanId, $adminId)) {
            $this->sendError("Akses ditolak. Anda tidak memiliki izin untuk mengedit pekerjaan ini.", 403);
            return;
        }

        try {
            // Step 1: Ambil Bobot AHP untuk pekerjaan ini
            $stmt_ahp = $this->conn->prepare("SELECT kriteria_id, bobot FROM ahp_hasil_bobot WHERE pekerjaan_id = ?");
            if (!$stmt_ahp) { throw new Exception("Prepare failed (stmt_ahp): " . $this->conn->error); }
            $stmt_ahp->bind_param("i", $pekerjaanId);
            if (!$stmt_ahp->execute()) { throw new Exception("Execute failed (stmt_ahp): " . $stmt_ahp->error); }
            $result_ahp = $stmt_ahp->get_result();
            $ahp_bobot = [];
            while ($row = $result_ahp->fetch_assoc()) {
                $ahp_bobot[$row['kriteria_id']] = (float)$row['bobot'];
            }
            $stmt_ahp->close();

            if (empty($ahp_bobot)) {
                $this->sendError("Bobot AHP belum dihitung atau tidak ditemukan untuk pekerjaan ini.", 400);
                return;
            }

            // Step 2: Ambil Sub-kriteria dan Nilai Ideal untuk pekerjaan ini (hanya yang aktif)
            // MODIFIKASI: Memperbaiki alias kolom 'kriteria_id' dari 'psd' ke 'skg'
            $stmt_sub = $this->conn->prepare("SELECT psd.sub_kriteria_global_id AS sub_kriteria_id,
                                                   skg.kriteria_global_id AS kriteria_id, -- PERBAIKAN: Ubah psd.kriteria_global_id menjadi skg.kriteria_global_id
                                                   psd.nilai_ideal,
                                                   skg.nama_sub_kriteria, skg.kode_sub_kriteria, kg.nama_kriteria
                                             FROM pekerjaan_sub_kriteria_detail psd
                                             JOIN sub_kriteria_global skg ON psd.sub_kriteria_global_id = skg.id
                                             JOIN kriteria_global kg ON skg.kriteria_global_id = kg.id
                                             WHERE psd.pekerjaan_id = ? AND psd.aktif = TRUE");
            if (!$stmt_sub) { throw new Exception("Prepare failed (stmt_sub): " . $this->conn->error); }
            $stmt_sub->bind_param("i", $pekerjaanId);
            if (!$stmt_sub->execute()) { throw new Exception("Execute failed (stmt_sub): " . $stmt_sub->error); }
            $result_sub = $stmt_sub->get_result();
            $sub_kriteria_data = [];
            $kriteria_to_sub = []; // Map kriteria_id to its sub_kriteria
            while ($row = $result_sub->fetch_assoc()) {
                $sub_kriteria_data[] = $row;
                if (!isset($kriteria_to_sub[$row['kriteria_id']])) {
                    $kriteria_to_sub[$row['kriteria_id']] = [];
                }
                $kriteria_to_sub[$row['kriteria_id']][] = $row;
            }
            $stmt_sub->close();

            if (empty($sub_kriteria_data)) {
                $this->sendError("Tidak ada sub-kriteria aktif yang diatur untuk pekerjaan ini. Harap atur di menu admin (Atur Kriteria -> Sub-Kriteria).", 400);
                return;
            }

            $pm_results = [
                'perhitungan_gap_bobot_nilai' => [],
                'perhitungan_nilai_total_aspek' => [],
                'nilai_akhir_total_pm' => 0.0
            ];

            $all_kriteria_ids = array_keys($ahp_bobot); // All active main criteria for this job
            $total_aspek_values = []; // To store average bobot_nilai per kriteria

            foreach ($all_kriteria_ids as $kriteriaId) {
                $related_sub_criteria = $kriteria_to_sub[$kriteriaId] ?? [];
                
                $sum_bobot_nilai_per_kriteria = 0.0;
                $count_sub_kriteria = 0;

                if (!empty($related_sub_criteria)) {
                    foreach ($related_sub_criteria as $sub_item) {
                        $nilai_ideal_sub = (float)$sub_item['nilai_ideal'];
                        $gap = $nilai_ideal_sub - $nilai_ideal_sub; // This will always be 0
                        $bobot_nilai_gap = $this->gap_conversion[$gap] ?? 0; // Should be 5 for gap 0

                        $pm_results['perhitungan_gap_bobot_nilai'][] = [
                            'pekerjaan_id' => $pekerjaanId,
                            'kriteria_id' => $kriteriaId,
                            'nama_kriteria' => $sub_item['nama_kriteria'],
                            'sub_kriteria_id' => $sub_item['sub_kriteria_id'],
                            'nama_sub_kriteria' => $sub_item['nama_sub_kriteria'],
                            'nilai_ideal_pekerjaan' => $nilai_ideal_sub,
                            'nilai_aktual_asumsi' => $nilai_ideal_sub,
                            'gap' => $gap,
                            'bobot_nilai' => $bobot_nilai_gap
                        ];

                        $sum_bobot_nilai_per_kriteria += $bobot_nilai_gap;
                        $count_sub_kriteria++;
                    }
                }
                
                if ($count_sub_kriteria > 0) {
                    $avg_bobot_nilai_per_kriteria = $sum_bobot_nilai_per_kriteria / $count_sub_kriteria;
                    $total_aspek_values[$kriteriaId] = $avg_bobot_nilai_per_kriteria;
                    $pm_results['perhitungan_nilai_total_aspek'][] = [
                        'kriteria_id' => $kriteriaId,
                        'nama_kriteria' => $related_sub_criteria[0]['nama_kriteria'] ?? 'N/A', // Ambil nama dari sub-kriteria terkait
                        'nilai_aspek' => $avg_bobot_nilai_per_kriteria
                    ];
                } else {
                    $total_aspek_values[$kriteriaId] = 0.0;
                    // Ambil nama kriteria dari ahp_bobot jika tidak ada sub-kriteria aktif
                    $nama_kriteria_from_ahp = null;
                    $stmt_kriteria_name = $this->conn->prepare("SELECT nama_kriteria FROM kriteria_global WHERE id = ?");
                    if ($stmt_kriteria_name) {
                        $stmt_kriteria_name->bind_param("i", $kriteriaId);
                        $stmt_kriteria_name->execute();
                        $result_kriteria_name = $stmt_kriteria_name->get_result();
                        if ($row_kriteria_name = $result_kriteria_name->fetch_assoc()) {
                            $nama_kriteria_from_ahp = $row_kriteria_name['nama_kriteria'];
                        }
                        $stmt_kriteria_name->close();
                    }
                    
                    $pm_results['perhitungan_nilai_total_aspek'][] = [
                        'kriteria_id' => $kriteriaId,
                        'nama_kriteria' => $nama_kriteria_from_ahp ?? 'N/A',
                        'nilai_aspek' => 0.0
                    ];
                }
            }

            // Step 3: Hitung Nilai Akhir Total (Gabungan AHP dan PM)
            $final_score_pm = 0.0;
            foreach ($ahp_bobot as $kriteriaId => $bobot_ahp) {
                $nilai_aspek = $total_aspek_values[$kriteriaId] ?? 0.0;
                $final_score_pm += ($bobot_ahp * $nilai_aspek);
            }
            $pm_results['nilai_akhir_total_pm'] = $final_score_pm;

            // Simpan Nilai Akhir PM ke Database
            $this->conn->begin_transaction();
            $stmt_insert_or_update = $this->conn->prepare("INSERT INTO pm_hasil_rekomendasi (pekerjaan_id, nilai_total_ahp_pm) VALUES (?, ?) ON DUPLICATE KEY UPDATE nilai_total_ahp_pm = VALUES(nilai_total_ahp_pm)");
            if (!$stmt_insert_or_update) { throw new Exception("Prepare failed in saving PM result: " . $this->conn->error); }
            $stmt_insert_or_update->bind_param("id", $pekerjaanId, $final_score_pm);
            if (!$stmt_insert_or_update->execute()) {
                throw new Exception("Gagal menyimpan hasil akhir PM: " . $stmt_insert_or_update->error);
            }
            $stmt_insert_or_update->close();
            $this->conn->commit();

            $pm_results['message'] = "Perhitungan Profile Matching berhasil dan nilai akhir disimpan.";
            $this->sendResponse($pm_results);

        } catch (Exception $e) {
            $this->conn->rollback();
            $this->sendError("Kesalahan saat menghitung dan menyimpan PM: " . $e->getMessage(), 500);
        }
    }
}
