<?php
require_once 'config.php';

if (!isLoggedIn() || !isAdmin()) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized access.']);
    exit();
}

$action = $_POST['action'] ?? $_GET['action'] ?? '';

switch ($action) {
    case 'get_all':    getAllUsers();    break;
    case 'get_one':    getUser();       break;
    case 'add':        addUser();       break;
    case 'edit':       editUser();      break;
    case 'delete':     deleteUser();    break;
    case 'toggle':     toggleStatus();  break;
    default:
        echo json_encode(['success' => false, 'message' => 'Invalid action']);
}

function getAllUsers() {
    $conn   = getConnection();
    $result = $conn->query("SELECT id, full_name, email, phone, role, status, created_at FROM users ORDER BY created_at DESC");
    $users  = [];
    while ($row = $result->fetch_assoc()) {
        $users[] = $row;
    }
    echo json_encode(['success' => true, 'data' => $users]);
    $conn->close();
}

function getUser() {
    $conn = getConnection();
    $id   = intval($_GET['id'] ?? 0);
    $stmt = $conn->prepare("SELECT id, full_name, email, phone, role, status FROM users WHERE id = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $result = $stmt->get_result();
    if ($row = $result->fetch_assoc()) {
        echo json_encode(['success' => true, 'data' => $row]);
    } else {
        echo json_encode(['success' => false, 'message' => 'User not found.']);
    }
    $stmt->close();
    $conn->close();
}

function addUser() {
    $conn     = getConnection();
    $name     = sanitize($conn, $_POST['full_name'] ?? '');
    $email    = sanitize($conn, $_POST['email'] ?? '');
    $phone    = sanitize($conn, $_POST['phone'] ?? '');
    $role     = sanitize($conn, $_POST['role'] ?? 'user');
    $password = $_POST['password'] ?? '';

    if (empty($name) || empty($email) || empty($password)) {
        echo json_encode(['success' => false, 'message' => 'Name, email, and password are required.']);
        return;
    }

    $check = $conn->prepare("SELECT id FROM users WHERE email = ?");
    $check->bind_param("s", $email);
    $check->execute();
    $check->store_result();
    if ($check->num_rows > 0) {
        echo json_encode(['success' => false, 'message' => 'Email already exists.']);
        $check->close(); $conn->close();
        return;
    }
    $check->close();

    $hashed = password_hash($password, PASSWORD_DEFAULT);
    $stmt   = $conn->prepare("INSERT INTO users (full_name, email, phone, password, role) VALUES (?, ?, ?, ?, ?)");
    $stmt->bind_param("sssss", $name, $email, $phone, $hashed, $role);

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'User added successfully.']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to add user.']);
    }
    $stmt->close(); $conn->close();
}

function editUser() {
    $conn  = getConnection();
    $id    = intval($_POST['id'] ?? 0);
    $name  = sanitize($conn, $_POST['full_name'] ?? '');
    $email = sanitize($conn, $_POST['email'] ?? '');
    $phone = sanitize($conn, $_POST['phone'] ?? '');
    $role  = sanitize($conn, $_POST['role'] ?? 'user');
    $pass  = $_POST['password'] ?? '';

    if ($pass !== '') {
        $hashed = password_hash($pass, PASSWORD_DEFAULT);
        $stmt   = $conn->prepare("UPDATE users SET full_name=?, email=?, phone=?, role=?, password=? WHERE id=?");
        $stmt->bind_param("sssssi", $name, $email, $phone, $role, $hashed, $id);
    } else {
        $stmt = $conn->prepare("UPDATE users SET full_name=?, email=?, phone=?, role=? WHERE id=?");
        $stmt->bind_param("ssssi", $name, $email, $phone, $role, $id);
    }

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'User updated successfully.']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to update user.']);
    }
    $stmt->close(); $conn->close();
}

function deleteUser() {
    $conn = getConnection();
    $id   = intval($_POST['id'] ?? 0);
    if ($id === intval($_SESSION['user_id'])) {
        echo json_encode(['success' => false, 'message' => 'Cannot delete your own account.']);
        return;
    }
    $stmt = $conn->prepare("DELETE FROM users WHERE id = ?");
    $stmt->bind_param("i", $id);
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'User deleted successfully.']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to delete user.']);
    }
    $stmt->close(); $conn->close();
}

function toggleStatus() {
    $conn   = getConnection();
    $id     = intval($_POST['id'] ?? 0);
    $status = sanitize($conn, $_POST['status'] ?? 'active');
    $new    = ($status === 'active') ? 'inactive' : 'active';
    $stmt   = $conn->prepare("UPDATE users SET status=? WHERE id=?");
    $stmt->bind_param("si", $new, $id);
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => "User set to $new.", 'new_status' => $new]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to update status.']);
    }
    $stmt->close(); $conn->close();
}
?>
