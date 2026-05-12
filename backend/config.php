<?php
// =============================================
// Database Configuration
// =============================================
define('DB_HOST', getenv('MYSQLHOST')      ?: 'localhost');
define('DB_USER', getenv('MYSQLUSER')      ?: 'root');
define('DB_PASS', getenv('MYSQLPASSWORD')  ?: '');
define('DB_NAME', getenv('MYSQL_DATABASE') ?: 'lms_db');
define('DB_PORT', (int)(getenv('MYSQLPORT') ?: 3306));

define('SITE_URL',  getenv('RAILWAY_PUBLIC_DOMAIN')
    ? 'https://' . getenv('RAILWAY_PUBLIC_DOMAIN')
    : 'http://localhost/LMS');

define('SITE_NAME', 'Lawyer Management System');

// Create Connection
function getConnection() {
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME, DB_PORT);
    if ($conn->connect_error) {
        die(json_encode([
            'success' => false,
            'message' => 'Database connection failed: ' . $conn->connect_error
        ]));
    }
    $conn->set_charset('utf8mb4');
    return $conn;
}

// Start session if not started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Check if user is logged in
function isLoggedIn() {
    return isset($_SESSION['user_id']) && !empty($_SESSION['user_id']);
}

// Check if admin
function isAdmin() {
    return isset($_SESSION['role']) && $_SESSION['role'] === 'admin';
}

// Redirect helper
function redirect($url) {
    header("Location: $url");
    exit();
}

// Sanitize input
function sanitize($conn, $data) {
    return $conn->real_escape_string(htmlspecialchars(trim($data)));
}
?>
