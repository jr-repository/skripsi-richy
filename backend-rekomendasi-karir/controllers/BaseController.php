<?php
// controllers/BaseController.php
require_once 'corsheader.php';
class BaseController {
    protected $conn;

    public function __construct($conn) {
        $this->conn = $conn;
    }

    public function sendResponse($data, $statusCode = 200) {
        http_response_code($statusCode);
        header('Content-Type: application/json');
        echo json_encode($data);
        exit;
    }

    public function sendError($message, $statusCode = 500) {
        http_response_code($statusCode);
        header('Content-Type: application/json');
        echo json_encode(["message" => $message]);
        exit;
    }
}
?>
