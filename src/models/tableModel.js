import pool from "../config/db.js";

// Validation functions
const validateTableId = (tableId) => {
  const tableIdRegex = /^[A-Z]-[0-9]{2}$/;
  return tableIdRegex.test(tableId);
};

const validateCapacity = (capacity) => {
  return Number.isInteger(capacity) && capacity > 0 && capacity <= 20;
};

// Check if table exists
export const tableExistsService = async (tableId) => {
  const result = await pool.query(
    'SELECT table_id FROM tables WHERE table_id = $1',
    [tableId]
  );
  return result.rows.length > 0;
};

// Check if table has active orders
export const tableHasActiveOrdersService = async (tableId) => {
  const result = await pool.query(`
    SELECT COUNT(*) as order_count 
    FROM orders 
    WHERE table_id = $1 
    AND status NOT IN ('completed', 'cancelled')
  `, [tableId]);
  return parseInt(result.rows[0].order_count) > 0;
};

// Check if table has active reservations
export const tableHasActiveReservationsService = async (tableId) => {
  const result = await pool.query(`
    SELECT COUNT(*) as reservation_count 
    FROM reservations 
    WHERE table_id = $1 
    AND status = 'confirmed'
    AND reservation_date >= CURRENT_DATE
  `, [tableId]);
  return parseInt(result.rows[0].reservation_count) > 0;
};

// Get all tables
export const getAllTablesService = async () => {
  const result = await pool.query(`
    SELECT 
      table_id,
      capacity,
      is_occupied,
      is_reserved,
      table_status,
      server_name,
      occupied_duration_minutes,
      order_item_count,
      total_amount,
      customer_name,
      customer_phone,
      reservation_id,
      reserved_party_size,
      reservation_date,
      reservation_time,
      reservation_status,
      reserved_customer_name,
      reserved_customer_phone
    FROM dashboard_tables 
    ORDER BY 
      CASE 
        WHEN is_reserved = true THEN 1
        WHEN is_occupied = false THEN 0
        ELSE 2
      END,
      table_id
  `);
  return result.rows;
};

// Get table by ID
export const getTableByIdService = async (tableId) => {
  const result = await pool.query(`
    SELECT * FROM dashboard_tables 
    WHERE table_id = $1
  `, [tableId]);
  return result.rows[0];
};

// Create new table
export const createTableService = async (tableData) => {
  const { table_id, capacity, location = null, assigned_server = null } = tableData;

  // Validate table ID format
  if (!validateTableId(table_id)) {
    throw new Error('Invalid table ID format. Must be in format: A-01, B-02, etc.');
  }

  // Validate capacity
  if (!validateCapacity(capacity)) {
    throw new Error('Invalid capacity. Must be a positive integer between 1 and 20.');
  }

  // Check if table already exists
  const exists = await tableExistsService(table_id);
  if (exists) {
    throw new Error(`Table ${table_id} already exists.`);
  }

  // Validate assigned server if provided
  if (assigned_server) {
    const serverResult = await pool.query(
      'SELECT user_id FROM users WHERE user_id = $1 AND role_id IN (4, 1)', // Server or Admin role
      [assigned_server]
    );
    if (serverResult.rows.length === 0) {
      throw new Error('Invalid server ID. Server must exist and have appropriate role.');
    }
  }

  const result = await pool.query(`
    INSERT INTO tables (table_id, capacity, location, assigned_server, created_at) 
    VALUES ($1, $2, $3, $4, NOW()) 
    RETURNING *
  `, [table_id, capacity, location, assigned_server]);

  return result.rows[0];
};

// Delete table
export const deleteTableService = async (tableId) => {
  // Check if table exists
  const exists = await tableExistsService(tableId);
  if (!exists) {
    throw new Error(`Table ${tableId} not found.`);
  }

  // Check if table is currently occupied
  const tableResult = await pool.query(
    'SELECT is_occupied, is_reserved FROM tables WHERE table_id = $1',
    [tableId]
  );
  const table = tableResult.rows[0];

  if (table.is_occupied) {
    throw new Error(`Cannot delete table ${tableId}. Table is currently occupied.`);
  }

  if (table.is_reserved) {
    throw new Error(`Cannot delete table ${tableId}. Table is currently reserved.`);
  }

  // Check for active orders
  const hasOrders = await tableHasActiveOrdersService(tableId);
  if (hasOrders) {
    throw new Error(`Cannot delete table ${tableId}. Table has active orders.`);
  }

  // Check for active reservations
  const hasReservations = await tableHasActiveReservationsService(tableId);
  if (hasReservations) {
    throw new Error(`Cannot delete table ${tableId}. Table has active reservations.`);
  }

  const result = await pool.query(
    'DELETE FROM tables WHERE table_id = $1 RETURNING *',
    [tableId]
  );

  return result.rows[0];
};

// Update table status
export const updateTableStatusService = async (tableId, statusData) => {
  const { is_occupied, is_reserved, assigned_server } = statusData;

  // Check if table exists
  const exists = await tableExistsService(tableId);
  if (!exists) {
    throw new Error(`Table ${tableId} not found.`);
  }

  // Validate that a table cannot be both occupied and reserved
  if (is_occupied && is_reserved) {
    throw new Error('Table cannot be both occupied and reserved.');
  }

  // Validate assigned server if provided
  if (assigned_server) {
    const serverResult = await pool.query(
      'SELECT user_id FROM users WHERE user_id = $1 AND role_id IN (4, 1)', // Server or Admin role
      [assigned_server]
    );
    if (serverResult.rows.length === 0) {
      throw new Error('Invalid server ID. Server must exist and have appropriate role.');
    }
  }

  const updateQuery = `
    UPDATE tables 
    SET 
      is_occupied = $1,
      is_reserved = $2,
      assigned_server = $3,
      occupied_since = CASE 
        WHEN $1 = true AND is_occupied = false THEN CURRENT_TIMESTAMP
        WHEN $1 = false AND $2 = false THEN NULL
        ELSE occupied_since
      END
    WHERE table_id = $4
    RETURNING *
  `;

  const result = await pool.query(updateQuery, [is_occupied, is_reserved, assigned_server, tableId]);
  return result.rows[0];
};

// Update table reservation status
export const updateTableReservationService = async (tableId, reservationData) => {
  const { is_reserved, assigned_server } = reservationData;

  // Check if table exists
  const exists = await tableExistsService(tableId);
  if (!exists) {
    throw new Error(`Table ${tableId} not found.`);
  }

  // Validate assigned server if provided
  if (assigned_server) {
    const serverResult = await pool.query(
      'SELECT user_id FROM users WHERE user_id = $1 AND role_id IN (4, 1)', // Server or Admin role
      [assigned_server]
    );
    if (serverResult.rows.length === 0) {
      throw new Error('Invalid server ID. Server must exist and have appropriate role.');
    }
  }

  const updateQuery = `
    UPDATE tables 
    SET 
      is_reserved = $1,
      is_occupied = false,
      assigned_server = $2,
      occupied_since = NULL
    WHERE table_id = $3
    RETURNING *
  `;

  const result = await pool.query(updateQuery, [is_reserved, assigned_server, tableId]);
  return result.rows[0];
};

// Get dashboard stats
export const getDashboardStatsService = async () => {
  const result = await pool.query('SELECT * FROM dashboard_stats');
  return result.rows[0];
};

// Get table sections
export const getTableSectionsService = async () => {
  const result = await pool.query('SELECT * FROM table_sections ORDER BY section_code');
  return result.rows;
};

// Get section summary
export const getSectionSummaryService = async () => {
  const result = await pool.query('SELECT * FROM dashboard_section_summary');
  return result.rows;
};

// Get tables by section
export const getSectionTablesService = async (sectionCode) => {
  const result = await pool.query(`
    SELECT * FROM section_tables_detailed 
    WHERE section_code = $1 
    ORDER BY table_number
  `, [sectionCode.toUpperCase()]);
  return result.rows;
};
