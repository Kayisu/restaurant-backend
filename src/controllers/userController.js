import {
  getAllUsersService,
  getUserByIdService,
  createUserService,
  deleteUserService,
  loginUserService,
  updateOwnCredentialsService,
  adminUpdateCredentialsService,
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
  const { staff_name, password, role_id, email, phone } = req.body;
  try {
    const newUser = await createUserService({ staff_name, password, role_id, email, phone });
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

// Refresh current user's token with latest info
export const refreshToken = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const user = await getUserByIdService(userId);
    
    if (!user) {
      return handleResponse(res, 404, false, null, "User not found");
    }

    const newToken = generateToken({
      userId: user.staff_id,
      staff_name: user.staff_name,
      role_id: user.role_id,
    });

    res.cookie("token", newToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    handleResponse(res, 200, true, {
      user: {
        staff_id: user.staff_id,
        staff_name: user.staff_name,
        role_id: user.role_id,
        email: user.email,
        phone: user.phone
      },
      token: newToken
    }, "Token refreshed successfully");
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
    const user = await getUserByIdService(req.params.id);
    if (!user) {
      return handleResponse(res, 404, false, null, "User not found");
    }
    handleResponse(res, 200, true, user, "User fetched successfully");
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

// Update own credentials (requires current password)
export const updateOwnCredentials = async (req, res, next) => {
  try {
    const { current_password, ...updates } = req.body;
    const userId = req.user.userId; // From authentication middleware

    const updatedUser = await updateOwnCredentialsService(userId, current_password, updates);
    
    // Generate new token with updated information
    const newToken = generateToken({
      userId: updatedUser.staff_id,
      staff_name: updatedUser.staff_name,
      role_id: updatedUser.role_id,
    });

    // Set new token in cookie
    res.cookie("token", newToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });
    
    handleResponse(res, 200, true, {
      user: updatedUser,
      token: newToken // Also send token in response for client-side storage
    }, "Credentials updated successfully");
  } catch (err) {
    if (err.message === 'Current password is incorrect') {
      return handleResponse(res, 400, false, null, "Current password is incorrect");
    }
    if (err.message === 'User not found') {
      return handleResponse(res, 404, false, null, "User not found");
    }
    next(err);
  }
};

// Admin update any user's credentials (no current password needed)
export const adminUpdateCredentials = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;
    const updates = req.body;
    const currentUserId = req.user.userId; // Current admin's ID

    console.log(`Admin Update - Target: ${targetUserId}, Current Admin: ${currentUserId}`);
    
    const updatedUser = await adminUpdateCredentialsService(targetUserId, updates);
    
    // If admin is updating their own account, generate new token
    let responseData = { user: updatedUser };
    
    if (parseInt(targetUserId) === currentUserId) {
      console.log("Admin updating own account - generating new token");
      
      const newToken = generateToken({
        userId: updatedUser.staff_id,
        staff_name: updatedUser.staff_name,
        role_id: updatedUser.role_id,
      });

      res.cookie("token", newToken, {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Strict",
        maxAge: 24 * 60 * 60 * 1000, // 1 day
      });

      responseData.token = newToken;
      responseData.tokenUpdated = true; // Flag for frontend
      
      console.log("New token generated and set in cookie");
    }
    
    handleResponse(res, 200, true, responseData, "User credentials updated successfully by admin");
  } catch (err) {
    if (err.message === 'User not found') {
      return handleResponse(res, 404, false, null, "User not found");
    }
    if (err.message === 'No fields to update') {
      return handleResponse(res, 400, false, null, "No fields to update");
    }
    next(err);
  }
};
