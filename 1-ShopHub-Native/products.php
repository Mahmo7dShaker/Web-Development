<?php
require_once 'config.php';


if ($_SERVER['REQUEST_METHOD'] === 'GET' && !isset($_GET['id']) && !isset($_GET['action'])) {
    $category = isset($_GET['category']) ? sanitizeInput($_GET['category']) : '';
    $search = isset($_GET['search']) ? sanitizeInput($_GET['search']) : '';
    $minPrice = isset($_GET['min_price']) ? floatval($_GET['min_price']) : 0;
    $maxPrice = isset($_GET['max_price']) ? floatval($_GET['max_price']) : 999999;
    $sortBy = isset($_GET['sort']) ? sanitizeInput($_GET['sort']) : 'product_name';
    
    $query = "SELECT p.*, c.category_name 
              FROM products p 
              LEFT JOIN categories c ON p.category_id = c.category_id 
              WHERE p.price BETWEEN ? AND ?";
    
    $params = [$minPrice, $maxPrice];
    $types = "dd";
    
    if (!empty($category)) {
        $query .= " AND c.category_name = ?";
        $params[] = $category;
        $types .= "s";
    }
    
    if (!empty($search)) {
        $query .= " AND (p.product_name LIKE ? OR p.description LIKE ?)";
        $searchTerm = "%$search%";
        $params[] = $searchTerm;
        $params[] = $searchTerm;
        $types .= "ss";
    }
    
    $validSorts = ['product_name', 'price', 'created_at'];
    if (in_array($sortBy, $validSorts)) {
        $query .= " ORDER BY p.$sortBy";
    }
    
    $stmt = $conn->prepare($query);
    $stmt->bind_param($types, ...$params);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $products = [];
    while ($row = $result->fetch_assoc()) {
        $products[] = $row;
    }
    
    jsonResponse(['success' => true, 'products' => $products]);
}


if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['id'])) {
    $productId = intval($_GET['id']);
    
    $query = "SELECT p.*, c.category_name 
              FROM products p 
              LEFT JOIN categories c ON p.category_id = c.category_id 
              WHERE p.product_id = ?";
    
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $productId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 1) {
        $product = $result->fetch_assoc();
        jsonResponse(['success' => true, 'product' => $product]);
    } else {
        jsonResponse(['success' => false, 'message' => 'Product not found'], 404);
    }
}


if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'create') {
    $productName = sanitizeInput($_POST['product_name']);
    $description = sanitizeInput($_POST['description']);
    $price = floatval($_POST['price']);
    $stockQuantity = intval($_POST['stock_quantity']);
    $categoryId = intval($_POST['category_id']);
    $imageUrl = sanitizeInput($_POST['image_url']);
    
    $query = "INSERT INTO products (product_name, description, price, stock_quantity, category_id, image_url) 
              VALUES (?, ?, ?, ?, ?, ?)";
    
    $stmt = $conn->prepare($query);
    $stmt->bind_param("ssdiss", $productName, $description, $price, $stockQuantity, $categoryId, $imageUrl);
    
    if ($stmt->execute()) {
        jsonResponse(['success' => true, 'message' => 'Product created successfully', 'product_id' => $conn->insert_id]);
    } else {
        jsonResponse(['success' => false, 'message' => 'Failed to create product'], 500);
    }
}


if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'update') {
    $productId = intval($_POST['product_id']);
    $productName = sanitizeInput($_POST['product_name']);
    $description = sanitizeInput($_POST['description']);
    $price = floatval($_POST['price']);
    $stockQuantity = intval($_POST['stock_quantity']);
    $categoryId = intval($_POST['category_id']);
    $imageUrl = sanitizeInput($_POST['image_url']);
    
    $query = "UPDATE products 
              SET product_name = ?, description = ?, price = ?, stock_quantity = ?, category_id = ?, image_url = ?
              WHERE product_id = ?";
    
    $stmt = $conn->prepare($query);
    $stmt->bind_param("ssdissi", $productName, $description, $price, $stockQuantity, $categoryId, $imageUrl, $productId);
    
    if ($stmt->execute()) {
        jsonResponse(['success' => true, 'message' => 'Product updated successfully']);
    } else {
        jsonResponse(['success' => false, 'message' => 'Failed to update product'], 500);
    }
}


if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'delete') {
    $productId = intval($_POST['product_id']);
    
    $query = "DELETE FROM products WHERE product_id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $productId);
    
    if ($stmt->execute()) {
        jsonResponse(['success' => true, 'message' => 'Product deleted successfully']);
    } else {
        jsonResponse(['success' => false, 'message' => 'Failed to delete product'], 500);
    }
}


if (isset($_GET['action']) && $_GET['action'] === 'categories') {
    $query = "SELECT * FROM categories ORDER BY category_name";
    $result = $conn->query($query);
    
    $categories = [];
    while ($row = $result->fetch_assoc()) {
        $categories[] = $row;
    }
    
    jsonResponse(['success' => true, 'categories' => $categories]);
}
?>