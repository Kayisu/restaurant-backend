import pool from "../config/db.js";
import bcrypt from "bcrypt";

export const getAllUsersService = async () => {
  const result = await pool.query(`
    SELECT 
      u.user_id, 
      u.user_name, 
      u.role_id, 
      r.role_name,
      u.email,
      u.phone,
      u.created_at
    FROM users u 
    JOIN roles r ON u.role_id = r.role_id
  `);
  return result.rows;
};

export const getUserByIdService = async (user_id) => {
  const result = await pool.query(
    `
    SELECT 
      u.user_id, 
      u.user_name, 
      u.role_id, 
      r.role_name,
      u.email,
      u.phone,
      u.created_at
    FROM users u 
    JOIN roles r ON u.role_id = r.role_id 
    WHERE u.user_id = $1
  `,
    [user_id]
  );

  return result.rows[0];
};

export const createUserService = async (userData) => {
  const {
    user_name,
    password,
    role_id,
    email = null,
    phone = null,
  } = userData;

  const hashedPassword = await bcrypt.hash(password, 10);

  const result = await pool.query(
    `
    INSERT INTO users (user_name, password, role_id, email, phone, created_at) 
    VALUES ($1, $2, $3, $4, $5, NOW()) 
    RETURNING user_id, user_name, role_id, email, phone, created_at
  `,
    [user_name, hashedPassword, role_id, email, phone]
  );
  return result.rows[0];
};

export const loginUserService = async (user_name, password) => {
  const result = await pool.query(
    `
    SELECT 
      u.user_id, 
      u.user_name, 
      u.password,
      u.role_id, 
      r.role_name,
      u.email,
      u.phone,
      u.created_at
    FROM users u 
    JOIN roles r ON u.role_id = r.role_id 
    WHERE u.user_name = $1
  `,
    [user_name]
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

export const updateUserService = async (user_id, userData) => {
  const { user_name, password, role_id } = userData;
  const result = await pool.query(
    `
    UPDATE users
    SET user_name = $1, password = $2, role_id = $3
    WHERE user_id = $4
    RETURNING *
  `,
    [user_name, password, role_id, user_id]
  );
  return result.rows[0];
};

export const deleteUserService = async (user_id) => {
  const result = await pool.query(
    `
        DELETE FROM users 
        WHERE user_id = $1
        RETURNING *
    `,
    [user_id]
  );
  return result.rows[0];
};

export const updateOwnCredentialsService = async (user_id, currentPassword, updates) => {
  const userResult = await pool.query(
    'SELECT password FROM users WHERE user_id = $1',
    [user_id]
  );

  if (userResult.rows.length === 0) {
    throw new Error('User not found');
  }

  const isPasswordValid = await bcrypt.compare(currentPassword, userResult.rows[0].password);
  if (!isPasswordValid) {
    throw new Error('Current password is incorrect');
  }

  const updateFields = [];
  const values = [];
  let paramCounter = 1;

  if (updates.user_name || updates.staff_name) {
    updateFields.push(`user_name = $${paramCounter++}`);
    values.push(updates.user_name || updates.staff_name);
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
  values.push(user_id);

  const query = `
    UPDATE users 
    SET ${updateFields.join(', ')}
    WHERE user_id = $${paramCounter}
    RETURNING user_id, user_name, role_id, email, phone, updated_at
  `;

  const result = await pool.query(query, values);
  return result.rows[0];
};

export const adminUpdateCredentialsService = async (user_id, updates) => {
  const updateFields = [];
  const values = [];
  let paramCounter = 1;

  if (updates.user_name || updates.staff_name) {
    updateFields.push(`user_name = $${paramCounter++}`);
    values.push(updates.user_name || updates.staff_name);
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
  values.push(user_id);

  const query = `
    UPDATE users 
    SET ${updateFields.join(', ')}
    WHERE user_id = $${paramCounter}
    RETURNING user_id, user_name, role_id, email, phone, updated_at
  `;

  const result = await pool.query(query, values);
  
  if (result.rows.length === 0) {
    throw new Error('User not found');
  }
  
  return result.rows[0];
};
