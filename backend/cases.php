<?php
require_once 'config.php';

if (!isLoggedIn()) {
    echo json_encode(['success' => false, 'message' => 'Please login first.']);
    exit();
}

$action = $_POST['action'] ?? $_GET['action'] ?? '';

switch ($action) {
    case 'get_all':  getAllCases();  break;
    case 'get_one':  getCase();     break;
    case 'add':      addCase();     break;
    case 'edit':     editCase();    break;
    case 'delete':   deleteCase();  break;
    case 'stats':    getStats();    break;
    default:
        echo json_encode(['success' => false, 'message' => 'Invalid action']);
}

function getAllCases() {
    $conn = getConnection();
    $result = $conn->query("SELECT * FROM cases ORDER BY created_at DESC");
    $cases = [];
    while ($row = $result->fetch_assoc()) {
        $cases[] = $row;
    }
    echo json_encode(['success' => true, 'data' => $cases]);
    $conn->close();
}

function getCase() {
    $conn = getConnection();
    $id   = intval($_GET['id'] ?? 0);
    $stmt = $conn->prepare("SELECT * FROM cases WHERE id = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $result = $stmt->get_result();
    if ($row = $result->fetch_assoc()) {
        echo json_encode(['success' => true, 'data' => $row]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Case not found.']);
    }
    $stmt->close(); $conn->close();
}

function addCase() {
    if (!isAdmin()) {
        echo json_encode(['success' => false, 'message' => 'Admin access required.']);
        return;
    }
    $conn         = getConnection();
    $title        = sanitize($conn, $_POST['case_title'] ?? '');
    $number       = sanitize($conn, $_POST['case_number'] ?? '');
    $type         = sanitize($conn, $_POST['case_type'] ?? '');
    $description  = sanitize($conn, $_POST['description'] ?? '');
    $client       = sanitize($conn, $_POST['client_name'] ?? '');
    $lawyer       = sanitize($conn, $_POST['lawyer_name'] ?? '');
    $status       = sanitize($conn, $_POST['status'] ?? 'open');
    $fee          = floatval($_POST['fee'] ?? 0);
    $hearing_date = sanitize($conn, $_POST['hearing_date'] ?? '');
    $filed_date   = sanitize($conn, $_POST['filed_date'] ?? '');
    $created_by   = intval($_SESSION['user_id']);

    // Handle image upload
    $image = 'default-case.png';
    if (isset($_FILES['image']) && $_FILES['image']['error'] === 0) {
        $ext     = pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION);
        $allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        if (in_array(strtolower($ext), $allowed)) {
            $filename = 'case_' . time() . '.' . $ext;
            $upload   = __DIR__ . '/../assets/uploads/' . $filename;
            if (!is_dir(__DIR__ . '/../assets/uploads/')) {
                mkdir(__DIR__ . '/../assets/uploads/', 0755, true);
            }
            if (move_uploaded_file($_FILES['image']['tmp_name'], $upload)) {
                $image = $filename;
            }
        }
    }

    if (empty($title)) {
        echo json_encode(['success' => false, 'message' => 'Case title is required.']);
        return;
    }

    $stmt = $conn->prepare("INSERT INTO cases (case_title, case_number, case_type, description, client_name, lawyer_name, status, fee, hearing_date, filed_date, image, created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)");
    $stmt->bind_param("sssssssdsssi", $title, $number, $type, $description, $client, $lawyer, $status, $fee, $hearing_date, $filed_date, $image, $created_by);

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Case added successfully.']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to add case. ' . $conn->error]);
    }
    $stmt->close(); $conn->close();
}

function editCase() {
    if (!isAdmin()) {
        echo json_encode(['success' => false, 'message' => 'Admin access required.']);
        return;
    }
    $conn        = getConnection();
    $id          = intval($_POST['id'] ?? 0);
    $title       = sanitize($conn, $_POST['case_title'] ?? '');
    $number      = sanitize($conn, $_POST['case_number'] ?? '');
    $type        = sanitize($conn, $_POST['case_type'] ?? '');
    $description = sanitize($conn, $_POST['description'] ?? '');
    $client      = sanitize($conn, $_POST['client_name'] ?? '');
    $lawyer      = sanitize($conn, $_POST['lawyer_name'] ?? '');
    $status      = sanitize($conn, $_POST['status'] ?? 'open');
    $fee         = floatval($_POST['fee'] ?? 0);
    $hearing     = sanitize($conn, $_POST['hearing_date'] ?? '');
    $filed       = sanitize($conn, $_POST['filed_date'] ?? '');

    // Get current image
    $imgResult = $conn->query("SELECT image FROM cases WHERE id = $id");
    $imgRow    = $imgResult->fetch_assoc();
    $image     = $imgRow['image'] ?? 'default-case.png';

    if (isset($_FILES['image']) && $_FILES['image']['error'] === 0) {
        $ext     = pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION);
        $allowed = ['jpg','jpeg','png','gif','webp'];
        if (in_array(strtolower($ext), $allowed)) {
            $filename = 'case_' . time() . '.' . $ext;
            $upload   = __DIR__ . '/../assets/uploads/' . $filename;
            if (!is_dir(__DIR__ . '/../assets/uploads/')) {
                mkdir(__DIR__ . '/../assets/uploads/', 0755, true);
            }
            if (move_uploaded_file($_FILES['image']['tmp_name'], $upload)) {
                $image = $filename;
            }
        }
    }

    $stmt = $conn->prepare("UPDATE cases SET case_title=?, case_number=?, case_type=?, description=?, client_name=?, lawyer_name=?, status=?, fee=?, hearing_date=?, filed_date=?, image=? WHERE id=?");
    $stmt->bind_param("sssssssdsssi", $title, $number, $type, $description, $client, $lawyer, $status, $fee, $hearing, $filed, $image, $id);

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Case updated successfully.']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to update case.']);
    }
    $stmt->close(); $conn->close();
}

function deleteCase() {
    if (!isAdmin()) {
        echo json_encode(['success' => false, 'message' => 'Admin access required.']);
        return;
    }
    $conn = getConnection();
    $id   = intval($_POST['id'] ?? 0);
    $stmt = $conn->prepare("DELETE FROM cases WHERE id = ?");
    $stmt->bind_param("i", $id);
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Case deleted successfully.']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to delete case.']);
    }
    $stmt->close(); $conn->close();
}

function getStats() {
    $conn  = getConnection();
    $stats = [];

    $stats['total_cases']  = $conn->query("SELECT COUNT(*) as c FROM cases")->fetch_assoc()['c'];
    $stats['open_cases']   = $conn->query("SELECT COUNT(*) as c FROM cases WHERE status='open'")->fetch_assoc()['c'];
    $stats['closed_cases'] = $conn->query("SELECT COUNT(*) as c FROM cases WHERE status='closed'")->fetch_assoc()['c'];
    $stats['won_cases']    = $conn->query("SELECT COUNT(*) as c FROM cases WHERE status='won'")->fetch_assoc()['c'];
    $stats['total_users']  = $conn->query("SELECT COUNT(*) as c FROM users WHERE role='user'")->fetch_assoc()['c'];
    $stats['total_revenue']= $conn->query("SELECT SUM(fee) as s FROM cases")->fetch_assoc()['s'] ?? 0;

    echo json_encode(['success' => true, 'data' => $stats]);
    $conn->close();
}
?>
