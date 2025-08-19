<?php
// controllers/PekerjaanController.php
require_once 'corsheader.php';
require_once 'BaseController.php';

class PekerjaanController extends BaseController {
    
    private function checkAuthorization($pekerjaanId, $adminId) {
        $sql = "SELECT id FROM pekerjaan WHERE id = ? AND admin_id = ?";
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("ii", $pekerjaanId, $adminId);
        $stmt->execute();
        $result = $stmt->get_result();

        return $result->num_rows > 0;
    }

    public function getAll() {
        $sql = "SELECT p.*, a.nama AS nama_admin, a.email AS email_admin, pmhr.nilai_total_ahp_pm
                FROM pekerjaan p
                LEFT JOIN admin a ON p.admin_id = a.id
                LEFT JOIN pm_hasil_rekomendasi pmhr ON p.id = pmhr.pekerjaan_id
                ORDER BY p.nama ASC";
        $result = $this->conn->query($sql);
        $pekerjaan = [];
        if ($result->num_rows > 0) {
            while ($row = $result->fetch_assoc()) {
                $row['nilai_total_ahp_pm'] = $row['nilai_total_ahp_pm'] !== null ? (float)$row['nilai_total_ahp_pm'] : null;
                $pekerjaan[] = $row;
            }
        }
        $this->sendResponse($pekerjaan);
    }

    public function getById($id) {
        $sql = "SELECT p.*, a.nama AS nama_admin, a.email AS email_admin FROM pekerjaan p LEFT JOIN admin a ON p.admin_id = a.id WHERE p.id = ?";
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        $pekerjaan = $result->fetch_assoc();
        if ($pekerjaan) {
            $this->sendResponse($pekerjaan);
        } else {
            $this->sendError("Pekerjaan tidak ditemukan.", 404);
        }
        $stmt->close();
    }

    public function create($data, $adminId) {
        if (!isset($data['nama']) || !isset($data['rata_rata_gaji']) || !isset($data['deskripsi'])) {
            $this->sendError("Data tidak lengkap.", 400);
            return;
        }
        $stmt = $this->conn->prepare("INSERT INTO pekerjaan (nama, rata_rata_gaji, deskripsi, admin_id) VALUES (?, ?, ?, ?)");
        $stmt->bind_param("sdsi", $data['nama'], $data['rata_rata_gaji'], $data['deskripsi'], $adminId);
        if ($stmt->execute()) {
            $this->sendResponse(["message" => "Pekerjaan berhasil ditambahkan.", "id" => $stmt->insert_id], 201);
        } else {
            $this->sendError("Gagal menambahkan pekerjaan: " . $stmt->error, 500);
        }
        $stmt->close();
    }

    public function update($id, $data, $adminId) {
        if (!$this->checkAuthorization($id, $adminId)) {
            $this->sendError("Akses ditolak. Anda tidak memiliki izin untuk mengedit pekerjaan ini.", 403);
            return;
        }

        if (!isset($data['nama']) || !isset($data['rata_rata_gaji']) || !isset($data['deskripsi'])) {
            $this->sendError("Data tidak lengkap.", 400);
            return;
        }
        $stmt = $this->conn->prepare("UPDATE pekerjaan SET nama = ?, rata_rata_gaji = ?, deskripsi = ? WHERE id = ?");
        $stmt->bind_param("sdsi", $data['nama'], $data['rata_rata_gaji'], $data['deskripsi'], $id);
        if ($stmt->execute()) {
            if ($stmt->affected_rows > 0) {
                $this->sendResponse(["message" => "Pekerjaan berhasil diperbarui."]);
            } else {
                $this->sendResponse(["message" => "Pekerjaan tidak ditemukan atau tidak ada perubahan."]);
            }
        } else {
            $this->sendError("Gagal memperbarui pekerjaan: " . $stmt->error, 500);
        }
        $stmt->close();
    }

    public function delete($id, $adminId) {
        if (!$this->checkAuthorization($id, $adminId)) {
            $this->sendError("Akses ditolak. Anda tidak memiliki izin untuk menghapus pekerjaan ini.", 403);
            return;
        }
        
        $stmt = $this->conn->prepare("DELETE FROM pekerjaan WHERE id = ?");
        $stmt->bind_param("i", $id);
        if ($stmt->execute()) {
            if ($stmt->affected_rows > 0) {
                $this->sendResponse(["message" => "Pekerjaan berhasil dihapus."]);
            } else {
                $this->sendError("Pekerjaan tidak ditemukan.", 404);
            }
        } else {
            $this->sendError("Gagal menghapus pekerjaan: " . $stmt->error, 500);
        }
        $stmt->close();
    }
}
