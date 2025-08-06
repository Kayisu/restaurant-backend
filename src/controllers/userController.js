import {
  createUserService,
  createAdminBypassService,
  authenticateUserService,
  refreshUserTokenService,
  getAllUsersBusinessService,
  getUserByIdBusinessService,
  deleteUserBusinessService,
  updateOwnCredentialsBusinessService,
  adminUpdateCredentialsBusinessService,
  getCookieConfig,
  UserNotFoundError,
  InvalidCredentialsError,
  UnauthorizedError,
  ValidationError,
} from "../services/userService.js";


const handleResponse = (res, status, success, data, message) => {
  res.status(status).json({
    success,
    message,
    data,
  });
};


const handleServiceError = (error, res, next) => {
  if (error instanceof UserNotFoundError || 
      error instanceof InvalidCredentialsError || 
      error instanceof UnauthorizedError || 
      error instanceof ValidationError) {
    return handleResponse(res, error.statusCode, false, null, error.message);
  }
  next(error);
};

export const createUser = async (req, res, next) => {
  const { user_name, password, role_id, email, phone } = req.body;
  try {
    const newUser = await createUserService({ user_name, password, role_id, email, phone });
    handleResponse(res, 201, true, newUser, "User created successfully");
  } catch (err) {
    handleServiceError(err, res, next);
  }
};


export const createAdminBypass = async (req, res, next) => {
  const { user_name, password, email, phone, bypass_key } = req.body;
  
  try {
    const newAdmin = await createAdminBypassService(
      { user_name, password, email, phone }, 
      bypass_key
    );
    
    handleResponse(res, 201, true, newAdmin, "🚨 ADMIN CREATED VIA BYPASS - DISABLE THIS ENDPOINT IMMEDIATELY!");
  } catch (err) {
    handleServiceError(err, res, next);
  }
};

export const loginUser = async (req, res, next) => {
  const { user_name, password } = req.body;
  try {
    const authResult = await authenticateUserService(user_name, password);
    
    // Set cookie with standardized configuration
    res.cookie("token", authResult.token, getCookieConfig());

    handleResponse(res, 200, true, authResult, "Login successful");
  } catch (err) {
    handleServiceError(err, res, next);
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
    const refreshResult = await refreshUserTokenService(userId);
    
    res.cookie("token", refreshResult.token, getCookieConfig());
    
    handleResponse(res, 200, true, refreshResult, "Token refreshed successfully");
  } catch (err) {
    handleServiceError(err, res, next);
  }
};

export const getAllUsers = async (req, res, next) => {
  try {
    const users = await getAllUsersBusinessService();
    handleResponse(res, 200, true, users, "Users fetched successfully");
  } catch (err) {
    handleServiceError(err, res, next);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const user = await getUserByIdBusinessService(req.params.id);
    handleResponse(res, 200, true, user, "User fetched successfully");
  } catch (err) {
    handleServiceError(err, res, next);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const deletedUser = await deleteUserBusinessService(req.params.id);
    handleResponse(res, 200, true, deletedUser, "User deleted successfully");
  } catch (err) {
    handleServiceError(err, res, next);
  }
};

// Update own credentials (requires current password)
export const updateOwnCredentials = async (req, res, next) => {
  try {
    const { current_password, ...updates } = req.body;
    const userId = req.user.userId; // From authentication middleware

    const result = await updateOwnCredentialsBusinessService(userId, current_password, updates);
    
    // Set new token in cookie
    res.cookie("token", result.token, getCookieConfig());
    
    handleResponse(res, 200, true, result, "Credentials updated successfully");
  } catch (err) {
    handleServiceError(err, res, next);
  }
};

// Admin update any user's credentials (no current password needed)
export const adminUpdateCredentials = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;
    const updates = req.body;
    const currentUserId = req.user.userId; // Current admin's ID

    console.log(`Admin Update - Target: ${targetUserId}, Current Admin: ${currentUserId}`);
    
    const result = await adminUpdateCredentialsBusinessService(targetUserId, updates, currentUserId);
    
    // If admin updated their own account and token was generated
    if (result.token) {
      res.cookie("token", result.token, getCookieConfig());
      console.log("New token generated and set in cookie");
    }
    
    handleResponse(res, 200, true, result, "User credentials updated successfully by admin");
  } catch (err) {
    handleServiceError(err, res, next);
  }
};
