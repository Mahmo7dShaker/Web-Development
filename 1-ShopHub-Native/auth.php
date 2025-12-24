<?php
require_once 'config.php';


if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'register') {
    $username = sanitizeInput($_POST['username']);
    $email = sanitizeInput($_POST['email']);
    $password = $_POST['password'];
    $full_name = sanitizeInput($_POST['full_name']);
    $phone = sanitizeInput($_POST['phone']);
    $address = sanitizeInput($_POST['address']);
    
  
    if (empty($username) || empty($email) || empty($password)) {
        jsonResponse(['success' => false, 'message' => 'All required fields must be filled'], 400);
    }
    
  
    $checkQuery = "SELECT user_id FROM users WHERE username = ? OR email = ?";
    $stmt = $conn->prepare($checkQuery);
    $stmt->bind_param("ss", $username, $email);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        jsonResponse(['success' => false, 'message' => 'Username or email already exists'], 400);
    }
    
   
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
    $insertQuery = "INSERT INTO users (username, email, password, full_name, phone, address) VALUES (?, ?, ?, ?, ?, ?)";
    $stmt = $conn->prepare($insertQuery);
    $stmt->bind_param("ssssss", $username, $email, $hashedPassword, $full_name, $phone, $address);
    
    if ($stmt->execute()) {
        jsonResponse(['success' => true, 'message' => 'Registration successful']);
    } else {
        jsonResponse(['success' => false, 'message' => 'Registration failed'], 500);
    }
}


if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'login') {
    $username = sanitizeInput($_POST['username']);
    $password = $_POST['password'];
    
    if (empty($username) || empty($password)) {
        jsonResponse(['success' => false, 'message' => 'Username and password are required'], 400);
    }
    
    $query = "SELECT user_id, username, password, full_name, email FROM users WHERE username = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 1) {
        $user = $result->fetch_assoc();
        
        if (password_verify($password, $user['password'])) {
            $_SESSION['user_id'] = $user['user_id'];
            $_SESSION['username'] = $user['username'];
            $_SESSION['full_name'] = $user['full_name'];
            $_SESSION['email'] = $user['email'];

        
            $isAdmin = ($user['username'] === 'admin');
            $_SESSION['is_admin'] = $isAdmin;
            
            jsonResponse([
                'success' => true, 
                'message' => 'Login successful',
                'user' => [
                    'username' => $user['username'],
                    'full_name' => $user['full_name'],
                    'is_admin' => $isAdmin
                ]
            ]);
        } else {
            jsonResponse(['success' => false, 'message' => 'Invalid credentials'], 401);
        }
    } else {
        jsonResponse(['success' => false, 'message' => 'Invalid credentials'], 401);
    }
}


if (isset($_GET['action']) && $_GET['action'] === 'logout') {
    session_destroy();
    redirect('index.html'); 
}


if (isset($_GET['action']) && $_GET['action'] === 'check_login') {
    if (isLoggedIn()) {
        jsonResponse([
            'logged_in' => true,
            'user' => [
                'username' => $_SESSION['username'],
                'full_name' => $_SESSION['full_name'],
                'is_admin' => isset($_SESSION['is_admin']) ? $_SESSION['is_admin'] : false
            ]
        ]);
    } else {
        jsonResponse(['logged_in' => false]);
    }
}
?>
