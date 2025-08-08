-- Dashboard Tables View

CREATE OR REPLACE VIEW dashboard_tables AS
SELECT 
  t.table_id,
  t.capacity,
  t.is_occupied,
  t.is_reserved,
  t.assigned_server,
  t.occupied_since,
  t.created_at,
  
  -- Server (staff) information if assigned
  u.user_name as server_name,
  u.phone as server_phone,

  -- Active order information
  o.order_id as active_order_id,
  o.status as order_status,
  o.order_date,
  o.total_amount,
  o.customer_id,

  -- Customer information (if available)
  c.name as customer_name,
  c.phone_number as customer_phone,

  -- Reservation information
  r.reservation_id,
  r.party_size as reserved_party_size,
  r.reservation_date,
  r.reservation_time,
  r.status as reservation_status,
  cust.name as reserved_customer_name,
  cust.phone_number as reserved_customer_phone,

  -- Enhanced table status summary
  CASE 
    WHEN t.is_reserved = true THEN 'reserved'
    WHEN t.is_occupied = false THEN 'available'
    WHEN t.is_occupied = true AND o.status = 'pending' THEN 'ordering'
    WHEN t.is_occupied = true AND o.status = 'confirmed' THEN 'confirmed'
    WHEN t.is_occupied = true AND o.status = 'preparing' THEN 'preparing'
    WHEN t.is_occupied = true AND o.status = 'ready' THEN 'ready'
    WHEN t.is_occupied = true AND o.status = 'served' THEN 'served'
    WHEN t.is_occupied = true AND o.status = 'completed' THEN 'payment_pending'
    ELSE 'occupied'
  END as table_status,
  
  -- Table usage duration in minutes
  CASE 
    WHEN t.is_occupied = true AND t.occupied_since IS NOT NULL 
    THEN EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - t.occupied_since))/60
    ELSE 0
  END as occupied_duration_minutes,
  
  -- Order item count
  COALESCE(oi.item_count, 0) as order_item_count,

  -- Last activity timestamp
  GREATEST(t.occupied_since, o.order_date) as last_activity

FROM tables t
LEFT JOIN users u ON t.assigned_server = u.user_id
LEFT JOIN orders o ON t.table_id = o.table_id 
  AND o.status NOT IN ('completed', 'cancelled')
  AND o.order_date = (
    SELECT MAX(order_date) 
    FROM orders o2 
    WHERE o2.table_id = t.table_id 
    AND o2.status NOT IN ('completed', 'cancelled')
  )
LEFT JOIN customers c ON o.customer_id = c.customer_id
LEFT JOIN reservations r ON t.table_id = r.table_id 
  AND r.reservation_date = CURRENT_DATE
  AND r.status = 'confirmed'
LEFT JOIN customers cust ON r.customer_id = cust.customer_id
LEFT JOIN (
  SELECT 
    order_id, 
    COUNT(*) as item_count
  FROM order_items 
  WHERE status != 'cancelled'
  GROUP BY order_id
) oi ON o.order_id = oi.order_id

ORDER BY 
  -- First by status priority (available, reserved, occupied)
  CASE 
    WHEN t.is_reserved = true THEN 1
    WHEN t.is_occupied = false THEN 0
    ELSE 2
  END,
  -- Then by table ID
  t.table_id;

-- Dashboard Statistics View 
CREATE OR REPLACE VIEW dashboard_stats AS
SELECT 
  COUNT(*) as total_tables,
  COUNT(*) FILTER (WHERE t.is_occupied = true) as occupied_tables,
  COUNT(*) FILTER (WHERE t.is_reserved = true) as reserved_tables,
  COUNT(*) FILTER (WHERE t.is_occupied = false AND t.is_reserved = false) as available_tables,
  COUNT(*) FILTER (WHERE dt.table_status = 'ordering') as ordering_tables,
  COUNT(*) FILTER (WHERE dt.table_status = 'preparing') as preparing_tables,
  COUNT(*) FILTER (WHERE dt.table_status = 'ready') as ready_tables,
  COUNT(*) FILTER (WHERE dt.table_status = 'served') as served_tables,
  ROUND(AVG(dt.occupied_duration_minutes)) as avg_occupation_time,
  SUM(COALESCE(dt.total_amount, 0)) as active_orders_total
FROM tables t
LEFT JOIN dashboard_tables dt ON t.table_id = dt.table_id;

SELECT 'Dashboard views created successfully!' as status;
