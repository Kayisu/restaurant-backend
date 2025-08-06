
CREATE OR REPLACE VIEW table_sections AS
SELECT 
  -- Section information
  LEFT(table_id, 1) as section_code,
  CASE LEFT(table_id, 1)
    WHEN 'A' THEN 'Main Hall'
    WHEN 'B' THEN 'VIP Section'
    WHEN 'C' THEN 'Terrace'
    WHEN 'D' THEN 'Bar Counter'
    ELSE 'Other'
  END as section_name,

  -- Section statistics
  COUNT(*) as total_tables,
  COUNT(*) FILTER (WHERE is_occupied = true) as occupied_tables,
  COUNT(*) FILTER (WHERE is_occupied = false) as available_tables,
  SUM(capacity) as total_capacity,
  SUM(capacity) FILTER (WHERE is_occupied = false) as available_capacity,

  -- Section status
  ROUND(
    COUNT(*) FILTER (WHERE is_occupied = true) * 100.0 / COUNT(*), 
    1
  ) as occupancy_rate,

  -- Average capacity and usage
  ROUND(AVG(capacity), 1) as avg_capacity,
  ROUND(
    AVG(occupied_duration_minutes) FILTER (WHERE is_occupied = true), 
    1
  ) as avg_occupied_time,

  -- Active order information
  COUNT(*) FILTER (WHERE active_order_id IS NOT NULL) as tables_with_orders,
  SUM(COALESCE(total_amount, 0)) as section_revenue

FROM dashboard_tables
GROUP BY LEFT(table_id, 1)
ORDER BY LEFT(table_id, 1);

-- Detailed section view (including tables)
CREATE OR REPLACE VIEW section_tables_detailed AS
SELECT 

  -- Section information
  LEFT(dt.table_id, 1) as section_code,
  CASE LEFT(dt.table_id, 1)
    WHEN 'A' THEN 'Main Hall'
    WHEN 'B' THEN 'VIP Section'
    WHEN 'C' THEN 'Terrace'
    WHEN 'D' THEN 'Bar Counter'
    ELSE 'Other'
  END as section_name,
  
  -- Table information
  dt.table_id,
  dt.capacity,
  dt.is_occupied,
  dt.table_status,
  dt.server_name,
  dt.occupied_duration_minutes,
  dt.order_item_count,
  dt.total_amount,
  dt.customer_name,
  dt.customer_phone,
  

  -- Extract table number from ID
  RIGHT(dt.table_id, LENGTH(dt.table_id) - 2)::INTEGER as table_number

FROM dashboard_tables dt
ORDER BY 
  LEFT(dt.table_id, 1), 
  RIGHT(dt.table_id, LENGTH(dt.table_id) - 2)::INTEGER;

-- Summary view for sections
CREATE OR REPLACE VIEW dashboard_section_summary AS
SELECT 
  section_code,
  section_name,
  total_tables,
  occupied_tables,
  available_tables,
  occupancy_rate,
  
  -- Status indicators (business logic only)
  CASE 
    WHEN occupancy_rate >= 90 THEN 'full'
    WHEN occupancy_rate >= 70 THEN 'busy'
    WHEN occupancy_rate >= 40 THEN 'moderate'
    ELSE 'quiet'
  END as section_status

FROM table_sections
ORDER BY section_code;

SELECT 'Table section views created successfully!' as status;
