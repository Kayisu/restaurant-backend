import pool from "../config/db.js";
import bcrypt from "bcrypt";

export const getAllUsersService = async () => {
  const result = await pool.query(`
    SELECT 
      s.staff_id, 
      s.staff_name, 
      s.role_id, 
      r.role_name,
      s.email,
      s.phone,
      s.created_at
    FROM staff s 
    JOIN roles r ON s.role_id = r.role_id
  `);
  return result.rows;
};

export const getUserByIdService = async (staff_id) => {
  const result = await pool.query(
    `
    SELECT 
      s.staff_id, 
      s.staff_name, 
      s.role_id, 
      r.role_name,
      s.email,
      s.phone,
      s.created_at
    FROM staff s 
    JOIN roles r ON s.role_id = r.role_id 
    WHERE s.staff_id = $1
  `,
    [staff_id]
  );

  return result.rows[0];
};

export const createUserService = async (userData) => {
  const {
    staff_name,
    password,
    role_id,
    email = null,
    phone = null,
  } = userData;

  // Şifreyi hash'le
  const hashedPassword = await bcrypt.hash(password, 10);

  const result = await pool.query(
    `
    INSERT INTO staff (staff_name, password, role_id, email, phone, created_at) 
    VALUES ($1, $2, $3, $4, $5, NOW()) 
    RETURNING staff_id, staff_name, role_id, email, phone, created_at
  `,
    [staff_name, hashedPassword, role_id, email, phone]
  );
  return result.rows[0];
};

export const loginUserService = async (staff_name, password) => {
  const result = await pool.query(
    `
    SELECT 
      s.staff_id, 
      s.staff_name, 
      s.password,
      s.role_id, 
      r.role_name,
      s.email,
      s.phone,
      s.created_at
    FROM staff s 
    JOIN roles r ON s.role_id = r.role_id 
    WHERE s.staff_name = $1
  `,
    [staff_name]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const user = result.rows[0];

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    return null;
  }

  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

export const updateUserService = async (staff_id, userData) => {
  const { staff_name, password, role_id } = userData;
  const result = await pool.query(
    `
    UPDATE staff
    SET staff_name = $1, password = $2, role_id = $3
    WHERE staff_id = $4
    RETURNING *
  `,
    [staff_name, password, role_id, staff_id]
  );
  return result.rows[0];
};

export const deleteUserService = async (staff_id) => {
  const result = await pool.query(
    `
        DELETE FROM staff 
        WHERE staff_id = $1
        RETURNING *
    `,
    [staff_id]
  );
  return result.rows[0];
};

// Update own credentials (requires current password verification)
export const updateOwnCredentialsService = async (staff_id, currentPassword, updates) => {
  // First verify current password
  const userResult = await pool.query(
    'SELECT password FROM staff WHERE staff_id = $1',
    [staff_id]
  );

  if (userResult.rows.length === 0) {
    throw new Error('User not found');
  }

  const isPasswordValid = await bcrypt.compare(currentPassword, userResult.rows[0].password);
  if (!isPasswordValid) {
    throw new Error('Current password is incorrect');
  }

  // Build dynamic update query
  const updateFields = [];
  const values = [];
  let paramCounter = 1;

  if (updates.staff_name) {
    updateFields.push(`staff_name = $${paramCounter++}`);
    values.push(updates.staff_name);
  }

  if (updates.new_password) {
    const hashedPassword = await bcrypt.hash(updates.new_password, 10);
    updateFields.push(`password = $${paramCounter++}`);
    values.push(hashedPassword);
  }

  if (updates.email !== undefined) {
    updateFields.push(`email = $${paramCounter++}`);
    values.push(updates.email);
  }

  if (updates.phone !== undefined) {
    updateFields.push(`phone = $${paramCounter++}`);
    values.push(updates.phone);
  }

  updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(staff_id);

  const query = `
    UPDATE staff 
    SET ${updateFields.join(', ')}
    WHERE staff_id = $${paramCounter}
    RETURNING staff_id, staff_name, role_id, email, phone, updated_at
  `;

  const result = await pool.query(query, values);
  return result.rows[0];
};

// Admin update any user's credentials (no current password needed)
export const adminUpdateCredentialsService = async (staff_id, updates) => {
  // Build dynamic update query
  const updateFields = [];
  const values = [];
  let paramCounter = 1;

  if (updates.staff_name) {
    updateFields.push(`staff_name = $${paramCounter++}`);
    values.push(updates.staff_name);
  }

  if (updates.password) {
    const hashedPassword = await bcrypt.hash(updates.password, 10);
    updateFields.push(`password = $${paramCounter++}`);
    values.push(hashedPassword);
  }

  if (updates.role_id) {
    updateFields.push(`role_id = $${paramCounter++}`);
    values.push(updates.role_id);
  }

  if (updates.email !== undefined) {
    updateFields.push(`email = $${paramCounter++}`);
    values.push(updates.email);
  }

  if (updates.phone !== undefined) {
    updateFields.push(`phone = $${paramCounter++}`);
    values.push(updates.phone);
  }

  if (updateFields.length === 0) {
    throw new Error('No fields to update');
  }

  updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(staff_id);

  const query = `
    UPDATE staff 
    SET ${updateFields.join(', ')}
    WHERE staff_id = $${paramCounter}
    RETURNING staff_id, staff_name, role_id, email, phone, updated_at
  `;

  const result = await pool.query(query, values);
  
  if (result.rows.length === 0) {
    throw new Error('User not found');
  }
  
  return result.rows[0];
};
