<?php
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'checkout') {
    
    if (!isLoggedIn()) {
        jsonResponse(['success' => false, 'message' => 'Please login to checkout'], 401);
    }
    
    if (empty($_SESSION['cart'])) {
        jsonResponse(['success' => false, 'message' => 'Cart is empty'], 400);
    }
    
    $userId = getUserId();
    $shippingAddress = sanitizeInput($_POST['shipping_address']);
    $paymentMethod = isset($_POST['payment_method']) ? sanitizeInput($_POST['payment_method']) : 'Cash on Delivery';
    
    if (empty($shippingAddress)) {
        jsonResponse(['success' => false, 'message' => 'Shipping address is required'], 400);
    }
    
    $total = 0;
    foreach ($_SESSION['cart'] as $item) {
        $total += $item['price'] * $item['quantity'];
    }
    
    $conn->begin_transaction();
    
    try {
        $paymentStatus = ($paymentMethod === 'Credit Card') ? 'Paid' : 'Pending';

        $orderQuery = "INSERT INTO orders (user_id, total_amount, shipping_address, order_status, payment_method, payment_status) VALUES (?, ?, ?, 'pending', ?, ?)";
        $stmt = $conn->prepare($orderQuery);
        $stmt->bind_param("idsss", $userId, $total, $shippingAddress, $paymentMethod, $paymentStatus);
        $stmt->execute();
        $orderId = $conn->insert_id;
        
        $itemQuery = "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)";
        $updateStockQuery = "UPDATE products SET stock_quantity = stock_quantity - ? WHERE product_id = ? AND stock_quantity >= ?";
        
        foreach ($_SESSION['cart'] as $item) {
            $stmt = $conn->prepare($itemQuery);
            $stmt->bind_param("iiid", $orderId, $item['product_id'], $item['quantity'], $item['price']);
            $stmt->execute();
            
            $stmt = $conn->prepare($updateStockQuery);
            $stmt->bind_param("iii", $item['quantity'], $item['product_id'], $item['quantity']);
            $stmt->execute();
            
            if ($stmt->affected_rows === 0) {
                throw new Exception("Insufficient stock for product: " . $item['product_name']);
            }
        }
        
        $conn->commit();
        
        $_SESSION['cart'] = [];
        
        jsonResponse([
            'success' => true,
            'message' => 'Order placed successfully',
            'order_id' => $orderId,
            'total' => number_format($total, 2)
        ]);
        
    } catch (Exception $e) {
        $conn->rollback();
        jsonResponse(['success' => false, 'message' => $e->getMessage()], 500);
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'my_orders') {
    
    if (!isLoggedIn()) {
        jsonResponse(['success' => false, 'message' => 'Please login to view orders'], 401);
    }
    
    $userId = getUserId();
    
    $query = "SELECT o.*, 
              (SELECT COUNT(*) FROM order_items WHERE order_id = o.order_id) as item_count
              FROM orders o 
              WHERE o.user_id = ? 
              ORDER BY o.order_date DESC";
    
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $orders = [];
    while ($row = $result->fetch_assoc()) {
        $orders[] = $row;
    }
    
    jsonResponse(['success' => true, 'orders' => $orders]);
}

if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['order_id'])) {
    if (!isLoggedIn()) { jsonResponse(['success' => false, 'message' => 'Please login to view order details'], 401); }
    $orderId = intval($_GET['order_id']);
    $userId = getUserId();
    $orderQuery = "SELECT * FROM orders WHERE order_id = ? AND user_id = ?";
    $stmt = $conn->prepare($orderQuery);
    $stmt->bind_param("ii", $orderId, $userId);
    $stmt->execute();
    $orderResult = $stmt->get_result();
    if ($orderResult->num_rows === 0) { jsonResponse(['success' => false, 'message' => 'Order not found'], 404); }
    $order = $orderResult->fetch_assoc();
    $itemsQuery = "SELECT oi.*, p.product_name, p.image_url FROM order_items oi JOIN products p ON oi.product_id = p.product_id WHERE oi.order_id = ?";
    $stmt = $conn->prepare($itemsQuery);
    $stmt->bind_param("i", $orderId);
    $stmt->execute();
    $itemsResult = $stmt->get_result();
    $items = [];
    while ($row = $itemsResult->fetch_assoc()) { $items[] = $row; }
    $order['items'] = $items;
    jsonResponse(['success' => true, 'order' => $order]);
}
?>