<?php
// generate_hash.php

// Masukkan password yang ingin Anda hash di sini
$passwordToHash = 'superr';

// Hasilkan hash menggunakan algoritma default PHP
$hashedPassword = password_hash($passwordToHash, PASSWORD_DEFAULT);

// Tampilkan hasilnya
echo "Password Asli: " . htmlspecialchars($passwordToHash) . "<br>";
echo "Password Hash Baru: <strong>" . htmlspecialchars($hashedPassword) . "</strong>";

?>