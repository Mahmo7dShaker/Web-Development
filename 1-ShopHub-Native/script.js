let products = [];
let cart = [];
let currentUser = null;
let categories = [];

const elements = {
    productsGrid: document.getElementById('productsGrid'),
    productCount: document.getElementById('productCount'),
    cartBtn: document.getElementById('cartBtn'),
    cartCount: document.getElementById('cartCount'),
    searchInput: document.getElementById('searchInput'),
    searchBtn: document.getElementById('searchBtn'),
    categoryFilter: document.getElementById('categoryFilter'),
    minPrice: document.getElementById('minPrice'),
    maxPrice: document.getElementById('maxPrice'),
    sortFilter: document.getElementById('sortFilter'),
    applyFilters: document.getElementById('applyFilters'),
    resetFilters: document.getElementById('resetFilters'),

    cartModal: document.getElementById('cartModal'),
    checkoutModal: document.getElementById('checkoutModal'),
    loginModal: document.getElementById('loginModal'),
    registerModal: document.getElementById('registerModal'),
    ordersModal: document.getElementById('ordersModal'),
    productModal: document.getElementById('productModal'),

    adminProductModal: document.getElementById('adminProductModal'),
    adminProductForm: document.getElementById('adminProductForm'),
    adminAddProductBtn: document.getElementById('adminAddProductBtn'),

    loginBtn: document.getElementById('loginBtn'),
    registerBtn: document.getElementById('registerBtn'),
    userDropdown: document.getElementById('userDropdown'),
    userName: document.getElementById('userName'),
    myOrdersBtn: document.getElementById('myOrdersBtn'),
    logoutBtn: document.getElementById('logoutBtn'),

    notification: document.getElementById('notification')
};

document.addEventListener('DOMContentLoaded', () => {
    checkLoginStatus();
    loadCategories();
    loadProducts();
    loadCart();
    initEventListeners();
});

async function checkLoginStatus() {
    try {
        const response = await fetch('auth.php?action=check_login', { credentials: 'same-origin' });
        const data = await response.json();

        if (data.logged_in) {
            currentUser = data.user;
            updateUserMenu(true);

            if (currentUser.is_admin) {
                elements.adminAddProductBtn.style.display = 'inline-block';
                loadProducts();
            }
        } else {
            updateUserMenu(false);
            elements.adminAddProductBtn.style.display = 'none';
        }
    } catch (error) {
        console.error('Error checking login status:', error);
        updateUserMenu(false);
    }
}

function updateUserMenu(isLoggedIn) {
    if (isLoggedIn) {
        elements.loginBtn.style.display = 'none';
        elements.registerBtn.style.display = 'none';
        elements.userDropdown.style.display = 'flex';
        elements.userName.textContent = `Hello, ${currentUser.full_name || currentUser.username}`;
    } else {
        elements.loginBtn.style.display = 'inline-block';
        elements.registerBtn.style.display = 'inline-block';
        elements.userDropdown.style.display = 'none';
    }
}

async function loadCategories() {
    try {
        const response = await fetch('products.php?action=categories');
        const data = await response.json();

        if (data.success) {
            categories = data.categories;

            elements.categoryFilter.innerHTML = '<option value="">All Categories</option>';

            const adminSelect = document.getElementById('adminProdCat');
            if (adminSelect) adminSelect.innerHTML = '';

            const addedCategories = new Set();

            data.categories.forEach(category => {
                if (addedCategories.has(category.category_name)) {
                    return;
                }
                addedCategories.add(category.category_name);

                const option = document.createElement('option');
                option.value = category.category_name;
                option.textContent = category.category_name;
                elements.categoryFilter.appendChild(option);

                if (adminSelect) {
                    const admOption = document.createElement('option');
                    admOption.value = category.category_id;
                    admOption.textContent = category.category_name;
                    adminSelect.appendChild(admOption);
                }
            });
        }
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

async function loadProducts(filters = {}) {
    try {
        elements.productsGrid.innerHTML = '<div class="loading">Loading products...</div>';

        const params = new URLSearchParams(filters);
        const response = await fetch(`products.php?${params}`);
        const data = await response.json();

        if (data.success) {
            products = data.products;
            displayProducts(products);
            elements.productCount.textContent = `${products.length} Products`;
        }
    } catch (error) {
        console.error('Error loading products:', error);
        elements.productsGrid.innerHTML = '<div class="loading">Error loading products</div>';
    }
}

function displayProducts(productsToShow) {
    if (productsToShow.length === 0) {
        elements.productsGrid.innerHTML = '<div class="loading">No products found</div>';
        return;
    }

    const isAdmin = currentUser && currentUser.is_admin;

    elements.productsGrid.innerHTML = productsToShow.map(product => `
        <div class="product-card" onclick="showProductDetails(${product.product_id})">
            <img src="${product.image_url}" alt="${product.product_name}" class="product-image" onerror="this.src='https://via.placeholder.com/250x200?text=No+Image'">
            <div class="product-info">
                <div class="product-name">${product.product_name}</div>
                <div class="product-category">${product.category_name || 'Uncategorized'}</div>
                <div class="product-description">${product.description}</div>
                <div class="product-footer">
                    <div class="product-price">$${parseFloat(product.price).toFixed(2)}</div>
                    <div class="product-stock">${product.stock_quantity > 0 ? `${product.stock_quantity} left` : 'Out of stock'}</div>
                </div>
                ${isAdmin ? `
                    <div class="admin-controls" onclick="event.stopPropagation()">
                        <button class="btn-edit" onclick="openAdminModal('update', ${product.product_id})">Edit</button>
                        <button class="btn-delete" onclick="deleteProduct(${product.product_id})">Delete</button>
                    </div>
                ` : `
                    <button class="btn-add-cart" onclick="event.stopPropagation(); addToCart(${product.product_id})" ${product.stock_quantity === 0 ? 'disabled' : ''}>
                        ${product.stock_quantity > 0 ? 'Add to Cart' : 'Out of Stock'}
                    </button>
                `}
            </div>
        </div>
    `).join('');
}

function openAdminModal(action, productId = null) {
    const modal = document.getElementById('adminProductModal');
    const form = document.getElementById('adminProductForm');
    const title = document.getElementById('adminModalTitle');
    
    document.getElementById('adminFormAction').value = action;
    
    if (action === 'update' && productId) {
        title.textContent = 'Edit Product';
        const product = products.find(p => p.product_id == productId);
        if (product) {
            document.getElementById('editProductId').value = product.product_id;
            document.getElementById('adminProdName').value = product.product_name;
            document.getElementById('adminProdDesc').value = product.description;
            document.getElementById('adminProdPrice').value = product.price;
            document.getElementById('adminProdStock').value = product.stock_quantity;
            document.getElementById('adminProdCat').value = product.category_id;
            document.getElementById('adminProdImage').value = product.image_url;
        }
    } else {
        title.textContent = 'Add New Product';
        form.reset();
        document.getElementById('editProductId').value = '';
    }
    
    modal.classList.add('active');
}

async function handleAdminSubmit(e) {
    e.preventDefault();
    
    const action = document.getElementById('adminFormAction').value;
    const formData = new FormData();
    
    formData.append('action', action);
    formData.append('product_name', document.getElementById('adminProdName').value);
    formData.append('description', document.getElementById('adminProdDesc').value);
    formData.append('price', document.getElementById('adminProdPrice').value);
    formData.append('stock_quantity', document.getElementById('adminProdStock').value);
    formData.append('category_id', document.getElementById('adminProdCat').value);
    formData.append('image_url', document.getElementById('adminProdImage').value);
    
    if (action === 'update') {
        formData.append('product_id', document.getElementById('editProductId').value);
    }

    try {
        const response = await fetch('products.php', { method: 'POST', body: formData });
        const data = await response.json();
        
        if (data.success) {
            showNotification(`Product ${action}d successfully`);
            document.getElementById('adminProductModal').classList.remove('active');
            loadProducts();
        } else {
            showNotification(data.message, 'error');
        }
    } catch (error) {
        console.error(error);
        showNotification('Error saving product', 'error');
    }
}

async function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    const formData = new FormData();
    formData.append('action', 'delete');
    formData.append('product_id', productId);
    
    try {
        const response = await fetch('products.php', { method: 'POST', body: formData });
        const data = await response.json();
        if (data.success) {
            showNotification('Product deleted');
            loadProducts();
        } else {
            showNotification(data.message, 'error');
        }
    } catch (error) { 
        showNotification('Error deleting', 'error'); 
    }
}

async function showProductDetails(productId) {
    try {
        const response = await fetch(`products.php?id=${productId}`);
        const data = await response.json();
        
        if (data.success) {
            const product = data.product;
            document.getElementById('productModalTitle').textContent = product.product_name;
            document.getElementById('productDetails').innerHTML = `
                <div>
                    <img src="${product.image_url}" alt="${product.product_name}" class="product-detail-image" onerror="this.src='https://via.placeholder.com/400x400?text=No+Image'">
                </div>
                <div class="product-detail-info">
                    <h3>${product.product_name}</h3>
                    <p><strong>Category:</strong> ${product.category_name || 'Uncategorized'}</p>
                    <p><strong>Price:</strong> $${parseFloat(product.price).toFixed(2)}</p>
                    <p><strong>Stock:</strong> ${product.stock_quantity > 0 ? `${product.stock_quantity} available` : 'Out of stock'}</p>
                    <p><strong>Description:</strong></p>
                    <p>${product.description}</p>
                    <button class="btn-add-cart" onclick="addToCart(${product.product_id}); closeModal('productModal')" ${product.stock_quantity === 0 ? 'disabled' : ''}>
                        ${product.stock_quantity > 0 ? 'Add to Cart' : 'Out of Stock'}
                    </button>
                </div>
            `;
            openModal('productModal');
        }
    } catch (error) {
        console.error('Error loading product details:', error);
        showNotification('Error loading product details', 'error');
    }
}

async function addToCart(productId, quantity = 1) {
    try {
        const formData = new FormData();
        formData.append('action', 'add');
        formData.append('product_id', productId);
        formData.append('quantity', quantity);
        
        const response = await fetch('cart.php', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification(data.message);
            loadCart();
        } else {
            showNotification(data.message, 'error');
        }
    } catch (error) {
        console.error('Error adding to cart:', error);
        showNotification('Error adding to cart', 'error');
    }
}

async function loadCart() {
    try {
        const response = await fetch('cart.php');
        const data = await response.json();
        
        if (data.success) {
            cart = data.cart;
            elements.cartCount.textContent = data.count;
            displayCart();
        }
    } catch (error) {
        console.error('Error loading cart:', error);
    }
}

function displayCart() {
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<p style="text-align: center; padding: 50px; color: #7f8c8d;">Your cart is empty</p>';
        cartTotal.textContent = '0.00';
        return;
    }
    
    let total = 0;
    cartItems.innerHTML = cart.map(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        
        return `
            <div class="cart-item">
                <img src="${item.image_url}" alt="${item.product_name}" class="cart-item-image" onerror="this.src='https://via.placeholder.com/80?text=No+Image'">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.product_name}</div>
                    <div class="cart-item-price">$${parseFloat(item.price).toFixed(2)} each</div>
                    <div class="cart-item-controls">
                        <button class="quantity-btn" onclick="updateCartQuantity(${item.product_id}, ${item.quantity - 1})">-</button>
                        <span class="cart-item-quantity">${item.quantity}</span>
                        <button class="quantity-btn" onclick="updateCartQuantity(${item.product_id}, ${item.quantity + 1})">+</button>
                        <button class="btn-remove-item" onclick="removeFromCart(${item.product_id})">Remove</button>
                    </div>
                    <div style="margin-top: 10px; font-weight: bold;">Subtotal: $${itemTotal.toFixed(2)}</div>
                </div>
            </div>
        `;
    }).join('');
    
    cartTotal.textContent = total.toFixed(2);
}

async function updateCartQuantity(productId, newQuantity) {
    try {
        const formData = new FormData();
        formData.append('action', 'update');
        formData.append('product_id', productId);
        formData.append('quantity', newQuantity);
        
        const response = await fetch('cart.php', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            cart = data.cart;
            displayCart();
            elements.cartCount.textContent = cart.length;
        } else {
            showNotification(data.message, 'error');
        }
    } catch (error) {
        console.error('Error updating cart:', error);
        showNotification('Error updating cart', 'error');
    }
}

async function removeFromCart(productId) {
    try {
        const formData = new FormData();
        formData.append('action', 'remove');
        formData.append('product_id', productId);
        
        const response = await fetch('cart.php', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            cart = data.cart;
            displayCart();
            elements.cartCount.textContent = cart.length;
            showNotification(data.message);
        }
    } catch (error) {
        console.error('Error removing from cart:', error);
        showNotification('Error removing from cart', 'error');
    }
}

async function clearCart() {
    if (!confirm('Are you sure you want to clear your cart?')) return;
    
    try {
        const formData = new FormData();
        formData.append('action', 'clear');
        
        const response = await fetch('cart.php', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            cart = [];
            displayCart();
            elements.cartCount.textContent = '0';
            showNotification(data.message);
        }
    } catch (error) {
        console.error('Error clearing cart:', error);
        showNotification('Error clearing cart', 'error');
    }
}

function proceedToCheckout() {
    if (!currentUser) {
        closeModal('cartModal');
        openModal('loginModal');
        showNotification('Please login to checkout', 'error');
        return;
    }
    
    if (cart.length === 0) {
        showNotification('Your cart is empty', 'error');
        return;
    }
    
    closeModal('cartModal');
    openModal('checkoutModal');
    displayCheckoutSummary();
}


function displayCheckoutSummary() {
    const checkoutItems = document.getElementById('checkoutItems');
    const checkoutTotal = document.getElementById('checkoutTotal');
    
    let total = 0;
    
 
    let html = '<div class="checkout-items-container">';

    html += cart.map(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        
        return `
            <div class="checkout-item">
                <img src="${item.image_url}" alt="${item.product_name}" onerror="this.src='https://via.placeholder.com/60?text=No+Img'">
                <div class="checkout-item-details">
                    <div class="checkout-item-name">${item.product_name}</div>
                    <div class="checkout-item-qty">Quantity: ${item.quantity}</div>
                </div>
                <div class="checkout-item-price">$${itemTotal.toFixed(2)}</div>
            </div>
        `;
    }).join('');
    
    html += '</div>';
    
    checkoutItems.innerHTML = html;
    checkoutTotal.textContent = total.toFixed(2);
}

async function placeOrder() {
    const shippingAddress = document.getElementById('shippingAddress').value.trim();
    const paymentMethodInput = document.querySelector('input[name="paymentMethod"]:checked');
    const paymentMethod = paymentMethodInput ? paymentMethodInput.value : 'cod';
    
    if (!shippingAddress) {
        showNotification('Please enter shipping address', 'error');
        return;
    }

    if (paymentMethod === 'card') {
        const cardNum = document.getElementById('cardNumber').value.trim();
        const cardExp = document.getElementById('cardExpiry').value.trim();
        const cardCvv = document.getElementById('cardCvv').value.trim();

        if (!cardNum || !cardExp || !cardCvv) {
            showNotification('Please fill in all card details', 'error');
            return;
        }
    }
    
    try {
        const formData = new FormData();
        formData.append('action', 'checkout');
        formData.append('shipping_address', shippingAddress);
        formData.append('payment_method', paymentMethod === 'card' ? 'Credit Card' : 'Cash on Delivery');
        
        const response = await fetch('checkout.php', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Order placed successfully!');
            closeModal('checkoutModal');
            document.getElementById('checkoutForm').reset();
            
            document.getElementById('cardDetails').style.display = 'none';
            document.getElementById('pm_cod').checked = true;

            cart = [];
            elements.cartCount.textContent = '0';
            setTimeout(() => {
                loadMyOrders();
                openModal('ordersModal');
            }, 1000);
        } else {
            showNotification(data.message, 'error');
        }
    } catch (error) {
        console.error('Error placing order:', error);
        showNotification('Error placing order', 'error');
    }
}

async function loadMyOrders() {
    if (!currentUser) {
        showNotification('Please login to view orders', 'error');
        openModal('loginModal');
        return;
    }
    
    try {
        const response = await fetch('checkout.php?action=my_orders');
        const data = await response.json();
        
        if (data.success) {
            displayOrders(data.orders);
            openModal('ordersModal');
        } else {
            showNotification(data.message, 'error');
        }
    } catch (error) {
        console.error('Error loading orders:', error);
        showNotification('Error loading orders', 'error');
    }
}

function displayOrders(orders) {
    const ordersList = document.getElementById('ordersList');
    
    if (orders.length === 0) {
        ordersList.innerHTML = '<p style="text-align: center; padding: 50px; color: #7f8c8d;">No orders found</p>';
        return;
    }
    
    ordersList.innerHTML = orders.map(order => `
        <div class="order-card">
            <div class="order-header">
                <span class="order-id">Order #${order.order_id}</span>
                <span class="order-status ${order.order_status}">${order.order_status}</span>
            </div>
            <div class="order-info">
                <div><strong>Date:</strong> ${new Date(order.order_date).toLocaleDateString()}</div>
                <div><strong>Total:</strong> $${parseFloat(order.total_amount).toFixed(2)}</div>
                <div><strong>Items:</strong> ${order.item_count}</div>
                <div><strong>Payment:</strong> ${order.payment_method || 'COD'}</div>
                <div><strong>Status:</strong> ${order.payment_status || 'Pending'}</div>
            </div>
            <div style="margin-top: 10px;"><strong>Shipping Address:</strong> ${order.shipping_address}</div>
        </div>
    `).join('');
}

async function login(event) {
    event.preventDefault();
    
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const formData = new FormData();
        formData.append('action', 'login');
        formData.append('username', username);
        formData.append('password', password);
        
        const response = await fetch('auth.php', {
            method: 'POST',
            body: formData,
            credentials: 'same-origin'
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentUser = data.user;
            updateUserMenu(true);
            closeModal('loginModal');
            showNotification(data.message);
            document.getElementById('loginForm').reset();
            
            if(currentUser.is_admin) {
                elements.adminAddProductBtn.style.display = 'inline-block';
                loadProducts();
            }
        } else {
            showNotification(data.message, 'error');
        }
    } catch (error) {
        console.error('Error logging in:', error);
        showNotification('Error logging in', 'error');
    }
}

async function register(event) {
    event.preventDefault();
    
    const formData = new FormData();
    formData.append('action', 'register');
    formData.append('username', document.getElementById('regUsername').value);
    formData.append('email', document.getElementById('regEmail').value);
    formData.append('password', document.getElementById('regPassword').value);
    formData.append('full_name', document.getElementById('regFullName').value);
    formData.append('phone', document.getElementById('regPhone').value);
    formData.append('address', document.getElementById('regAddress').value);
    
    try {
        const response = await fetch('auth.php', {
            method: 'POST',
            body: formData,
            credentials: 'same-origin'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification(data.message);
            closeModal('registerModal');
            openModal('loginModal');
            document.getElementById('registerForm').reset();
        } else {
            showNotification(data.message, 'error');
        }
    } catch (error) {
        console.error('Error registering:', error);
        showNotification('Error registering', 'error');
    }
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        window.location.href = 'auth.php?action=logout';
    }
}

function applyFilters() {
    const filters = {
        category: elements.categoryFilter.value,
        search: elements.searchInput.value,
        min_price: elements.minPrice.value,
        max_price: elements.maxPrice.value,
        sort: elements.sortFilter.value
    };
    
    loadProducts(filters);
}

function resetFilters() {
    elements.categoryFilter.value = '';
    elements.searchInput.value = '';
    elements.minPrice.value = '0';
    elements.maxPrice.value = '99999';
    elements.sortFilter.value = 'product_name';
    loadProducts();
}

function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

function showNotification(message, type = 'success') {
    elements.notification.textContent = message;
    elements.notification.className = `notification ${type} show`;
    
    setTimeout(() => {
        elements.notification.classList.remove('show');
    }, 3000);
}

function initEventListeners() {
    if(elements.adminAddProductBtn) {
        elements.adminAddProductBtn.addEventListener('click', () => openAdminModal('create'));
    }
    const closeAdmin = document.getElementById('closeAdminModal');
    if(closeAdmin) {
        closeAdmin.addEventListener('click', () => closeModal('adminProductModal'));
    }
    const adminForm = document.getElementById('adminProductForm');
    if(adminForm) {
        adminForm.addEventListener('submit', handleAdminSubmit);
    }

    elements.searchBtn.addEventListener('click', applyFilters);
    elements.searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') applyFilters();
    });
    
    elements.applyFilters.addEventListener('click', applyFilters);
    elements.resetFilters.addEventListener('click', resetFilters);
    
    elements.cartBtn.addEventListener('click', () => openModal('cartModal'));
    document.getElementById('closeCartModal').addEventListener('click', () => closeModal('cartModal'));
    document.getElementById('clearCartBtn').addEventListener('click', clearCart);
    document.getElementById('checkoutBtn').addEventListener('click', proceedToCheckout);
    
    document.getElementById('closeCheckoutModal').addEventListener('click', () => closeModal('checkoutModal'));
    document.getElementById('cancelCheckoutBtn').addEventListener('click', () => closeModal('checkoutModal'));
    document.getElementById('placeOrderBtn').addEventListener('click', placeOrder);

    const paymentRadios = document.getElementsByName('paymentMethod');
    const cardDetails = document.getElementById('cardDetails');
    
    paymentRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.value === 'card') {
                cardDetails.style.display = 'block';
                document.getElementById('cardNumber').setAttribute('required', 'true');
                document.getElementById('cardExpiry').setAttribute('required', 'true');
                document.getElementById('cardCvv').setAttribute('required', 'true');
            } else {
                cardDetails.style.display = 'none';
                document.getElementById('cardNumber').removeAttribute('required');
                document.getElementById('cardExpiry').removeAttribute('required');
                document.getElementById('cardCvv').removeAttribute('required');
            }
        });
    });

    elements.loginBtn.addEventListener('click', () => openModal('loginModal'));
    elements.registerBtn.addEventListener('click', () => openModal('registerModal'));
    document.getElementById('closeLoginModal').addEventListener('click', () => closeModal('loginModal'));
    document.getElementById('closeRegisterModal').addEventListener('click', () => closeModal('registerModal'));
    document.getElementById('loginForm').addEventListener('submit', login);
    document.getElementById('registerForm').addEventListener('submit', register);
    document.getElementById('switchToRegister').addEventListener('click', (e) => {
        e.preventDefault();
        closeModal('loginModal');
        openModal('registerModal');
    });
    document.getElementById('switchToLogin').addEventListener('click', (e) => {
        e.preventDefault();
        closeModal('registerModal');
        openModal('loginModal');
    });
    elements.logoutBtn.addEventListener('click', logout);
    elements.myOrdersBtn.addEventListener('click', loadMyOrders);
    

    document.getElementById('closeOrdersModal').addEventListener('click', () => closeModal('ordersModal'));
    
    document.getElementById('closeProductModal').addEventListener('click', () => closeModal('productModal'));
    
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
}