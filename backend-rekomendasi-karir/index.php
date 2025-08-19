<?php
// index.php
ini_set('display_errors', 0);
ini_set('display_startup_errors', 1);
error_reporting(0);

ob_start();

require_once 'corsheader.php';
require_once 'db_connect.php';
require_once 'controllers/BaseController.php';
require_once 'controllers/PekerjaanController.php';
require_once 'controllers/KriteriaController.php';
require_once 'controllers/AHPController.php';
require_once 'controllers/ProfileMatchingController.php';
require_once 'controllers/RecommendationController.php';
require_once 'controllers/AdminController.php';

$method = $_SERVER['REQUEST_METHOD'];
$request_uri = $_SERVER['REQUEST_URI'];

// Pisahkan path dari query string
$url_parts = parse_url($request_uri);
$path_segments = explode('/', trim($url_parts['path'], '/'));

// Cari indeks 'backend-rekomendasi-karir'
$path_index = array_search('backend-rekomendasi-karir', $path_segments);
$path = ($path_index !== false) ? array_slice($path_segments, $path_index + 1) : $path_segments;

// Ambil controller, action, dan id dari path
$controller = $path[0] ?? '';
$action = $path[1] ?? null;
$id = $path[2] ?? null;

// Ambil parameter GET dari query string
if (isset($url_parts['query'])) {
    parse_str($url_parts['query'], $tempGet);
    $_GET = array_merge($_GET, $tempGet);
}

$input = json_decode(file_get_contents('php://input'), true);
$adminId = $_GET['adminId'] ?? null;
$userRole = $_GET['userRole'] ?? null;
$baseController = new BaseController($conn);

switch ($controller) {
    case 'admin':
        $adminController = new AdminController($conn);
        if ($action === 'login' && $method === 'POST') {
            $adminController->login($input);
        } elseif ($action === 'add' && $method === 'POST' && $userRole === 'superadmin') {
            $adminController->createAhli($input);
        } elseif ($action === 'list' && $method === 'GET' && $userRole === 'superadmin') {
            $adminController->getAllAdmins($userRole);
        } else {
            $baseController->sendError("Endpoint admin tidak ditemukan.", 404);
        }
        break;

    case 'pekerjaan':
        $pekerjaanController = new PekerjaanController($conn);
        if ($method == 'GET') {
            if ($action) {
                $pekerjaanController->getById($action);
            } else {
                $pekerjaanController->getAll();
            }
        } elseif ($method == 'POST') {
            if (!$adminId) {
                $pekerjaanController->sendError("Unauthorized. Admin ID is missing.", 401);
            } else {
                $pekerjaanController->create($input, $adminId);
            }
        } elseif ($method == 'PUT') {
            if (!$adminId || !$action) {
                $pekerjaanController->sendError("Unauthorized. Admin ID or Pekerjaan ID is missing.", 401);
            } else {
                $pekerjaanController->update($action, $input, $adminId);
            }
        } elseif ($method == 'DELETE') {
            if (!$adminId || !$action) {
                $pekerjaanController->sendError("Unauthorized. Admin ID or Pekerjaan ID is missing.", 401);
            } else {
                $pekerjaanController->delete($action, $adminId);
            }
        } else {
            $baseController->sendError("Metode request tidak diizinkan.", 405);
        }
        break;

    case 'kriteria':
        $kriteriaController = new KriteriaController($conn);
        if ($method == 'GET') {
            if ($action) {
                $kriteriaController->getById($action);
            } else {
                $kriteriaController->getAllGlobal();
            }
        } elseif ($method == 'POST') {
            if (!$adminId) $kriteriaController->sendError("Unauthorized.", 401);
            else $kriteriaController->createGlobal($input, $adminId);
        } elseif ($method == 'PUT') {
            if (!$adminId) $kriteriaController->sendError("Unauthorized.", 401);
            else $kriteriaController->updateGlobal($action, $input, $adminId);
        } elseif ($method == 'DELETE') {
            if (!$adminId) $kriteriaController->sendError("Unauthorized.", 401);
            else $kriteriaController->deleteGlobal($action, $adminId);
        } else {
            $baseController->sendError("Metode request tidak diizinkan.", 405);
        }
        break;

    case 'pekerjaan_kriteria':
        $kriteriaController = new KriteriaController($conn);
        if ($method == 'GET' && $action) {
            $kriteriaController->getJobCriteria($action);
        } elseif ($method == 'POST' && $action == 'toggle') {
            if (!$adminId) $kriteriaController->sendError("Unauthorized.", 401);
            else $kriteriaController->toggleJobCriterion($input, $adminId);
        } else {
            $baseController->sendError("Endpoint pekerjaan_kriteria tidak ditemukan.", 404);
        }
        break;

    case 'sub_kriteria_global':
        $kriteriaController = new KriteriaController($conn);
        if ($method == 'GET') {
            if ($action) {
                $kriteriaController->getByIdSubCriterionGlobal($action);
            } else {
                $kriteriaController->getAllSubCriteriaGlobal();
            }
        } elseif ($method == 'POST') {
            if (!$adminId) $kriteriaController->sendError("Unauthorized.", 401);
            else $kriteriaController->createSubCriterionGlobal($input, $adminId);
        } elseif ($method == 'PUT' && $action) {
            if (!$adminId) $kriteriaController->sendError("Unauthorized.", 401);
            else $kriteriaController->updateSubCriterionGlobal($action, $input, $adminId);
        } elseif ($method == 'DELETE' && $action) {
            if (!$adminId) $kriteriaController->sendError("Unauthorized.", 401);
            else $kriteriaController->deleteSubCriterionGlobal($action, $adminId);
        } else {
            $baseController->sendError("Metode request tidak diizinkan.", 405);
        }
        break;

    case 'pekerjaan_sub_kriteria_detail':
        $kriteriaController = new KriteriaController($conn);
        if ($method == 'GET' && $action == 'active' && isset($id)) {
            $pekerjaanId = $id;
            $kriteriaController->getJobSubCriteriaDetail($pekerjaanId, true);
        } elseif ($method == 'GET' && $action) {
             $kriteriaController->getJobSubCriteriaDetail($action, false);
        } elseif ($method == 'POST' && $action == 'toggle') {
            if (!$adminId) $kriteriaController->sendError("Unauthorized.", 401);
            else $kriteriaController->toggleJobSubCriterionDetail($input, $adminId);
        } elseif ($method == 'PUT' && isset($action) && $id == 'nilai_ideal') {
            $psdId = $action;
            if (!$adminId) $kriteriaController->sendError("Unauthorized.", 401);
            else $kriteriaController->updateNilaiIdealSubCriterionDetail($psdId, $input, $adminId);
        } elseif ($method == 'DELETE' && $action) {
            if (!$adminId) $kriteriaController->sendError("Unauthorized.", 401);
            else $kriteriaController->deleteJobSubCriterionDetail($action, $adminId);
        } else {
            $baseController->sendError("Endpoint pekerjaan_sub_kriteria_detail tidak ditemukan.", 404);
        }
        break;

    case 'ahp':
        $ahpController = new AHPController($conn);
        if ($method == 'GET' && $action == 'matriks_perbandingan' && isset($id)) {
            $pekerjaanId = $id;
            $ahpController->getMatriksPerbandingan($pekerjaanId);
        } elseif ($method == 'POST' && $action == 'matriks_perbandingan') {
            if (!$adminId) $ahpController->sendError("Unauthorized.", 401);
            else $ahpController->saveMatriksPerbandingan($input, $adminId);
        } elseif ($method == 'POST' && $action == 'hitung_dan_simpan' && isset($id)) {
            $pekerjaanId = $id;
            if (!$adminId) $ahpController->sendError("Unauthorized.", 401);
            else $ahpController->calculateAndSaveAHP($pekerjaanId, $adminId);
        } elseif ($method == 'GET' && $action == 'hasil_bobot' && isset($id)) {
            $pekerjaanId = $id;
            $ahpController->getAHPBobot($pekerjaanId);
        } else {
            $baseController->sendError("Endpoint ahp tidak ditemukan.", 404);
        }
        break;

    case 'pm':
        $pmController = new ProfileMatchingController($conn);
        if ($method == 'POST' && $action == 'nilai_ideal_sub') {
            if (!$adminId) $pmController->sendError("Unauthorized.", 401);
            else $pmController->saveNilaiIdealSub($input, $adminId);
        } elseif ($method == 'GET' && $action == 'nilai_ideal_sub' && isset($id)) {
            $pekerjaanId = $id;
            $pmController->getNilaiIdealSub($pekerjaanId);
        } elseif ($method == 'POST' && $action == 'hitung_dan_simpan' && isset($id)) {
            $pekerjaanId = $id;
            if (!$adminId) $pmController->sendError("Unauthorized.", 401);
            else $pmController->calculateAndSavePM($pekerjaanId, $adminId);
        } else {
            $baseController->sendError("Endpoint pm tidak ditemukan.", 404);
        }
        break;

    case 'rekomendasi':
        $recController = new RecommendationController($conn);
        if ($method == 'GET' && $action == 'pekerjaan') {
            $recController->getRecommendedJobs();
        } elseif ($method == 'POST' && $action == 'hitung') {
            $recController->calculateUserRecommendation($input);
        } else {
            $baseController->sendError("Endpoint rekomendasi tidak ditemukan.", 404);
        }
        break;

    default:
        $baseController->sendError("Endpoint tidak ditemukan.", 404);
        break;
}

$conn->close();
ob_end_flush();
?>