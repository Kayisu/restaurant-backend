import {
  getAllUsersService,
  getUserByIdService,
  createUserService,
  updateUserService,
  deleteUserService,
} from "../models/userModel.js";

// Standardized response function
const handleResponse = (res, status, success, data, message) => {
  res.status(status).json({
    success,
    message,
    data,
  });
};

export const createUser = async (req, res, next) => {
  const { staff_name, password, role_id } = req.body;
  try {
    const newUser = await createUserService({ staff_name, password, role_id });
    handleResponse(res, 201, true, newUser, "User created successfully");
  } catch (err) {
    next(err);
  }
};

export const getAllUsers = async (req, res, next) => {
  try {
    const users = await getAllUsersService();
    handleResponse(res, 200, true, users, "Users fetched successfully");
  } catch (err) {
    next(err);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const user = await getUserByIdService(req.params.id); // Changed from staff_id to id
    if (!user) {
      return handleResponse(res, 404, false, null, "User not found");
    }
    handleResponse(res, 200, true, user, "User fetched successfully");
  } catch (err) {
    next(err);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const { staff_name, password, role_id } = req.body;
    const updatedUser = await updateUserService(
      req.params.id, // Changed from staff_id to id
      { staff_name, password, role_id } // Pass as object
    );
    if (!updatedUser) {
      return handleResponse(res, 404, false, null, "User not found");
    }
    handleResponse(res, 200, true, updatedUser, "User updated successfully");
  } catch (err) {
    next(err);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const deletedUser = await deleteUserService(req.params.id); // Changed from staff_id to id
    if (!deletedUser) {
      return handleResponse(res, 404, false, null, "User not found");
    }
    handleResponse(res, 200, true, deletedUser, "User deleted successfully");
  } catch (err) {
    next(err);
  }
};
