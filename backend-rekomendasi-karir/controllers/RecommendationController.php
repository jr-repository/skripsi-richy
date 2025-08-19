<?php
// controllers/RecommendationController.php
require_once 'BaseController.php';

class RecommendationController extends BaseController {

    private $gap_conversion = [
        0 => 5,
        1 => 4, -1 => 4,
        2 => 3, -2 => 3,
        3 => 2, -3 => 2,
        4 => 1, -4 => 1
    ];

    public function getRecommendedJobs() {
        try {
            $sql = "SELECT p.id, p.nama, p.rata_rata_gaji, p.deskripsi, pmhr.nilai_total_ahp_pm
                    FROM pekerjaan p
                    LEFT JOIN pm_hasil_rekomendasi pmhr ON p.id = pmhr.pekerjaan_id
                    ORDER BY pmhr.nilai_total_ahp_pm DESC";
            $result = $this->conn->query($sql);
            if (!$result) {
                throw new Exception("SQL Error in getRecommendedJobs: " . $this->conn->error);
            }
            $jobs = [];
            if ($result->num_rows > 0) {
                while ($row = $result->fetch_assoc()) {
                    $row['nilai_total_ahp_pm'] = $row['nilai_total_ahp_pm'] !== null ? (float) $row['nilai_total_ahp_pm'] : null;
                    $jobs[] = $row;
                }
            }
            $this->sendResponse($jobs);
        } catch (Exception $e) {
            error_log("ERROR: RecommendationController::getRecommendedJobs - " . $e->getMessage());
            $this->sendError("Server error in getRecommendedJobs: " . $e->getMessage(), 500);
        }
    }

    public function calculateUserRecommendation($input) {
        error_log("DEBUG calculateUserRecommendation: START. Raw input: " . json_encode($input));
        try {
            if (!isset($input['user_kriteria_nilai']) || !is_array($input['user_kriteria_nilai'])) {
                error_log("DEBUG calculateUserRecommendation: Input user_kriteria_nilai tidak valid.");
                $this->sendError("Input kriteria pengguna tidak valid.", 400);
                return;
            }

            $user_kriteria_nilai = $input['user_kriteria_nilai'] ?? [];
            error_log("DEBUG calculateUserRecommendation: Filtered user input: " . json_encode($user_kriteria_nilai));

            // 1. Ambil semua pekerjaan yang sudah memiliki hasil AHP dan PM ideal
            $stmt_jobs = $this->conn->prepare("SELECT id, nama, rata_rata_gaji, deskripsi FROM pekerjaan");
            if (!$stmt_jobs) {
                 error_log("DEBUG calculateUserRecommendation: Prepare failed (stmt_jobs): " . $this->conn->error);
                 throw new Exception("Prepare failed (stmt_jobs): " . $this->conn->error);
            }
            if (!$stmt_jobs->execute()) {
                error_log("DEBUG calculateUserRecommendation: Execute failed (stmt_jobs): " . $stmt_jobs->error);
                throw new Exception("SQL Error (stmt_jobs): " . $stmt_jobs->error);
            }
            $result_jobs = $stmt_jobs->get_result();
            $all_jobs = [];
            while ($row = $result_jobs->fetch_assoc()) {
                $all_jobs[] = $row;
            }
            $stmt_jobs->close();
            error_log("DEBUG calculateUserRecommendation: Fetched " . count($all_jobs) . " jobs.");

            $recommendations = [];

            foreach ($all_jobs as $job) {
                $pekerjaanId = $job['id'];
                error_log("DEBUG calculateUserRecommendation: Processing Job ID: $pekerjaanId ({$job['nama']})");

                // a. Ambil Bobot AHP untuk pekerjaan ini
                $stmt_ahp = $this->conn->prepare("SELECT ahb.kriteria_id, ahb.bobot, kg.nama_kriteria
                                                  FROM ahp_hasil_bobot ahb
                                                  JOIN kriteria_global kg ON ahb.kriteria_id = kg.id
                                                  WHERE ahb.pekerjaan_id = ?");
                if (!$stmt_ahp) {
                    error_log("DEBUG calculateUserRecommendation: Prepare failed (stmt_ahp) for job $pekerjaanId: " . $this->conn->error);
                    throw new Exception("Prepare failed (stmt_ahp): " . $this->conn->error);
                }
                $stmt_ahp->bind_param("i", $pekerjaanId);
                if (!$stmt_ahp->execute()) {
                    error_log("DEBUG calculateUserRecommendation: Execute failed (stmt_ahp) for job $pekerjaanId: " . $stmt_ahp->error);
                    throw new Exception("SQL Error (stmt_ahp): " . $stmt_ahp->error);
                }
                $result_ahp = $stmt_ahp->get_result();
                $ahp_bobot_data = [];
                while ($row = $result_ahp->fetch_assoc()) {
                    $ahp_bobot_data[$row['kriteria_id']] = [
                        'bobot' => (float)$row['bobot'],
                        'nama_kriteria_utama' => $row['nama_kriteria']
                    ];
                }
                $stmt_ahp->close();

                if (empty($ahp_bobot_data)) {
                    error_log("DEBUG calculateUserRecommendation: Skipping job $pekerjaanId - No AHP bobot found.");
                    continue; // Lewati pekerjaan ini jika bobot AHP tidak diatur
                }
                error_log("DEBUG calculateUserRecommendation: AHP bobot for job $pekerjaanId: " . json_encode($ahp_bobot_data));

                // b. Ambil Sub-kriteria dan Nilai Ideal untuk pekerjaan ini
                $stmt_sub = $this->conn->prepare("SELECT psd.sub_kriteria_global_id AS sub_kriteria_id,
                                                         skg.kriteria_global_id AS kriteria_id,
                                                         psd.nilai_ideal,
                                                         skg.nama_sub_kriteria, skg.kode_sub_kriteria, kg.nama_kriteria
                                                  FROM pekerjaan_sub_kriteria_detail psd
                                                  JOIN sub_kriteria_global skg ON psd.sub_kriteria_global_id = skg.id
                                                  JOIN kriteria_global kg ON skg.kriteria_global_id = kg.id
                                                  WHERE psd.pekerjaan_id = ? AND psd.aktif = TRUE
                                                  ORDER BY kg.nama_kriteria ASC, skg.nama_sub_kriteria ASC");
                if (!$stmt_sub) {
                    error_log("DEBUG calculateUserRecommendation: Prepare failed (stmt_sub) for job $pekerjaanId: " . $this->conn->error);
                    throw new Exception("Prepare failed (stmt_sub): " . $this->conn->error);
                }
                $stmt_sub->bind_param("i", $pekerjaanId);
                if (!$stmt_sub->execute()) {
                    error_log("DEBUG calculateUserRecommendation: Execute failed (stmt_sub) for job $pekerjaanId: " . $stmt_sub->error);
                    throw new Exception("SQL Error (stmt_sub): " . $stmt_sub->error);
                }
                $result_sub = $stmt_sub->get_result();
                $job_sub_criteria_grouped = [];
                while ($row = $result_sub->fetch_assoc()) {
                    $job_sub_criteria_grouped[$row['kriteria_id']][] = $row;
                }
                $stmt_sub->close();

                if (empty($job_sub_criteria_grouped)) {
                    error_log("DEBUG calculateUserRecommendation: Skipping job $pekerjaanId - No active sub-criteria found.");
                    continue; // Lewati jika tidak ada sub-kriteria yang didefinisikan untuk pekerjaan ini
                }
                error_log("DEBUG calculateUserRecommendation: Active sub-criteria for job $pekerjaanId: " . json_encode($job_sub_criteria_grouped));


                $current_job_total_score = 0.0;
                $pm_gap_bobot_details = [];
                $pm_total_aspek_details = [];

                // Hitung untuk setiap kriteria utama (misal: KT, SS, M)
                foreach ($ahp_bobot_data as $kriteriaId => $ahp_item) {
                    $ahp_weight = $ahp_item['bobot'];
                    $nama_kriteria_utama = $ahp_item['nama_kriteria_utama'];
                    error_log("DEBUG calculateUserRecommendation: Processing main criterion: $nama_kriteria_utama (ID: $kriteriaId) with AHP weight: $ahp_weight");


                    $sub_criteria_for_kriteria = $job_sub_criteria_grouped[$kriteriaId] ?? [];

                    // Jika tidak ada sub-kriteria untuk kriteria utama ini, atau tidak ada yang aktif/diisi user
                    if (empty($sub_criteria_for_kriteria)) {
                        error_log("DEBUG calculateUserRecommendation: Main criterion $nama_kriteria_utama has no relevant active sub-criteria for PM or user input.");
                        // Tambahkan entri dengan nilai 0 agar konsisten di total_aspek_details
                        $pm_total_aspek_details[] = [
                            'kriteria_id' => $kriteriaId,
                            'nama_kriteria' => $nama_kriteria_utama,
                            'nilai_aspek' => 0.0
                        ];
                        continue; // Lewati ke kriteria utama berikutnya
                    }

                    $sum_bobot_nilai_sub = 0.0;
                    $count_evaluated_sub_criteria = 0;

                    foreach ($sub_criteria_for_kriteria as $sub_item) {
                        $sub_kriteria_id = $sub_item['sub_kriteria_id'];
                        $nama_sub_kriteria = $sub_item['nama_sub_kriteria'];
                        $nilai_ideal_sub = (float)$sub_item['nilai_ideal'];
                        $nilai_aktual_user = null; // Default to null

                        if (isset($user_kriteria_nilai[$sub_kriteria_id]) && ($user_kriteria_nilai[$sub_kriteria_id] !== null) && ($user_kriteria_nilai[$sub_kriteria_id] !== 0)) { // 0 dianggap kosong
                            $nilai_aktual_user = (float)$user_kriteria_nilai[$sub_kriteria_id];
                            $gap = $nilai_aktual_user - $nilai_ideal_sub;
                            $bobot_nilai = $this->gap_conversion[$gap] ?? 0;
                            
                            $sum_bobot_nilai_sub += $bobot_nilai;
                            $count_evaluated_sub_criteria++;

                            error_log("DEBUG calculateUserRecommendation: Sub-criterion $nama_sub_kriteria (ID: $sub_kriteria_id) - Ideal: $nilai_ideal_sub, Actual: $nilai_aktual_user, Gap: $gap, Bobot: $bobot_nilai");

                            $pm_gap_bobot_details[] = [
                                'pekerjaan_id' => $pekerjaanId,
                                'kriteria_id' => $kriteriaId,
                                'nama_kriteria' => $nama_kriteria_utama,
                                'sub_kriteria_id' => $sub_kriteria_id,
                                'nama_sub_kriteria' => $nama_sub_kriteria,
                                'nilai_ideal_pekerjaan' => $nilai_ideal_sub,
                                'nilai_aktual_user' => $nilai_aktual_user,
                                'gap' => $gap,
                                'bobot_nilai' => $bobot_nilai
                            ];
                        } else {
                            // Jika user tidak mengisi nilai untuk sub-kriteria ini, tetap masukkan ke detail tapi dengan nulls
                            error_log("DEBUG calculateUserRecommendation: Sub-criterion $nama_sub_kriteria (ID: $sub_kriteria_id) - User did not provide input.");
                            $pm_gap_bobot_details[] = [
                                'pekerjaan_id' => $pekerjaanId,
                                'kriteria_id' => $kriteriaId,
                                'nama_kriteria' => $nama_kriteria_utama,
                                'sub_kriteria_id' => $sub_kriteria_id,
                                'nama_sub_kriteria' => $nama_sub_kriteria,
                                'nilai_ideal_pekerjaan' => $nilai_ideal_sub,
                                'nilai_aktual_user' => null,
                                'gap' => null,
                                'bobot_nilai' => null
                            ];
                        }
                    }

                    // Hanya tambahkan ke skor total jika ada sub-kriteria yang dievaluasi
                    if ($count_evaluated_sub_criteria > 0) {
                        $average_bobot_nilai_kriteria = $sum_bobot_nilai_sub / $count_evaluated_sub_criteria;
                        error_log("DEBUG calculateUserRecommendation: Main criterion $nama_kriteria_utama - Average Bobot Nilai: $average_bobot_nilai_kriteria");
                        $pm_total_aspek_details[] = [
                            'kriteria_id' => $kriteriaId,
                            'nama_kriteria' => $nama_kriteria_utama,
                            'nilai_aspek' => $average_bobot_nilai_kriteria
                        ];
                        $current_job_total_score += ($ahp_weight * $average_bobot_nilai_kriteria);
                    } else {
                        error_log("DEBUG calculateUserRecommendation: Main criterion $nama_kriteria_utama - No user input for its sub-criteria. Contributing 0 to score.");
                         $pm_total_aspek_details[] = [
                            'kriteria_id' => $kriteriaId,
                            'nama_kriteria' => $nama_kriteria_utama,
                            'nilai_aspek' => 0.0
                        ];
                    }
                }

                error_log("DEBUG calculateUserRecommendation: Final score for job {$job['nama']} before adding to recommendations: $current_job_total_score");
                $recommendations[] = [
                    'id' => $job['id'],
                    'nama' => $job['nama'],
                    'rata_rata_gaji' => $job['rata_rata_gaji'],
                    'deskripsi' => $job['deskripsi'],
                    'nilai_rekomendasi' => $current_job_total_score,
                    'stats' => [
                        'pm_gap_bobot_details' => $pm_gap_bobot_details,
                        'pm_total_aspek_details' => $pm_total_aspek_details,
                        'nilai_akhir_total_pm' => $current_job_total_score
                    ]
                ];
            }

            usort($recommendations, function($a, $b) {
                return $b['nilai_rekomendasi'] <=> $a['nilai_rekomendasi'];
            });
            error_log("DEBUG calculateUserRecommendation: Final recommendations: " . json_encode($recommendations));

            $this->sendResponse($recommendations);
        } catch (Exception $e) {
            error_log("DEBUG calculateUserRecommendation: EXCEPTION caught: " . $e->getMessage() . " Stack: " . $e->getTraceAsString());
            $this->sendError("Server error in calculateUserRecommendation: " . $e->getMessage(), 500);
        }
        error_log("DEBUG calculateUserRecommendation: END.");
    }

    public function getJobCalculationStatistics($pekerjaanId) {
        error_log("DEBUG getJobCalculationStatistics: START. Pekerjaan ID: $pekerjaanId");
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            $user_kriteria_nilai = $input['user_kriteria_nilai'] ?? [];
            error_log("DEBUG getJobCalculationStatistics: User input for stats: " . json_encode($user_kriteria_nilai));

            $pm_results = [
                'perhitungan_gap_bobot_nilai' => [],
                'perhitungan_nilai_total_aspek' => [],
                'nilai_akhir_total_pm' => 0.0
            ];

            $stmt_ahp = $this->conn->prepare("SELECT ahb.kriteria_id, ahb.bobot, kg.nama_kriteria
                                              FROM ahp_hasil_bobot ahb
                                              JOIN kriteria_global kg ON ahb.kriteria_id = kg.id
                                              WHERE ahb.pekerjaan_id = ?");
            if (!$stmt_ahp) {
                error_log("DEBUG getJobCalculationStatistics: Prepare failed (stmt_ahp): " . $this->conn->error);
                throw new Exception("Prepare failed (stmt_ahp): " . $this->conn->error);
            }
            $stmt_ahp->bind_param("i", $pekerjaanId);
            if (!$stmt_ahp->execute()) {
                error_log("DEBUG getJobCalculationStatistics: Execute failed (stmt_ahp): " . $stmt_ahp->error);
                throw new Exception("SQL Error (stmt_ahp): " . $stmt_ahp->error);
            }
            $result_ahp = $stmt_ahp->get_result();
            $ahp_bobot_data = [];
            while ($row = $result_ahp->fetch_assoc()) {
                $ahp_bobot_data[$row['kriteria_id']] = [
                    'bobot' => (float)$row['bobot'],
                    'nama_kriteria_utama' => $row['nama_kriteria']
                ];
            }
            $stmt_ahp->close();

            if (empty($ahp_bobot_data)) {
                error_log("DEBUG getJobCalculationStatistics: Bobot AHP tidak ditemukan untuk pekerjaan ini. (ID: $pekerjaanId)");
                $this->sendError("Bobot AHP belum dihitung atau tidak ditemukan untuk pekerjaan ini.", 400);
                return;
            }
            error_log("DEBUG getJobCalculationStatistics: AHP bobot data: " . json_encode($ahp_bobot_data));

            $stmt_sub = $this->conn->prepare("SELECT psd.sub_kriteria_global_id AS sub_kriteria_id,
                                                     skg.kriteria_global_id AS kriteria_id,
                                                     psd.nilai_ideal,
                                                     skg.nama_sub_kriteria, skg.kode_sub_kriteria, kg.nama_kriteria
                                              FROM pekerjaan_sub_kriteria_detail psd
                                              JOIN sub_kriteria_global skg ON psd.sub_kriteria_global_id = skg.id
                                              JOIN kriteria_global kg ON skg.kriteria_global_id = kg.id
                                              WHERE psd.pekerjaan_id = ? AND psd.aktif = TRUE
                                              ORDER BY kg.nama_kriteria ASC, skg.nama_sub_kriteria ASC");
            if (!$stmt_sub) {
                error_log("DEBUG getJobCalculationStatistics: Prepare failed (stmt_sub): " . $this->conn->error);
                throw new Exception("Prepare failed (stmt_sub): " . $this->conn->error);
            }
            $stmt_sub->bind_param("i", $pekerjaanId);
            if (!$stmt_sub->execute()) {
                error_log("DEBUG getJobCalculationStatistics: Execute failed (stmt_sub): " . $stmt_sub->error);
                throw new Exception("SQL Error (stmt_sub): " . $stmt_sub->error);
            }
            $result_sub = $stmt_sub->get_result();
            $sub_kriteria_data_by_kriteria = [];
            while ($row = $result_sub->fetch_assoc()) {
                $sub_kriteria_data_by_kriteria[$row['kriteria_id']][] = $row;
            }
            $stmt_sub->close();

            if (empty($sub_kriteria_data_by_kriteria)) {
                error_log("DEBUG getJobCalculationStatistics: No active sub-criteria found for job $pekerjaanId. Sending empty results.");
                $this->sendResponse($pm_results);
                return;
            }
            error_log("DEBUG getJobCalculationStatistics: Active sub-criteria for stats: " . json_encode($sub_kriteria_data_by_kriteria));


            $all_kriteria_ids_from_ahp_bobot = array_keys($ahp_bobot_data);
            $total_aspek_values_for_calc = [];

            foreach ($all_kriteria_ids_from_ahp_bobot as $kriteriaId) {
                $ahp_item = $ahp_bobot_data[$kriteriaId];
                $ahp_weight = $ahp_item['bobot'];
                $nama_kriteria_utama = $ahp_item['nama_kriteria_utama'];
                error_log("DEBUG getJobCalculationStatistics: Processing main criterion for stats: $nama_kriteria_utama (ID: $kriteriaId)");


                $related_sub_criteria = $sub_kriteria_data_by_kriteria[$kriteriaId] ?? [];
                
                $sum_bobot_nilai_per_kriteria = 0.0;
                $count_evaluated_sub_criteria = 0;

                if (!empty($related_sub_criteria)) {
                    foreach ($related_sub_criteria as $sub_item) {
                        $nilai_ideal_sub = (float)$sub_item['nilai_ideal'];
                        $sub_kriteria_id = $sub_item['sub_kriteria_id'];
                        $nama_sub_kriteria = $sub_item['nama_sub_kriteria'];

                        $nilai_aktual_user_for_sub = null;

                        if (isset($user_kriteria_nilai[$sub_kriteria_id]) && ($user_kriteria_nilai[$sub_kriteria_id] !== null) && ($user_kriteria_nilai[$sub_kriteria_id] !== 0)) {
                            $nilai_aktual_user_for_sub = (float)$user_kriteria_nilai[$sub_kriteria_id];
                            $gap = $nilai_aktual_user_for_sub - $nilai_ideal_sub;
                            $bobot_nilai_gap = $this->gap_conversion[$gap] ?? 0;
                            error_log("DEBUG getJobCalculationStatistics: Sub-criterion $nama_sub_kriteria (ID: $sub_kriteria_id) - Ideal: $nilai_ideal_sub, Actual: $nilai_aktual_user_for_sub, Gap: $gap, Bobot: $bobot_nilai_gap");

                            $sum_bobot_nilai_per_kriteria += $bobot_nilai_gap;
                            $count_evaluated_sub_criteria++;
                        } else {
                            error_log("DEBUG getJobCalculationStatistics: Sub-criterion $nama_sub_kriteria (ID: $sub_kriteria_id) - User did not provide input for stats. (Actual: " . ($user_kriteria_nilai[$sub_kriteria_id] ?? 'N/A') . ")");
                            $nilai_aktual_user_for_sub = null; // Explicitly null if not provided or is 0
                            $gap = null;
                            $bobot_nilai_gap = null;
                        }

                        $pm_results['perhitungan_gap_bobot_nilai'][] = [
                            'pekerjaan_id' => $pekerjaanId,
                            'kriteria_id' => $kriteriaId,
                            'nama_kriteria' => $nama_kriteria_utama,
                            'sub_kriteria_id' => $sub_kriteria_id,
                            'nama_sub_kriteria' => $nama_sub_kriteria,
                            'nilai_ideal_pekerjaan' => $nilai_ideal_sub,
                            'nilai_aktual_user' => $nilai_aktual_user_for_sub,
                            'gap' => $gap,
                            'bobot_nilai' => $bobot_nilai_gap
                        ];
                    }
                }
                
                $avg_bobot_nilai_per_kriteria = ($count_evaluated_sub_criteria > 0) ? ($sum_bobot_nilai_per_kriteria / $count_evaluated_sub_criteria) : 0.0;
                $total_aspek_values_for_calc[$kriteriaId] = $avg_bobot_nilai_per_kriteria;
                $pm_results['perhitungan_nilai_total_aspek'][] = [
                    'kriteria_id' => $kriteriaId,
                    'nama_kriteria' => $nama_kriteria_utama,
                    'nilai_aspek' => $avg_bobot_nilai_per_kriteria
                ];
                error_log("DEBUG getJobCalculationStatistics: Main criterion $nama_kriteria_utama - Average Bobot Nilai for stats: $avg_bobot_nilai_per_kriteria");
            }

            $final_score_pm = 0.0;
            foreach ($ahp_bobot_data as $kriteriaId => $ahp_item) {
                $bobot_ahp = $ahp_item['bobot'];
                $nilai_aspek = $total_aspek_values_for_calc[$kriteriaId] ?? 0.0;
                $final_score_pm += ($bobot_ahp * $nilai_aspek);
            }
            $pm_results['nilai_akhir_total_pm'] = $final_score_pm;
            error_log("DEBUG getJobCalculationStatistics: Final PM Score for stats: $final_score_pm");

            $this->sendResponse($pm_results);
        } catch (Exception $e) {
            error_log("DEBUG getJobCalculationStatistics: EXCEPTION caught: " . $e->getMessage() . " Stack: " . $e->getTraceAsString());
            $this->sendError("Server error in getJobCalculationStatistics: " . $e->getMessage(), 500);
        }
        error_log("DEBUG getJobCalculationStatistics: END.");
    }
}
