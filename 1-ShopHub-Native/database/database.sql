DROP DATABASE IF EXISTS ecommerce_store;

CREATE DATABASE ecommerce_store;
USE ecommerce_store;

CREATE TABLE users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    phone VARCHAR(20),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categories (
    category_id INT PRIMARY KEY AUTO_INCREMENT,
    category_name VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
    product_id INT PRIMARY KEY AUTO_INCREMENT,
    product_name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    stock_quantity INT DEFAULT 0,
    category_id INT,
    image_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(category_id)
);

CREATE TABLE orders (
    order_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    order_status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
    shipping_address TEXT,
    payment_method VARCHAR(50) DEFAULT 'Cash on Delivery', 
    payment_status VARCHAR(20) DEFAULT 'Pending',
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE order_items (
    order_item_id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(order_id),
    FOREIGN KEY (product_id) REFERENCES products(product_id)
);

INSERT INTO categories (category_name, description) VALUES
('Electronics', 'Electronic devices and gadgets'),
('Clothing', 'Fashion and apparel'),
('Books', 'Books and educational materials'),
('Home & Garden', 'Home improvement and garden supplies'),
('Sports', 'Sports equipment and accessories');

INSERT INTO products (product_name, description, price, stock_quantity, category_id, image_url) VALUES
('Wireless Headphones', 'High-quality Bluetooth headphones with noise cancellation', 79.99, 50, 1, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500'),
('Laptop Backpack', 'Durable laptop backpack with multiple compartments', 49.99, 100, 1, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500'),
('Smart Watch', 'Fitness tracking smartwatch with heart rate monitor', 199.99, 30, 1, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500'),
('Denim Jacket', 'Classic blue denim jacket for casual wear', 59.99, 75, 2, 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500'),
('Running Shoes', 'Comfortable running shoes with excellent support', 89.99, 60, 5, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500'),
('Yoga Mat', 'Non-slip yoga mat for home workouts', 29.99, 120, 5, 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=500'),
('Coffee Maker', 'Automatic coffee maker with programmable timer', 69.99, 40, 4, 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=500'),
('LED Desk Lamp', 'Adjustable LED desk lamp with USB charging port', 34.99, 80, 1, 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500'),
('Cookbook Collection', 'Complete cookbook for beginners', 24.99, 90, 3, 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=500'),
('Wireless Mouse', 'Ergonomic wireless mouse with silent clicks', 19.99, 150, 1, 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=500'),
('Sunglasses', 'UV protection sunglasses with polarized lenses', 44.99, 70, 2, 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=500'),
('Water Bottle', 'Insulated stainless steel water bottle', 22.99, 200, 5, 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500');

INSERT INTO users (username, email, password, full_name, phone, address) VALUES
('admin', 'admin@store.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin User', '1234567890', '123 Admin Street');

INSERT INTO users (username, email, password, full_name, phone, address) VALUES
('bodaadel', 'boda@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Abdullah Adel ', '01154449298', '456 User Avenue');