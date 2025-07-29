import {
  getAllUsersService,
  getUserByIdService,
  createUserService,
  updateUserService,
  deleteUserService,
  loginUserService,
} from "../models/userModel.js";
import { generateToken } from "../middlewares/authentication.js";

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

export const loginUser = async (req, res, next) => {
  const { staff_name, password } = req.body;
  try {
    const user = await loginUserService(staff_name, password);

    if (!user) {
      return handleResponse(res, 401, false, null, "Invalid credentials");
    }

    const token = generateToken({
      userId: user.staff_id,
      staff_name: user.staff_name,
      role_id: user.role_id,
    });

    res.cookie("token", token, {
      httpOnly: false, // Only accessible by the web server
      secure: process.env.NODE_ENV === "production", // Use secure cookies in production
      sameSite: "Strict", // Prevent CSRF attacks
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    handleResponse(
      res,
      200,
      true,
      {
        user: {
          staff_id: user.staff_id,
          staff_name: user.staff_name,
          role_id: user.role_id,
        },
      },
      "Login successful"
    );
  } catch (err) {
    next(err);
  }
};

export const logoutUser = (req, res) => {
  res.clearCookie("token");
  res.status(200).json({ message: "Logged out" });
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
    const user = await getUserByIdService(req.params.id);
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
    const updatedUser = await updateUserService(req.params.id, {
      staff_name,
      password,
      role_id,
    });
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
    const deletedUser = await deleteUserService(req.params.id);
    if (!deletedUser) {
      return handleResponse(res, 404, false, null, "User not found");
    }
    handleResponse(res, 200, true, deletedUser, "User deleted successfully");
  } catch (err) {
    next(err);
  }
};
