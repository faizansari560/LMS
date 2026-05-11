<?php
require_once 'config.php';
$action = $_GET['action'] ?? '';

if ($action === 'check') {
    if (isLoggedIn()) {
        echo json_encode([
            'logged_in' => true,
            'user_id'   => $_SESSION['user_id'],
            'name'      => $_SESSION['full_name'],
            'email'     => $_SESSION['email'],
            'role'      => $_SESSION['role']
        ]);
    } else {
        echo json_encode(['logged_in' => false]);
    }
}
?>
