<?php
// controllers/KriteriaController.php
require_once 'BaseController.php';

class KriteriaController extends BaseController {

    private function checkJobAuthorization($pekerjaanId, $adminId) {
        $sql = "SELECT id FROM pekerjaan WHERE id = ? AND admin_id = ?";
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("ii", $pekerjaanId, $adminId);
        $stmt->execute();
        $result = $stmt->get_result();

        return $result->num_rows > 0;
    }

    // Fungsi checkGlobalAuthorization dan checkSubGlobalAuthorization dihapus karena tidak lagi diperlukan.
    // Otorisasi sekarang hanya memastikan adminId tidak kosong.

    public function getAllGlobal() {
        try {
            $sql = "SELECT id, nama_kriteria FROM kriteria_global ORDER BY nama_kriteria ASC";
            $result = $this->conn->query($sql);
            if (!$result) {
                throw new Exception("SQL Error in getAllGlobal: " . $this->conn->error);
            }
            $kriteria = [];
            while ($row = $result->fetch_assoc()) {
                $kriteria[] = $row;
            }
            $this->sendResponse($kriteria);
        } catch (Exception $e) {
            error_log("ERROR: KriteriaController::getAllGlobal - " . $e->getMessage());
            $this->sendError("Server error in getAllGlobal: " . $e->getMessage(), 500);
        }
    }

    public function getById($id) {
        try {
            $stmt = $this->conn->prepare("SELECT id, nama_kriteria FROM kriteria_global WHERE id = ?");
            if (!$stmt) { throw new Exception("Prepare failed in getById: " . $this->conn->error); }
            $stmt->bind_param("i", $id);
            if (!$stmt->execute()) { throw new Exception("Execute failed in getById: " . $stmt->error); }
            $result = $stmt->get_result();
            if ($result->num_rows > 0) {
                $this->sendResponse($result->fetch_assoc());
            } else {
                $this->sendError("Kriteria global tidak ditemukan.", 404);
            }
            $stmt->close();
        } catch (Exception $e) {
            error_log("ERROR: KriteriaController::getById - " . $e->getMessage());
            $this->sendError("Server error in getById: " . $e->getMessage(), 500);
        }
    }

    public function createGlobal($data, $adminId) {
        if (!$adminId) {
            $this->sendError("Unauthorized.", 401);
            return;
        }
        if (!isset($data['nama_kriteria'])) {
            $this->sendError("Nama kriteria tidak boleh kosong.", 400);
            return;
        }
        $stmt = $this->conn->prepare("INSERT INTO kriteria_global (nama_kriteria, admin_id) VALUES (?, ?)");
        if (!$stmt) { throw new Exception("Prepare failed in createGlobal: " . $this->conn->error); }
        $stmt->bind_param("si", $data['nama_kriteria'], $adminId);
        if (!$stmt->execute()) {
            if ($this->conn->errno == 1062) {
                $this->sendError("Kriteria dengan nama ini sudah ada.", 409);
            } else {
                throw new Exception("Gagal menambahkan kriteria global: " . $stmt->error);
            }
        } else {
            $this->sendResponse(["message" => "Kriteria global berhasil ditambahkan.", "id" => $stmt->insert_id], 201);
        }
        $stmt->close();
    }

    public function updateGlobal($id, $data, $adminId) {
        // FIX: Hapus pengecekan otorisasi, biarkan semua admin yang login bisa mengedit
        // if (!$this->checkGlobalAuthorization($id, $adminId)) { ... }
        if (!isset($data['nama_kriteria'])) {
            $this->sendError("Nama kriteria tidak boleh kosong.", 400);
            return;
        }
        $stmt = $this->conn->prepare("UPDATE kriteria_global SET nama_kriteria = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?");
        if (!$stmt) { throw new Exception("Prepare failed in updateGlobal: " . $this->conn->error); }
        $stmt->bind_param("si", $data['nama_kriteria'], $id);
        if (!$stmt->execute()) {
            if ($this->conn->errno == 1062) {
                $this->sendError("Kriteria dengan nama ini sudah ada.", 409);
            } else {
                throw new Exception("Gagal memperbarui kriteria global: " . $stmt->error);
            }
        } else {
            if ($stmt->affected_rows > 0) {
                $this->sendResponse(["message" => "Kriteria global berhasil diperbarui."]);
            } else {
                $this->sendError("Kriteria global tidak ditemukan atau tidak ada perubahan.", 404);
            }
        }
        $stmt->close();
    }

    public function deleteGlobal($id, $adminId) {
        // FIX: Hapus pengecekan otorisasi, biarkan semua admin yang login bisa menghapus
        // if (!$this->checkGlobalAuthorization($id, $adminId)) { ... }
        try {
            $stmt = $this->conn->prepare("DELETE FROM kriteria_global WHERE id = ?");
            if (!$stmt) { throw new Exception("Prepare failed in deleteGlobal: " . $this->conn->error); }
            $stmt->bind_param("i", $id);
            if (!$stmt->execute()) {
                throw new Exception("Gagal menghapus kriteria global: " . $stmt->error);
            }
            if ($stmt->affected_rows > 0) {
                $this->sendResponse(["message" => "Kriteria global berhasil dihapus."]);
            } else {
                $this->sendError("Kriteria global tidak ditemukan.", 404);
            }
            $stmt->close();
        } catch (Exception $e) {
            error_log("ERROR: KriteriaController::deleteGlobal - " . $e->getMessage());
            $this->sendError("Server error in deleteGlobal: " . $e->getMessage(), 500);
        }
    }

    // --- Pekerjaan Kriteria (aktivasi kriteria utama per pekerjaan) ---
    public function getJobCriteria($pekerjaanId) {
        try {
            $sql = "SELECT pk.id, kg.id AS kriteria_id, kg.nama_kriteria, pk.aktif
                    FROM pekerjaan_kriteria pk
                    JOIN kriteria_global kg ON pk.kriteria_id = kg.id
                    WHERE pk.pekerjaan_id = ?
                    ORDER BY kg.nama_kriteria ASC";
            $stmt = $this->conn->prepare($sql);
            if (!$stmt) { throw new Exception("Prepare failed in getJobCriteria: " . $this->conn->error); }
            $stmt->bind_param("i", $pekerjaanId);
            if (!$stmt->execute()) { throw new Exception("Execute failed in getJobCriteria: " . $stmt->error); }
            $result = $stmt->get_result();
            $jobCriteria = [];
            while ($row = $result->fetch_assoc()) {
                $row['aktif'] = (int)$row['aktif'];
                $jobCriteria[] = $row;
            }
            $this->sendResponse($jobCriteria);
            $stmt->close();
        } catch (Exception $e) {
            error_log("ERROR: KriteriaController::getJobCriteria - " . $e->getMessage());
            $this->sendError("Server error in getJobCriteria: " . $e->getMessage(), 500);
        }
    }

    public function toggleJobCriterion($data, $adminId) {
        $pekerjaan_id = $data['pekerjaan_id'] ?? null;
        $kriteria_id = $data['kriteria_id'] ?? null;
        $aktif = $data['aktif'] ?? null;

        if (!$this->checkJobAuthorization($pekerjaan_id, $adminId)) {
            $this->sendError("Akses ditolak. Anda tidak memiliki izin untuk mengedit kriteria pekerjaan ini.", 403);
            return;
        }
        
        error_log("DEBUG toggleJobCriterion: START. Input data: " . json_encode($data));
        try {
            if (!isset($data['pekerjaan_id']) || !isset($data['kriteria_id']) || !isset($data['aktif'])) {
                error_log("DEBUG toggleJobCriterion: Data tidak lengkap.");
                $this->sendError("Data tidak lengkap (pekerjaan_id, kriteria_id, atau aktif tidak ada).", 400);
                return;
            }

            $pekerjaanId = (int)$data['pekerjaan_id'];
            $kriteriaId = (int)$data['kriteria_id'];
            $aktif = (int)$data['aktif'];
            error_log("DEBUG toggleJobCriterion: Parsed data - PekerjaanID: $pekerjaanId, KriteriaID: $kriteriaId, Aktif: $aktif");

            $this->conn->begin_transaction();
            error_log("DEBUG toggleJobCriterion: Transaksi dimulai.");

            $stmt_check = $this->conn->prepare("SELECT id, aktif FROM pekerjaan_kriteria WHERE pekerjaan_id = ? AND kriteria_id = ?");
            if (!$stmt_check) {
                error_log("DEBUG toggleJobCriterion: Prepare SELECT gagal: " . $this->conn->error);
                throw new Exception("Prepare failed (check exists): " . $this->conn->error);
            }
            $stmt_check->bind_param("ii", $pekerjaanId, $kriteriaId);
            if (!$stmt_check->execute()) {
                error_log("DEBUG toggleJobCriterion: Execute SELECT gagal: " . $stmt_check->error);
                throw new Exception("Execute failed (check exists): " . $stmt_check->error);
            }
            $result_check = $stmt_check->get_result();

            if ($result_check->num_rows > 0) {
                $row = $result_check->fetch_assoc();
                $pkId = (int)$row['id'];
                $current_aktif_status = (int)$row['aktif'];
                error_log("DEBUG toggleJobCriterion: Record ditemukan. pkId: $pkId, Current Aktif: $current_aktif_status. Requested Aktif: $aktif");

                if ($current_aktif_status === $aktif) {
                    $this->conn->commit();
                    error_log("DEBUG toggleJobCriterion: Status sudah sama, commit tanpa update.");
                    $this->sendResponse(["message" => "Status kriteria pekerjaan sudah sesuai (tidak ada perubahan diperlukan)."]);
                    return;
                }

                $stmt_update = $this->conn->prepare("UPDATE pekerjaan_kriteria SET aktif = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?");
                if (!$stmt_update) {
                    error_log("DEBUG toggleJobCriterion: Prepare UPDATE gagal: " . $this->conn->error);
                    throw new Exception("Prepare failed (update status): " . $this->conn->error);
                }
                $stmt_update->bind_param("ii", $aktif, $pkId);
                if (!$stmt_update->execute()) {
                    error_log("DEBUG toggleJobCriterion: Execute UPDATE gagal: " . $stmt_update->error);
                    throw new Exception("Gagal memperbarui status kriteria pekerjaan: " . $stmt_update->error);
                }
                $affected_rows = $stmt_update->affected_rows;
                $stmt_update->close();
                
                if ($affected_rows > 0) {
                    $this->conn->commit();
                    error_log("DEBUG toggleJobCriterion: UPDATE berhasil. Affected rows: $affected_rows. Commit transaksi.");
                    $this->sendResponse(["message" => "Status kriteria berhasil diperbarui."]);
                } else {
                    error_log("DEBUG toggleJobCriterion: UPDATE gagal (affected_rows=0). pkId: $pkId, set_aktif: $aktif. Rollback transaksi.");
                    $this->conn->rollback();
                    $this->sendError("Pembaruan status kriteria gagal: Data tidak terpengaruh. (pkId: $pkId, set_aktif: $aktif)", 500);
                }
            } else {
                error_log("DEBUG toggleJobCriterion: Record tidak ditemukan, melakukan INSERT baru.");
                $stmt_insert = $this->conn->prepare("INSERT INTO pekerjaan_kriteria (pekerjaan_id, kriteria_id, aktif) VALUES (?, ?, ?)");
                if (!$stmt_insert) {
                    error_log("DEBUG toggleJobCriterion: Prepare INSERT gagal: " . $this->conn->error);
                    throw new Exception("Prepare failed (insert new): " . $this->conn->error);
                }
                $stmt_insert->bind_param("iii", $pekerjaanId, $kriteriaId, $aktif);
                if (!$stmt_insert->execute()) {
                    error_log("DEBUG toggleJobCriterion: Execute INSERT gagal: " . $stmt_insert->error);
                    throw new Exception("Gagal menambahkan kriteria pekerjaan: " . $stmt_insert->error);
                }
                $stmt_insert->close();
                $this->conn->commit();
                error_log("DEBUG toggleJobCriterion: INSERT berhasil. Commit transaksi. Sending response.");
                $this->sendResponse(["message" => "Status kriteria berhasil diperbarui."]);
            }
            $stmt_check->close();
            
        } catch (Exception $e) {
            error_log("DEBUG toggleJobCriterion: EXCEPTION caught: " . $e->getMessage());
            $this->conn->rollback();
            $this->sendError("Server error in toggleJobCriterion: " . $e->getMessage(), 500);
        }
        error_log("DEBUG toggleJobCriterion: END.");
    }

    // --- Sub-Kriteria Global ---
    public function getAllSubCriteriaGlobal() {
        try {
            $sql = "SELECT skg.id, skg.kriteria_global_id, kg.nama_kriteria, skg.nama_sub_kriteria, skg.kode_sub_kriteria
                    FROM sub_kriteria_global skg
                    JOIN kriteria_global kg ON skg.kriteria_global_id = kg.id
                    ORDER BY kg.nama_kriteria ASC, skg.nama_sub_kriteria ASC";
            $result = $this->conn->query($sql);
            if (!$result) {
                throw new Exception("SQL Error in getAllSubCriteriaGlobal: " . $this->conn->error);
            }
            $subCriteria = [];
            while ($row = $result->fetch_assoc()) {
                $subCriteria[] = $row;
            }
            $this->sendResponse($subCriteria);
        } catch (Exception $e) {
            error_log("ERROR: KriteriaController::getAllSubCriteriaGlobal - " . $e->getMessage());
            $this->sendError("Server error in getAllSubCriteriaGlobal: " . $e->getMessage(), 500);
        }
    }

    public function getByIdSubCriterionGlobal($id) {
        try {
            $stmt = $this->conn->prepare("SELECT skg.id, skg.kriteria_global_id, kg.nama_kriteria, skg.nama_sub_kriteria, skg.kode_sub_kriteria
                                             FROM sub_kriteria_global skg
                                             JOIN kriteria_global kg ON skg.kriteria_global_id = kg.id
                                             WHERE skg.id = ?");
            if (!$stmt) { throw new Exception("Prepare failed in getByIdSubCriterionGlobal: " . $this->conn->error); }
            $stmt->bind_param("i", $id);
            if (!$stmt->execute()) { throw new Exception("Execute failed in getByIdSubCriterionGlobal: " . $stmt->error); }
            $result = $stmt->get_result();
            if ($result->num_rows > 0) {
                $this->sendResponse($result->fetch_assoc());
            } else {
                $this->sendError("Sub-kriteria global tidak ditemukan.", 404);
            }
            $stmt->close();
        } catch (Exception $e) {
            error_log("ERROR: KriteriaController::getByIdSubCriterionGlobal - " . $e->getMessage());
            $this->sendError("Server error in getByIdSubCriterionGlobal: " . $e->getMessage(), 500);
        }
    }

    public function createSubCriterionGlobal($data, $adminId) {
        if (!$adminId) {
            $this->sendError("Unauthorized.", 401);
            return;
        }
        try {
            if (!isset($data['kriteria_global_id']) || !isset($data['nama_sub_kriteria']) || !isset($data['kode_sub_kriteria'])) {
                $this->sendError("Data sub-kriteria global tidak lengkap.", 400);
                return;
            }
            $stmt = $this->conn->prepare("INSERT INTO sub_kriteria_global (kriteria_global_id, nama_sub_kriteria, kode_sub_kriteria, admin_id) VALUES (?, ?, ?, ?)");
            if (!$stmt) { throw new Exception("Prepare failed in createSubCriterionGlobal: " . $this->conn->error); }
            $stmt->bind_param("issi", $data['kriteria_global_id'], $data['nama_sub_kriteria'], $data['kode_sub_kriteria'], $adminId);
            if (!$stmt->execute()) {
                if ($this->conn->errno == 1062) {
                    $this->sendError("Sub-kriteria global dengan nama atau kode ini sudah ada.", 409);
                } else {
                    throw new Exception("Gagal menambahkan sub-kriteria global: " . $stmt->error);
                }
            } else {
                $this->sendResponse(["message" => "Sub-kriteria global berhasil ditambahkan.", "id" => $stmt->insert_id], 201);
            }
            $stmt->close();
        } catch (Exception $e) {
            error_log("ERROR: KriteriaController::createSubCriterionGlobal - " . $e->getMessage());
            $this->sendError("Server error in createSubCriterionGlobal: " . $e->getMessage(), 500);
        }
    }

    public function updateSubCriterionGlobal($id, $data, $adminId) {
        // FIX: Hapus pengecekan otorisasi, biarkan semua admin yang login bisa mengedit
        // if (!$this->checkSubGlobalAuthorization($id, $adminId)) { ... }
        try {
            if (!isset($data['nama_sub_kriteria']) || !isset($data['kode_sub_kriteria'])) {
                $this->sendError("Data sub-kriteria global tidak lengkap.", 400);
                return;
            }
            $stmt = $this->conn->prepare("UPDATE sub_kriteria_global SET nama_sub_kriteria = ?, kode_sub_kriteria = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?");
            if (!$stmt) { throw new Exception("Prepare failed in updateSubCriterionGlobal: " . $this->conn->error); }
            $stmt->bind_param("ssi", $data['nama_sub_kriteria'], $data['kode_sub_kriteria'], $id);
            if (!$stmt->execute()) {
                if ($this->conn->errno == 1062) {
                    $this->sendError("Sub-kriteria global dengan nama atau kode ini sudah ada.", 409);
                } else {
                    throw new Exception("Gagal memperbarui sub-kriteria global: " . $stmt->error);
                }
            } else {
                if ($stmt->affected_rows > 0) {
                    $this->sendResponse(["message" => "Sub-kriteria global berhasil diperbarui."]);
                } else {
                    $this->sendError("Sub-kriteria global tidak ditemukan atau tidak ada perubahan.", 404);
                }
            }
            $stmt->close();
        } catch (Exception $e) {
            error_log("ERROR: KriteriaController::updateSubCriterionGlobal - " . $e->getMessage());
            $this->sendError("Server error in updateSubCriterionGlobal: " . $e->getMessage(), 500);
        }
    }

    public function deleteSubCriterionGlobal($id, $adminId) {
        // FIX: Hapus pengecekan otorisasi, biarkan semua admin yang login bisa menghapus
        // if (!$this->checkSubGlobalAuthorization($id, $adminId)) { ... }
        try {
            $stmt = $this->conn->prepare("DELETE FROM sub_kriteria_global WHERE id = ?");
            if (!$stmt) { throw new Exception("Prepare failed in deleteSubCriterionGlobal: " . $this->conn->error); }
            $stmt->bind_param("i", $id);
            if (!$stmt->execute()) {
                throw new Exception("Gagal menghapus sub-kriteria global: " . $stmt->error);
            }
            if ($stmt->affected_rows > 0) {
                $this->sendResponse(["message" => "Sub-kriteria global berhasil dihapus."]);
            } else {
                $this->sendError("Sub-kriteria global tidak ditemukan.", 404);
            }
            $stmt->close();
        } catch (Exception $e) {
            error_log("ERROR: KriteriaController::deleteSubCriterionGlobal - " . $e->getMessage());
            $this->sendError("Server error in deleteSubCriterionGlobal: " . $e->getMessage(), 500);
        }
    }

    // --- Pekerjaan Sub-Kriteria Detail (aktivasi & nilai ideal per job) ---
    public function getJobSubCriteriaDetail($pekerjaanId, $onlyActive = false) {
        try {
            $sql = "SELECT psd.id, psd.pekerjaan_id, psd.sub_kriteria_global_id, skg.nama_sub_kriteria,
                            skg.kode_sub_kriteria, skg.kriteria_global_id, kg.nama_kriteria,
                            psd.aktif, psd.nilai_ideal
                    FROM pekerjaan_sub_kriteria_detail psd
                    JOIN sub_kriteria_global skg ON psd.sub_kriteria_global_id = skg.id
                    JOIN kriteria_global kg ON skg.kriteria_global_id = kg.id
                    WHERE psd.pekerjaan_id = ?";
            if ($onlyActive) {
                $sql .= " AND psd.aktif = TRUE";
            }
            $sql .= " ORDER BY kg.nama_kriteria ASC, skg.nama_sub_kriteria ASC";

            $stmt = $this->conn->prepare($sql);
            if (!$stmt) { throw new Exception("Prepare failed in getJobSubCriteriaDetail: " . $this->conn->error); }
            $stmt->bind_param("i", $pekerjaanId);
            if (!$stmt->execute()) { throw new Exception("Execute failed in getJobSubCriteriaDetail: " . $stmt->error); }
            $result = $stmt->get_result();
            $jobSubCriteriaDetail = [];
            while ($row = $result->fetch_assoc()) {
                $row['aktif'] = (int)$row['aktif'];
                $jobSubCriteriaDetail[] = $row;
            }
            $this->sendResponse($jobSubCriteriaDetail);
            $stmt->close();
        } catch (Exception $e) {
            error_log("ERROR: KriteriaController::getJobSubCriteriaDetail - " . $e->getMessage());
            $this->sendError("Server error in getJobSubCriteriaDetail: " . $e->getMessage(), 500);
        }
    }

    public function toggleJobSubCriterionDetail($data, $adminId) {
        $pekerjaan_id = $data['pekerjaan_id'] ?? null;
        $sub_kriteria_global_id = $data['sub_kriteria_global_id'] ?? null;
        $aktif = $data['aktif'] ?? null;

        if (!$this->checkJobAuthorization($pekerjaan_id, $adminId)) {
            $this->sendError("Akses ditolak. Anda tidak memiliki izin untuk mengedit sub-kriteria pekerjaan ini.", 403);
            return;
        }

        error_log("DEBUG toggleJobSubCriterionDetail: START. Input data: " . json_encode($data));
        try {
            if (!isset($data['pekerjaan_id']) || !isset($data['sub_kriteria_global_id']) || !isset($data['aktif'])) {
                error_log("DEBUG toggleJobSubCriterionDetail: Data tidak lengkap.");
                $this->sendError("Data tidak lengkap (pekerjaan_id, sub_kriteria_global_id, atau aktif tidak ada).", 400);
                return;
            }

            $pekerjaanId = (int)$data['pekerjaan_id'];
            $subKriteriaGlobalId = (int)$data['sub_kriteria_global_id'];
            $aktif = (int)$data['aktif'];
            error_log("DEBUG toggleJobSubCriterionDetail: Parsed data - PekerjaanID: $pekerjaanId, SubKriteriaGlobalID: $subKriteriaGlobalId, Aktif: $aktif");

            $this->conn->begin_transaction();
            error_log("DEBUG toggleJobSubCriterionDetail: Transaksi dimulai.");

            $stmt_check = $this->conn->prepare("SELECT id, aktif FROM pekerjaan_sub_kriteria_detail WHERE pekerjaan_id = ? AND sub_kriteria_global_id = ?");
            if (!$stmt_check) {
                error_log("DEBUG toggleJobSubCriterionDetail: Prepare SELECT gagal: " . $this->conn->error);
                throw new Exception("Prepare failed (check psd): " . $this->conn->error);
            }
            $stmt_check->bind_param("ii", $pekerjaanId, $subKriteriaGlobalId);
            if (!$stmt_check->execute()) {
                error_log("DEBUG toggleJobSubCriterionDetail: Execute SELECT gagal: " . $stmt_check->error);
                throw new Exception("Execute failed (check psd): " . $stmt_check->error);
            }
            $result_check = $stmt_check->get_result();

            if ($result_check->num_rows > 0) {
                $row = $result_check->fetch_assoc();
                $psdId = (int)$row['id'];
                $current_aktif_status = (int)$row['aktif'];
                error_log("DEBUG toggleJobSubCriterionDetail: Record ditemukan. psdId: $psdId, Current Aktif: $current_aktif_status. Requested Aktif: $aktif");

                if ($current_aktif_status === $aktif) {
                    $this->conn->commit();
                    error_log("DEBUG toggleJobSubCriterionDetail: Status sudah sama, commit tanpa update.");
                    $this->sendResponse(["message" => "Status sub-kriteria pekerjaan sudah sesuai."]);
                    return;
                }

                $stmt_update = $this->conn->prepare("UPDATE pekerjaan_sub_kriteria_detail SET aktif = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?");
                if (!$stmt_update) {
                    error_log("DEBUG toggleJobSubCriterionDetail: Prepare UPDATE gagal: " . $this->conn->error);
                    throw new Exception("Prepare failed (update psd): " . $this->conn->error);
                }
                $stmt_update->bind_param("ii", $aktif, $psdId);
                if (!$stmt_update->execute()) {
                    error_log("DEBUG toggleJobSubCriterionDetail: Execute UPDATE gagal: " . $stmt_update->error);
                    throw new Exception("Gagal memperbarui status sub-kriteria pekerjaan: " . $stmt_update->error);
                }
                $affected_rows = $stmt_update->affected_rows;
                $stmt_update->close();
                
                if ($affected_rows > 0) {
                    $this->conn->commit();
                    error_log("DEBUG toggleJobSubCriterionDetail: UPDATE berhasil. Affected rows: $affected_rows. Commit transaksi.");
                    $this->sendResponse(["message" => "Status sub-kriteria berhasil diperbarui."]);
                } else {
                    error_log("DEBUG toggleJobSubCriterionDetail: UPDATE gagal (affected_rows=0). psdId: $psdId, set_aktif: $aktif. Rollback transaksi.");
                    $this->conn->rollback();
                    $this->sendError("Pembaruan status sub-kriteria gagal: Data tidak terpengaruh. (psdId: $psdId, set_aktif: $aktif)", 500);
                }
            } else {
                error_log("DEBUG toggleJobSubCriterionDetail: Record tidak ditemukan, melakukan INSERT baru.");
                $default_nilai_ideal = 3;
                $stmt_insert = $this->conn->prepare("INSERT INTO pekerjaan_sub_kriteria_detail (pekerjaan_id, sub_kriteria_global_id, aktif, nilai_ideal) VALUES (?, ?, ?, ?)");
                if (!$stmt_insert) {
                    error_log("DEBUG toggleJobSubCriterionDetail: Prepare INSERT gagal: " . $this->conn->error);
                    throw new Exception("Prepare failed (insert psd): " . $this->conn->error);
                }
                $stmt_insert->bind_param("iiii", $pekerjaanId, $subKriteriaGlobalId, $aktif, $default_nilai_ideal);
                if (!$stmt_insert->execute()) {
                    error_log("DEBUG toggleJobSubCriterionDetail: Execute INSERT gagal: " . $stmt_insert->error);
                    throw new Exception("Gagal menambahkan sub-kriteria pekerjaan: " . $stmt_insert->error);
                }
                $stmt_insert->close();
                $this->conn->commit();
                error_log("DEBUG toggleJobSubCriterionDetail: INSERT berhasil. Commit transaksi. Sending response.");
                $this->sendResponse(["message" => "Status sub-kriteria berhasil diperbarui."]);
            }
            $stmt_check->close();
            
        } catch (Exception $e) {
            error_log("DEBUG toggleJobSubCriterionDetail: EXCEPTION caught: " . $e->getMessage());
            $this->conn->rollback();
            $this->sendError("Server error in toggleJobSubCriterionDetail: " . $e->getMessage(), 500);
        }
        error_log("DEBUG toggleJobSubCriterionDetail: END.");
    }

    public function updateNilaiIdealSubCriterionDetail($id, $data, $adminId) {
        $pekerjaanId = null;
        $stmt = $this->conn->prepare("SELECT pekerjaan_id FROM pekerjaan_sub_kriteria_detail WHERE id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $stmt->bind_result($pekerjaanId);
        $stmt->fetch();
        $stmt->close();
    
        if (!$this->checkJobAuthorization($pekerjaanId, $adminId)) {
            $this->sendError("Akses ditolak. Anda tidak memiliki izin untuk mengedit pekerjaan ini.", 403);
            return;
        }

        try {
            if (!isset($data['nilai_ideal'])) {
                $this->sendError("Nilai ideal tidak lengkap.", 400);
                return;
            }
            $nilaiIdeal = (int)$data['nilai_ideal'];
            
            $stmt = $this->conn->prepare("UPDATE pekerjaan_sub_kriteria_detail SET nilai_ideal = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?");
            if (!$stmt) { throw new Exception("Prepare failed in updateNilaiIdealSubCriterionDetail: " . $this->conn->error); }
            $stmt->bind_param("ii", $nilaiIdeal, $id);
            if (!$stmt->execute()) {
                throw new Exception("Gagal memperbarui nilai ideal sub-kriteria: " . $stmt->error);
            }
            if ($stmt->affected_rows > 0) {
                $this->sendResponse(["message" => "Nilai ideal sub-kriteria berhasil diperbarui."]);
            } else {
                $this->sendError("Sub-kriteria pekerjaan tidak ditemukan atau tidak ada perubahan nilai ideal.", 404);
            }
            $stmt->close();
        } catch (Exception $e) {
            error_log("ERROR: KriteriaController::updateNilaiIdealSubCriterionDetail - " . $e->getMessage());
            $this->sendError("Server error in updateNilaiIdealSubCriterionDetail: " . $e->getMessage(), 500);
        }
    }

    public function deleteJobSubCriterionDetail($id, $adminId) {
        $pekerjaanId = null;
        $stmt = $this->conn->prepare("SELECT pekerjaan_id FROM pekerjaan_sub_kriteria_detail WHERE id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $stmt->bind_result($pekerjaanId);
        $stmt->fetch();
        $stmt->close();

        if (!$this->checkJobAuthorization($pekerjaanId, $adminId)) {
            $this->sendError("Akses ditolak. Anda tidak memiliki izin untuk menghapus sub-kriteria pekerjaan ini.", 403);
            return;
        }

        try {
            $stmt = $this->conn->prepare("DELETE FROM pekerjaan_sub_kriteria_detail WHERE id = ?");
            if (!$stmt) { throw new Exception("Prepare failed in deleteJobSubCriterionDetail: " . $this->conn->error); }
            $stmt->bind_param("i", $id);
            if (!$stmt->execute()) {
                throw new Exception("Gagal menghapus sub-kriteria pekerjaan: " . $stmt->error);
            }
            if ($stmt->affected_rows > 0) {
                $this->sendResponse(["message" => "Sub-kriteria pekerjaan berhasil dihapus dari pengaturan pekerjaan ini."]);
            } else {
                $this->sendError("Sub-kriteria pekerjaan tidak ditemukan.", 404);
            }
            $stmt->close();
        } catch (Exception $e) {
            error_log("ERROR: KriteriaController::deleteJobSubCriterionDetail - " . $e->getMessage());
            $this->sendError("Server error in deleteJobSubCriterionDetail: " . $e->getMessage(), 500);
        }
    }
}
