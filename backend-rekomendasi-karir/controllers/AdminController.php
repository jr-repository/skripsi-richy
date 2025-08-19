<?php
// controllers/AdminController.php

class AdminController extends BaseController {
    public function __construct($conn) {
        parent::__construct($conn);
    }

    public function login($input) {
        $email = $input['email'] ?? '';
        $password = $input['password'] ?? '';

        if (!$email || !$password) {
            $this->sendError("Email dan password harus diisi.", 400);
            return;
        }

        $sql = "SELECT * FROM admin WHERE email = ?";
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("s", $email);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows > 0) {
            $admin = $result->fetch_assoc();
            // Peringatan: Validasi kata sandi tanpa hashing
            // Ini tidak aman dan hanya untuk tujuan demonstrasi!
            if ($password === $admin['password']) {
                $this->sendResponse([
                    "message" => "Login berhasil.",
                    "role" => $admin['role'],
                    "nama" => $admin['nama'],
                    "id" => $admin['id']
                ]);
            } else {
                $this->sendError("Email atau password salah.", 401);
            }
        } else {
            $this->sendError("Email atau password salah.", 401);
        }
        $stmt->close();
    }

    public function createAhli($input) {
        $requesterRole = $_GET['userRole'] ?? '';

        if ($requesterRole !== 'superadmin') {
            $this->sendError("Akses ditolak. Anda tidak memiliki izin untuk melakukan tindakan ini.", 403);
            return;
        }

        $nama = $input['nama'] ?? '';
        $email = $input['email'] ?? '';
        $password = $input['password'] ?? '';
        $pekerjaan = $input['pekerjaan'] ?? '';
        $role = 'ahli';

        if (!$nama || !$email || !$password) {
            $this->sendError("Nama, email, dan password harus diisi.", 400);
            return;
        }

        $checkSql = "SELECT id FROM admin WHERE email = ?";
        $checkStmt = $this->conn->prepare($checkSql);
        $checkStmt->bind_param("s", $email);
        $checkStmt->execute();
        $checkResult = $checkStmt->get_result();
        if ($checkResult->num_rows > 0) {
            $this->sendError("Email sudah terdaftar.", 409);
            $checkStmt->close();
            return;
        }
        $checkStmt->close();

        $stmt = $this->conn->prepare("INSERT INTO admin (nama, email, password, pekerjaan, role) VALUES (?, ?, ?, ?, ?)");
        $stmt->bind_param("sssss", $nama, $email, $password, $pekerjaan, $role);

        if ($stmt->execute()) {
            $this->sendResponse(["message" => "Akun ahli berhasil dibuat.", "id" => $stmt->insert_id], 201);
        } else {
            $this->sendError("Gagal membuat akun ahli.", 500);
        }
        $stmt->close();
    }

    public function getAllAdmins($userRole) {
        if ($userRole !== 'superadmin') {
            $this->sendError("Akses ditolak. Anda tidak memiliki izin untuk melihat daftar ini.", 403);
            return;
        }

        $sql = "SELECT id, nama, email, pekerjaan, role, created_at FROM admin";
        $result = $this->conn->query($sql);
        $admins = [];
        while ($row = $result->fetch_assoc()) {
            $admins[] = $row;
        }
        $this->sendResponse($admins);
    }
}
