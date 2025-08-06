-- =========================================

-- 1. ROLES TABLE
CREATE TABLE roles (
  role_id SERIAL PRIMARY KEY,
  role_name VARCHAR(50) NOT NULL UNIQUE
);

-- 2. USERS TABLE
CREATE TABLE users (
  user_id SERIAL PRIMARY KEY,
  user_name VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role_id INTEGER NOT NULL REFERENCES roles(role_id),
  email VARCHAR(100) UNIQUE,
  phone VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. USER SHIFTS TABLE
CREATE TABLE user_shifts (
  shift_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  shift_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME,
  total_hours DECIMAL(4,2),
  status VARCHAR(20) DEFAULT 'scheduled',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. CUSTOMERS TABLE
CREATE TABLE customers (
  customer_id SERIAL PRIMARY KEY,
  phone_number VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100),
  email VARCHAR(100),
  address TEXT,
  date_of_birth DATE,
  loyalty_points INTEGER DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0.00,
  last_visit TIMESTAMP,
  registered_by INTEGER REFERENCES users(user_id), 
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. TABLES TABLE (Enhanced with occupied_since)
CREATE TABLE tables (
  table_id VARCHAR(10) PRIMARY KEY,
  capacity INTEGER NOT NULL,
  location VARCHAR(100),
  is_occupied BOOLEAN DEFAULT false,
  assigned_server INTEGER REFERENCES users(user_id),
  occupied_since TIMESTAMP, -- NEW: Track occupation time
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. CATEGORIES TABLE (Enhanced with display_order)
CREATE TABLE categories (
  category_id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  image_url VARCHAR(500),
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0, -- NEW: Ordering support
  created_by INTEGER REFERENCES users(user_id),
  updated_by INTEGER REFERENCES users(user_id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. SUBCATEGORIES TABLE (Enhanced with display_order)
CREATE TABLE subcategories (
  subcategory_id SERIAL PRIMARY KEY,
  category_id INTEGER NOT NULL REFERENCES categories(category_id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  image_url VARCHAR(500),
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0, -- NEW: Ordering support
  created_by INTEGER REFERENCES users(user_id),
  updated_by INTEGER REFERENCES users(user_id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. PRODUCTS TABLE (Enhanced with popularity_score and display_order)
CREATE TABLE products (
  product_id VARCHAR(20) PRIMARY KEY,
  subcategory_id INTEGER NOT NULL REFERENCES subcategories(subcategory_id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url VARCHAR(500),
  is_available BOOLEAN DEFAULT true,
  preparation_time INTEGER,
  popularity_score INTEGER DEFAULT 0, -- NEW: Popularity tracking
  display_order INTEGER DEFAULT 0, -- NEW: Ordering support
  created_by INTEGER REFERENCES users(user_id),
  updated_by INTEGER REFERENCES users(user_id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. MENUS TABLE (NEW: Set menus with multiple products)
CREATE TABLE menus (
  menu_id SERIAL PRIMARY KEY,
  menu_name VARCHAR(200) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category_id INTEGER NOT NULL REFERENCES categories(category_id),
  image_url VARCHAR(500),
  is_available BOOLEAN DEFAULT true,
  popularity_score INTEGER DEFAULT 0,
  preparation_time INTEGER,
  created_by INTEGER REFERENCES users(user_id),
  updated_by INTEGER REFERENCES users(user_id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. MENU ITEMS JUNCTION TABLE (NEW: Link menus to products)
CREATE TABLE menu_items (
  menu_item_id SERIAL PRIMARY KEY,
  menu_id INTEGER NOT NULL REFERENCES menus(menu_id) ON DELETE CASCADE,
  product_id VARCHAR(20) NOT NULL REFERENCES products(product_id),
  quantity INTEGER NOT NULL DEFAULT 1,
  is_required BOOLEAN DEFAULT true,
  item_type VARCHAR(20) DEFAULT 'main', -- 'main', 'side', 'drink', 'dessert'
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(menu_id, product_id) -- Prevent duplicate products in same menu
);

-- 11. PRODUCT OPTIONS TABLE (NEW: Size, spice level, etc.)
CREATE TABLE product_options (
  option_id SERIAL PRIMARY KEY,
  product_id VARCHAR(20) NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
  option_name VARCHAR(100) NOT NULL, -- 'Small', 'Large', 'Spicy', 'Mild'
  option_type VARCHAR(50) NOT NULL, -- 'size', 'spice_level', 'temperature'
  price_modifier DECIMAL(8,2) DEFAULT 0.00,
  is_available BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. ORDERS TABLE (Enhanced with payment_status and completed_at)
CREATE TABLE orders (
  order_id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(customer_id),
  table_id VARCHAR(10) REFERENCES tables(table_id),
  order_type VARCHAR(20) DEFAULT 'dine-in', -- 'dine-in', 'takeaway', 'delivery'
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'preparing', 'ready', 'served', 'cancelled'
  subtotal DECIMAL(10,2) DEFAULT 0.00,
  tax_amount DECIMAL(10,2) DEFAULT 0.00,
  discount_amount DECIMAL(10,2) DEFAULT 0.00,
  service_charge DECIMAL(10,2) DEFAULT 0.00,
  total_amount DECIMAL(10,2) DEFAULT 0.00,
  payment_status VARCHAR(20) DEFAULT 'pending', -- NEW: Payment tracking
  completed_at TIMESTAMP, -- NEW: Completion time
  notes TEXT,
  estimated_ready_time TIMESTAMP,
  order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  served_at TIMESTAMP,
  
  -- Server relationships 
  server_id INTEGER REFERENCES users(user_id),
  served_by INTEGER REFERENCES users(user_id),
  prepared_by INTEGER REFERENCES users(user_id),
  updated_by INTEGER REFERENCES users(user_id)
);

-- 13. ORDER ITEMS TABLE (Enhanced with menu support)
CREATE TABLE order_items (
  order_item_id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
  product_id VARCHAR(20) REFERENCES products(product_id),
  menu_id INTEGER REFERENCES menus(menu_id), -- NEW: Menu support
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  special_instructions TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  assigned_chef INTEGER REFERENCES users(user_id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 14. BILLS TABLE
CREATE TABLE bills (
  bill_id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(order_id),
  customer_id INTEGER REFERENCES customers(customer_id),
  bill_number VARCHAR(20) UNIQUE NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) DEFAULT 0.00,
  discount_amount DECIMAL(10,2) DEFAULT 0.00,
  service_charge DECIMAL(10,2) DEFAULT 0.00,
  total_amount DECIMAL(10,2) NOT NULL,
  payment_status VARCHAR(20) DEFAULT 'pending',
  bill_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  due_date TIMESTAMP,
  server_id INTEGER REFERENCES users(user_id),
  issued_by INTEGER REFERENCES users(user_id)
);

-- 15. BILL PRODUCTS TABLE
CREATE TABLE bill_products (
  bill_product_id SERIAL PRIMARY KEY,
  bill_id INTEGER NOT NULL REFERENCES bills(bill_id) ON DELETE CASCADE,
  product_id VARCHAR(20) NOT NULL REFERENCES products(product_id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 16. PAYMENTS TABLE
CREATE TABLE payments (
  payment_id SERIAL PRIMARY KEY,
  bill_id INTEGER NOT NULL REFERENCES bills(bill_id),
  amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(20) NOT NULL,
  payment_status VARCHAR(20) DEFAULT 'pending',
  transaction_id VARCHAR(100),
  payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_by INTEGER REFERENCES users(user_id)
);

-- 17. RESERVATIONS TABLE
CREATE TABLE reservations (
  reservation_id SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(customer_id),
  table_id VARCHAR(10) REFERENCES tables(table_id),
  party_size INTEGER NOT NULL,
  reservation_date DATE NOT NULL,
  reservation_time TIME NOT NULL,
  status VARCHAR(20) DEFAULT 'confirmed',
  created_by INTEGER REFERENCES users(user_id), 
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- TRIGGERS FOR AUTOMATIC updated_at
-- =========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables with updated_at column
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subcategories_updated_at BEFORE UPDATE ON subcategories 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_menus_updated_at BEFORE UPDATE ON menus 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =========================================
-- CONSTRAINTS FOR ID FORMAT VALIDATION
-- =========================================

ALTER TABLE products ADD CONSTRAINT check_product_id_format 
CHECK (product_id ~ '^[0-9]+\.[0-9]+\.[0-9]+$');

ALTER TABLE tables ADD CONSTRAINT check_table_id_format 
CHECK (table_id ~ '^[A-Z]-[0-9]{2}$');

-- =========================================
-- VIEWS FOR EASIER DATA ACCESS
-- =========================================

-- Active Products View
CREATE OR REPLACE VIEW active_products AS
SELECT 
  p.product_id, 
  p.name, 
  p.price,
  p.is_available,
  p.preparation_time,
  p.popularity_score,
  p.display_order,
  s.name as subcategory_name,
  c.name as category_name
FROM products p
JOIN subcategories s ON p.subcategory_id = s.subcategory_id
JOIN categories c ON s.category_id = c.category_id
WHERE p.is_available = true AND s.is_active = true AND c.is_active = true
ORDER BY c.display_order, s.display_order, p.display_order;

-- Active Menus View
CREATE OR REPLACE VIEW active_menus AS
SELECT 
  m.menu_id,
  m.menu_name,
  m.price,
  m.is_available,
  m.popularity_score,
  c.name as category_name,
  COUNT(mi.product_id) as item_count
FROM menus m
JOIN categories c ON m.category_id = c.category_id
LEFT JOIN menu_items mi ON m.menu_id = mi.menu_id
WHERE m.is_available = true AND c.is_active = true
GROUP BY m.menu_id, m.menu_name, m.price, m.is_available, m.popularity_score, c.name, c.display_order
ORDER BY c.display_order;

-- =========================================
-- PERFORMANCE INDEXES
-- =========================================

-- User indexes
CREATE INDEX idx_user_name ON users(user_name);
CREATE INDEX idx_user_role ON users(role_id);

-- Table indexes
CREATE INDEX idx_tables_server ON tables(assigned_server);
CREATE INDEX idx_tables_occupied ON tables(is_occupied);

-- Order indexes
CREATE INDEX idx_orders_server ON orders(server_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_table ON orders(table_id);
CREATE INDEX idx_orders_date ON orders(order_date);

-- Product indexes
CREATE INDEX idx_products_subcategory ON products(subcategory_id);
CREATE INDEX idx_products_available ON products(is_available);
CREATE INDEX idx_products_popularity ON products(popularity_score);

-- Category indexes
CREATE INDEX idx_categories_active ON categories(is_active);
CREATE INDEX idx_subcategories_category ON subcategories(category_id);

-- Menu indexes
CREATE INDEX idx_menus_category ON menus(category_id);
CREATE INDEX idx_menus_available ON menus(is_available);
CREATE INDEX idx_menu_items_menu ON menu_items(menu_id);
CREATE INDEX idx_menu_items_product ON menu_items(product_id);

-- Order items indexes
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);
CREATE INDEX idx_order_items_menu ON order_items(menu_id);

-- Bill indexes
CREATE INDEX idx_bills_server ON bills(server_id);
CREATE INDEX idx_payments_processed_by ON payments(processed_by);

-- Reservation indexes
CREATE INDEX idx_reservations_user ON reservations(created_by);

SELECT 'Complete restaurant schema created successfully!' as status;
