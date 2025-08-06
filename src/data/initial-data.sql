-- =========================================
-- INITIAL DATA SETUP
-- Roles, admin user, tables, and basic categories
-- =========================================

-- 1. INSERT ROLES
INSERT INTO roles (role_name) VALUES 
('Admin'),
('Manager'),
('Chef'),
('Server'),
('Cashier'),
('Receptionist'),
('Cleaner');

-- 2. CREATE ADMIN USER
-- Password: 'admin123' (hashed with bcrypt)
INSERT INTO users (user_name, password, role_id, email, is_active) VALUES 
('admin', '$2b$10$YourHashedPasswordHere', 1, 'admin@restaurant.com', true);

-- 3. INSERT SAMPLE TABLES (Section A: Main Hall)
INSERT INTO tables (table_id, capacity, location, is_occupied) VALUES 
('A-01', 2, 'Window side', false),
('A-02', 4, 'Main hall center', false),
('A-03', 4, 'Main hall center', false),
('A-04', 6, 'Family section', false),
('A-05', 2, 'Quiet corner', false),
('A-06', 8, 'Large family table', false);

-- Section B: VIP Area
INSERT INTO tables (table_id, capacity, location, is_occupied) VALUES 
('B-01', 2, 'VIP booth', false),
('B-02', 4, 'VIP private room', false),
('B-03', 6, 'VIP dining area', false);

-- Section C: Terrace
INSERT INTO tables (table_id, capacity, location, is_occupied) VALUES 
('C-01', 4, 'Terrace garden view', false),
('C-02', 2, 'Terrace romantic table', false),
('C-03', 6, 'Terrace group table', false);

-- Section D: Bar Area
INSERT INTO tables (table_id, capacity, location, is_occupied) VALUES 
('D-01', 2, 'Bar counter', false),
('D-02', 4, 'Bar lounge', false),
('D-03', 2, 'Bar high table', false);

-- 4. INSERT BASIC CATEGORIES
INSERT INTO categories (name, description, display_order, is_active) VALUES 
('Appetizers', 'Delicious starters and appetizers', 1, true),
('Main Courses', 'Our signature main dishes', 2, true),
('Desserts', 'Sweet treats and desserts', 3, true),
('Beverages', 'Hot and cold drinks', 4, true),
('Set Menus', 'Complete meal packages', 5, true);

-- 5. INSERT SAMPLE SUBCATEGORIES
INSERT INTO subcategories (category_id, name, description, display_order, is_active) VALUES 
-- Appetizers
(1, 'Cold Appetizers', 'Fresh cold starters', 1, true),
(1, 'Hot Appetizers', 'Warm appetizer dishes', 2, true),
-- Main Courses
(2, 'Grilled Items', 'Grilled meat and seafood', 1, true),
(2, 'Pasta & Rice', 'Pasta and rice dishes', 2, true),
(2, 'Vegetarian', 'Vegetarian main courses', 3, true),
-- Desserts
(3, 'Cakes', 'Fresh cakes and pastries', 1, true),
(3, 'Ice Cream', 'Various ice cream flavors', 2, true),
-- Beverages
(4, 'Hot Drinks', 'Tea, coffee and hot beverages', 1, true),
(4, 'Cold Drinks', 'Soft drinks and juices', 2, true),
(4, 'Alcoholic', 'Wine, beer and cocktails', 3, true);

-- 6. INSERT SAMPLE PRODUCTS
INSERT INTO products (product_id, subcategory_id, name, description, price, is_available, preparation_time, popularity_score, display_order) VALUES 
-- Cold Appetizers
('1.1.001', 1, 'Mediterranean Meze', 'Fresh hummus, olives, and cheese selection', 12.50, true, 5, 85, 1),
('1.1.002', 1, 'Caesar Salad', 'Crisp lettuce with parmesan and croutons', 10.00, true, 8, 92, 2),
-- Hot Appetizers  
('1.2.001', 2, 'Stuffed Mushrooms', 'Mushrooms filled with herb cheese', 8.50, true, 12, 78, 1),
('1.2.002', 2, 'Chicken Wings', 'Spicy buffalo wings with ranch dip', 11.00, true, 15, 95, 2),
-- Grilled Items
('2.1.001', 3, 'Grilled Salmon', 'Fresh Atlantic salmon with herbs', 18.50, true, 20, 88, 1),
('2.1.002', 3, 'Ribeye Steak', 'Premium 300g ribeye steak', 24.00, true, 25, 90, 2),
-- Pasta & Rice
('2.2.001', 4, 'Carbonara Pasta', 'Classic Italian carbonara', 14.50, true, 15, 89, 1),
('2.2.002', 4, 'Chicken Pilaf', 'Turkish style chicken rice', 13.00, true, 18, 82, 2),
-- Desserts
('3.1.001', 6, 'Chocolate Cake', 'Rich chocolate layer cake', 7.50, true, 5, 91, 1),
('3.2.001', 7, 'Vanilla Ice Cream', '3 scoops of premium vanilla', 5.50, true, 2, 87, 1),
-- Beverages
('4.1.001', 8, 'Turkish Coffee', 'Traditional Turkish coffee', 4.00, true, 8, 85, 1),
('4.2.001', 9, 'Fresh Orange Juice', 'Freshly squeezed orange juice', 6.00, true, 3, 80, 1);

-- 7. INSERT SAMPLE MENU
INSERT INTO menus (menu_name, description, price, category_id, is_available, preparation_time, popularity_score) VALUES 
('Business Lunch Menu', 'Starter + Main Course + Drink', 22.50, 5, true, 25, 75),
('Romantic Dinner for Two', 'Complete dinner experience for couples', 65.00, 5, true, 45, 85),
('Family Set Menu', 'Perfect for families with children', 48.00, 5, true, 30, 80);

-- 8. LINK MENU ITEMS
INSERT INTO menu_items (menu_id, product_id, quantity, is_required, item_type, display_order) VALUES 
-- Business Lunch Menu (menu_id = 1)
(1, '1.1.002', 1, true, 'starter', 1), -- Caesar Salad
(1, '2.2.001', 1, true, 'main', 2),    -- Carbonara Pasta
(1, '4.2.001', 1, true, 'drink', 3);   -- Orange Juice

-- 9. INSERT SAMPLE PRODUCT OPTIONS
INSERT INTO product_options (product_id, option_name, option_type, price_modifier, display_order) VALUES 
-- Steak options
('2.1.002', 'Rare', 'cooking_level', 0.00, 1),
('2.1.002', 'Medium Rare', 'cooking_level', 0.00, 2),
('2.1.002', 'Medium', 'cooking_level', 0.00, 3),
('2.1.002', 'Well Done', 'cooking_level', 0.00, 4),
-- Ice cream options
('3.2.001', 'Small (2 scoops)', 'size', -1.50, 1),
('3.2.001', 'Large (4 scoops)', 'size', 2.00, 2),
-- Coffee options
('4.1.001', 'Single', 'size', 0.00, 1),
('4.1.001', 'Double', 'size', 1.50, 2);

SELECT 'Initial data setup completed successfully!' as status;
