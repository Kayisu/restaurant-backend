CREATE TABLE roles (
  role_id SERIAL PRIMARY KEY,
  role_name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE staff (
  staff_id SERIAL PRIMARY KEY,
  staff_name VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role_id INTEGER NOT NULL REFERENCES roles(role_id),
  email VARCHAR(100) UNIQUE,
  phone VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE staff_shifts (
  shift_id SERIAL PRIMARY KEY,
  staff_id INTEGER NOT NULL REFERENCES staff(staff_id) ON DELETE CASCADE,
  shift_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME,
  total_hours DECIMAL(4,2),
  status VARCHAR(20) DEFAULT 'scheduled',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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
  registered_by INTEGER REFERENCES staff(staff_id), 
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tables (
  table_id SERIAL PRIMARY KEY,
  table_number VARCHAR(10) NOT NULL UNIQUE,
  capacity INTEGER NOT NULL,
  location VARCHAR(100),
  is_occupied BOOLEAN DEFAULT false,
  assigned_server INTEGER REFERENCES staff(staff_id), -- Current server for this table
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categories (
  category_id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  image_url VARCHAR(500),
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_by INTEGER REFERENCES staff(staff_id),
  updated_by INTEGER REFERENCES staff(staff_id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE subcategories (
  subcategory_id SERIAL PRIMARY KEY,
  category_id INTEGER NOT NULL REFERENCES categories(category_id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  image_url VARCHAR(500),
  is_active BOOLEAN DEFAULT true,
  created_by INTEGER REFERENCES staff(staff_id),
  updated_by INTEGER REFERENCES staff(staff_id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
  product_id SERIAL PRIMARY KEY,
  subcategory_id INTEGER NOT NULL REFERENCES subcategories(subcategory_id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url VARCHAR(500),
  is_available BOOLEAN DEFAULT true,
  preparation_time INTEGER,
  created_by INTEGER REFERENCES staff(staff_id), -- Chef/Manager who created
  updated_by INTEGER REFERENCES staff(staff_id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE orders (
  order_id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(customer_id),
  table_id INTEGER REFERENCES tables(table_id),
  order_type VARCHAR(20) DEFAULT 'dine-in', -- 'dine-in', 'takeaway', 'delivery'
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'preparing', 'ready', 'served', 'cancelled'
  subtotal DECIMAL(10,2) DEFAULT 0.00,
  tax_amount DECIMAL(10,2) DEFAULT 0.00,
  discount_amount DECIMAL(10,2) DEFAULT 0.00,
  service_charge DECIMAL(10,2) DEFAULT 0.00,
  total_amount DECIMAL(10,2) DEFAULT 0.00,
  notes TEXT,
  estimated_ready_time TIMESTAMP,
  order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  served_at TIMESTAMP,
  
  -- Server relationships 
  server_id INTEGER REFERENCES staff(staff_id), -- Server who took the order
  served_by INTEGER REFERENCES staff(staff_id), -- Server who served the order  
  prepared_by INTEGER REFERENCES staff(staff_id), -- Chef who prepared
  updated_by INTEGER REFERENCES staff(staff_id) -- Last person to update
);

CREATE TABLE order_items (
  order_item_id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(product_id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  special_instructions TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  assigned_chef INTEGER REFERENCES staff(staff_id), -- Chef assigned to this item
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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
  
  -- Server relationships 
  server_id INTEGER REFERENCES staff(staff_id), -- Server responsible for this bill
  issued_by INTEGER REFERENCES staff(staff_id) -- Cashier who issued the bill
 
);

CREATE TABLE bill_products (
  bill_product_id SERIAL PRIMARY KEY,
  bill_id INTEGER NOT NULL REFERENCES bills(bill_id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(product_id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE payments (
  payment_id SERIAL PRIMARY KEY,
  bill_id INTEGER NOT NULL REFERENCES bills(bill_id),
  amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(20) NOT NULL,
  payment_status VARCHAR(20) DEFAULT 'pending',
  transaction_id VARCHAR(100),
  payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_by INTEGER REFERENCES staff(staff_id) -- Server/Cashier who processed
);

CREATE TABLE reservations (
  reservation_id SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(customer_id),
  table_id INTEGER REFERENCES tables(table_id),
  party_size INTEGER NOT NULL,
  reservation_date DATE NOT NULL,
  reservation_time TIME NOT NULL,
  status VARCHAR(20) DEFAULT 'confirmed',
  created_by INTEGER REFERENCES staff(staff_id), 
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_staff_name ON staff(staff_name);
CREATE INDEX idx_staff_role ON staff(role_id);
CREATE INDEX idx_tables_server ON tables(assigned_server);
CREATE INDEX idx_orders_server ON orders(server_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_bills_server ON bills(server_id);
CREATE INDEX idx_payments_processed_by ON payments(processed_by);
CREATE INDEX idx_reservations_staff ON reservations(created_by);