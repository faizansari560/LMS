<?php
require_once 'config.php';

$action = $_POST['action'] ?? $_GET['action'] ?? '';

switch ($action) {
    case 'login':
        handleLogin();
        break;
    case 'signup':
        handleSignup();
        break;
    case 'logout':
        handleLogout();
        break;
    case 'switch_user':
        handleLogout(true);
        break;
    default:
        echo json_encode(['success' => false, 'message' => 'Invalid action']);
}

function handleLogin() {
    $conn = getConnection();
    $email    = sanitize($conn, $_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';

    if (empty($email) || empty($password)) {
        echo json_encode(['success' => false, 'message' => 'Email and password are required.']);
        return;
    }

    $stmt = $conn->prepare("SELECT id, full_name, email, password, role, status FROM users WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        echo json_encode(['success' => false, 'message' => 'No account found with this email.']);
        return;
    }

    $user = $result->fetch_assoc();

    if ($user['status'] === 'inactive') {
        echo json_encode(['success' => false, 'message' => 'Your account is inactive. Contact admin.']);
        return;
    }

    if (!password_verify($password, $user['password'])) {
        echo json_encode(['success' => false, 'message' => 'Incorrect password.']);
        return;
    }

    // Set session
    $_SESSION['user_id']   = $user['id'];
    $_SESSION['full_name'] = $user['full_name'];
    $_SESSION['email']     = $user['email'];
    $_SESSION['role']      = $user['role'];

    $redirect = ($user['role'] === 'admin') ? '../LMS/admin/dashboard.html' : '../LMS/user/index.html';
    echo json_encode(['success' => true, 'role' => $user['role'], 'redirect' => $redirect, 'name' => $user['full_name']]);

    $stmt->close();
    $conn->close();
}

function handleSignup() {
    $conn     = getConnection();
    $name     = sanitize($conn, $_POST['full_name'] ?? '');
    $email    = sanitize($conn, $_POST['email'] ?? '');
    $phone    = sanitize($conn, $_POST['phone'] ?? '');
    $password = $_POST['password'] ?? '';
    $confirm  = $_POST['confirm_password'] ?? '';

    if (empty($name) || empty($email) || empty($password)) {
        echo json_encode(['success' => false, 'message' => 'All fields are required.']);
        return;
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(['success' => false, 'message' => 'Invalid email format.']);
        return;
    }
    if (strlen($password) < 6) {
        echo json_encode(['success' => false, 'message' => 'Password must be at least 6 characters.']);
        return;
    }
    if ($password !== $confirm) {
        echo json_encode(['success' => false, 'message' => 'Passwords do not match.']);
        return;
    }

    // Check if email exists
    $check = $conn->prepare("SELECT id FROM users WHERE email = ?");
    $check->bind_param("s", $email);
    $check->execute();
    $check->store_result();
    if ($check->num_rows > 0) {
        echo json_encode(['success' => false, 'message' => 'Email already registered. Please login.']);
        $check->close();
        $conn->close();
        return;
    }
    $check->close();

    $hashed = password_hash($password, PASSWORD_DEFAULT);
    $stmt = $conn->prepare("INSERT INTO users (full_name, email, phone, password, role) VALUES (?, ?, ?, ?, 'user')");
    $stmt->bind_param("ssss", $name, $email, $phone, $hashed);

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Account created! You can now login.']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Registration failed. Try again.']);
    }

    $stmt->close();
    $conn->close();
}

function handleLogout($switchUser = false) {
    session_destroy();
    echo json_encode(['success' => true, 'switch' => $switchUser]);
}
?>
