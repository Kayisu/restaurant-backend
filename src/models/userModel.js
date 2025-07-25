import pool from '../config/db.js';

export const getAllUsersService = async () => {
  const result = await pool.query(`
    SELECT 
      s.staff_id, 
      s.staff_name, 
      s.role_id, 
      r.role_name 
    FROM staff s 
    JOIN role r ON s.role_id = r.role_id
  `);
  return result.rows;
};

export const getUserByIdService = async (staff_id) => {
  const result = await pool.query(`
    SELECT 
      s.staff_id, 
      s.staff_name, 
      s.role_id, 
      r.role_name 
    FROM staff s 
    JOIN role r ON s.role_id = r.role_id 
    WHERE s.staff_id = $1
  `, [staff_id]); 

  // please don't use string interpolation for SQL queries to prevent SQL injection I BEG YOU don't forget this. 
  // I know it's kinda cool but there is a reason for why people do this boring thing
  
  
  return result.rows[0];
};export const createUserService = async (userData) => {
  const { staff_name, password, role_id } = userData;
  const result = await pool.query(
    `
    INSERT INTO staff (staff_name, password, role_id) 
    VALUES ($1, $2, $3) 
    RETURNING *
  `,
    [staff_name, password, role_id]
  );
  return result.rows[0];
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

export const deleteUserService = async (id) => {
    const result = await pool.query(
        `
        DELETE FROM staff 
        WHERE staff_id = $1
        RETURNING *
    `,
        [id]
    );
    return result.rows[0];

};