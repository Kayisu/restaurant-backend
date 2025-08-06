-- Dashboard Tables View

CREATE OR REPLACE VIEW dashboard_tables AS
SELECT 
  t.table_id,
  t.capacity,
  t.is_occupied,
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

  -- Table status summary
  CASE 
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
LEFT JOIN (
  SELECT 
    order_id, 
    COUNT(*) as item_count
  FROM order_items 
  WHERE status != 'cancelled'
  GROUP BY order_id
) oi ON o.order_id = oi.order_id

ORDER BY 
  -- First by occupancy status (available first)
  CASE WHEN t.is_occupied THEN 0 ELSE 1 END,
  -- Then by table ID
  t.table_id;

-- Dashboard Statistics View 
CREATE OR REPLACE VIEW dashboard_stats AS
SELECT 
  COUNT(*) as total_tables,
  COUNT(*) FILTER (WHERE is_occupied = true) as occupied_tables,
  COUNT(*) FILTER (WHERE is_occupied = false) as available_tables,
  COUNT(*) FILTER (WHERE table_status = 'ordering') as ordering_tables,
  COUNT(*) FILTER (WHERE table_status = 'preparing') as preparing_tables,
  COUNT(*) FILTER (WHERE table_status = 'ready') as ready_tables,
  COUNT(*) FILTER (WHERE table_status = 'served') as served_tables,
  ROUND(AVG(occupied_duration_minutes)) as avg_occupation_time,
  SUM(COALESCE(total_amount, 0)) as active_orders_total
FROM dashboard_tables;

SELECT 'Dashboard views created successfully!' as status;
