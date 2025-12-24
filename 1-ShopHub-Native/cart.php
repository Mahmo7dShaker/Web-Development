<?php
require_once 'config.php';

if (!isset($_SESSION['cart'])) {
    $_SESSION['cart'] = [];
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'add') {
    $productId = intval($_POST['product_id']);
    $quantity = intval($_POST['quantity']);
    
    $query = "SELECT product_id, product_name, price, stock_quantity, image_url FROM products WHERE product_id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $productId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        jsonResponse(['success' => false, 'message' => 'Product not found'], 404);
    }
    
    $product = $result->fetch_assoc();
    
    if ($product['stock_quantity'] < $quantity) {
        jsonResponse(['success' => false, 'message' => 'Insufficient stock'], 400);
    }
    
    if (isset($_SESSION['cart'][$productId])) {
        $newQuantity = $_SESSION['cart'][$productId]['quantity'] + $quantity;
        if ($newQuantity > $product['stock_quantity']) {
            jsonResponse(['success' => false, 'message' => 'Insufficient stock'], 400);
        }
        $_SESSION['cart'][$productId]['quantity'] = $newQuantity;
    } else {
        $_SESSION['cart'][$productId] = [
            'product_id' => $product['product_id'],
            'product_name' => $product['product_name'],
            'price' => $product['price'],
            'quantity' => $quantity,
            'image_url' => $product['image_url']
        ];
    }
    
    jsonResponse(['success' => true, 'message' => 'Product added to cart', 'cart_count' => count($_SESSION['cart'])]);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'update') {
    $productId = intval($_POST['product_id']);
    $quantity = intval($_POST['quantity']);
    
    if (!isset($_SESSION['cart'][$productId])) {
        jsonResponse(['success' => false, 'message' => 'Product not in cart'], 404);
    }
    
    $query = "SELECT stock_quantity FROM products WHERE product_id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $productId);
    $stmt->execute();
    $result = $stmt->get_result();
    $product = $result->fetch_assoc();
    
    if ($quantity > $product['stock_quantity']) {
        jsonResponse(['success' => false, 'message' => 'Insufficient stock'], 400);
    }
    
    if ($quantity <= 0) {
        unset($_SESSION['cart'][$productId]);
    } else {
        $_SESSION['cart'][$productId]['quantity'] = $quantity;
    }
    
    jsonResponse(['success' => true, 'message' => 'Cart updated', 'cart' => array_values($_SESSION['cart'])]);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'remove') {
    $productId = intval($_POST['product_id']);
    
    if (isset($_SESSION['cart'][$productId])) {
        unset($_SESSION['cart'][$productId]);
        jsonResponse(['success' => true, 'message' => 'Product removed from cart', 'cart' => array_values($_SESSION['cart'])]);
    } else {
        jsonResponse(['success' => false, 'message' => 'Product not in cart'], 404);
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $cart = array_values($_SESSION['cart']);
    $total = 0;
    
    foreach ($cart as $item) {
        $total += $item['price'] * $item['quantity'];
    }
    
    jsonResponse([
        'success' => true,
        'cart' => $cart,
        'total' => number_format($total, 2),
        'count' => count($cart)
    ]);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'clear') {
    $_SESSION['cart'] = [];
    jsonResponse(['success' => true, 'message' => 'Cart cleared']);
}
?>