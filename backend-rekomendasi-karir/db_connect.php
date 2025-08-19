<?php
// db_connect.php
$servername = "localhost";
$username = "sipemale_career_recommendation"; // Ganti dengan username MySQL Anda
$password = "career_recommendation";     // Ganti dengan password MySQL Anda
$dbname = "sipemale_career_recommendation";

// Membuat koneksi
$conn = new mysqli($servername, $username, $password, $dbname);

// Memeriksa koneksi
if ($conn->connect_error) {
    die(json_encode(["message" => "Koneksi database gagal: " . $conn->connect_error]));
}

// Set karakter set untuk komunikasi database
$conn->set_charset("utf8mb4");