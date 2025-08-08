import {
  getAllUsersService as getAllUsersModel,
  getUserByIdService as getUserByIdModel,
  createUserService as createUserModel,
  deleteUserService as deleteUserModel,
  loginUserService as loginUserModel,
  updateOwnCredentialsService as updateOwnCredentialsModel,
  adminUpdateCredentialsService as adminUpdateCredentialsModel,
} from "../models/userModel.js";
import { generateToken } from "../middlewares/authentication.js";

/**
 * User Service Layer
 * Contains business logic for user operations
 * Separates business logic from HTTP request/response handling
 */


export class UserNotFoundError extends Error {
  constructor(message = "User not found") {
    super(message);
    this.name = "UserNotFoundError";
    this.statusCode = 404;
  }
}

export class InvalidCredentialsError extends Error {
  constructor(message = "Invalid credentials") {
    super(message);
    this.name = "InvalidCredentialsError";
    this.statusCode = 401;
  }
}

export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized access") {
    super(message);
    this.name = "UnauthorizedError";
    this.statusCode = 403;
  }
}

export class ValidationError extends Error {
  constructor(message = "Validation failed") {
    super(message);
    this.name = "ValidationError";
    this.statusCode = 400;
  }
}




const normalizeUserFields = (user) => {
  if (!user) return null;
  
  return {
    user_id: user.user_id || user.staff_id,
    user_name: user.user_name || user.staff_name,
    role_id: user.role_id,
    email: user.email,
    phone: user.phone,
    created_at: user.created_at,
    updated_at: user.updated_at
  };
};


const generateUserToken = (user) => {
  const normalizedUser = normalizeUserFields(user);
  
  return generateToken({
    userId: normalizedUser.user_id,
    user_name: normalizedUser.user_name,
    role_id: normalizedUser.role_id,
  });
};

export const createUserService = async (userData) => {
  try {
    const newUser = await createUserModel(userData);
    return normalizeUserFields(newUser);
  } catch (error) {
    if (error.code === '23505') {
      throw new ValidationError("Username or email already exists");
    }
    throw error;
  }
};

export const createAdminBypassService = async (userData, bypassKey) => {
  // Security validation
  if (bypassKey !== "TEMP_ADMIN_SETUP_2025") {
    throw new UnauthorizedError("Invalid bypass key");
  }
  
  try {
    // Force admin role
    const adminData = { 
      ...userData, 
      role_id: 1 // Admin role
    };
    
    const newAdmin = await createUserModel(adminData);
    return normalizeUserFields(newAdmin);
  } catch (error) {
    if (error.code === '23505') {
      throw new ValidationError("Admin username already exists");
    }
    throw error;
  }
};


export const authenticateUserService = async (user_name, password) => {
  try {
    const user = await loginUserModel(user_name, password);
    
    if (!user) {
      throw new InvalidCredentialsError("Invalid username or password");
    }
    
    const normalizedUser = normalizeUserFields(user);
    const token = generateUserToken(normalizedUser);
    
    return {
      user: {
        user_id: normalizedUser.user_id,
        user_name: normalizedUser.user_name,
        role_id: normalizedUser.role_id,
      },
      token,
      fullUser: normalizedUser
    };
  } catch (error) {
    if (error instanceof InvalidCredentialsError) {
      throw error;
    }
    throw new Error("Authentication service error");
  }
};


export const refreshUserTokenService = async (userId) => {
  try {
    const user = await getUserByIdModel(userId);
    
    if (!user) {
      throw new UserNotFoundError();
    }
    
    const normalizedUser = normalizeUserFields(user);
    const newToken = generateUserToken(normalizedUser);
    
    return {
      user: {
        user_id: normalizedUser.user_id,
        user_name: normalizedUser.user_name,
        role_id: normalizedUser.role_id,
        email: normalizedUser.email,
        phone: normalizedUser.phone
      },
      token: newToken
    };
  } catch (error) {
    if (error instanceof UserNotFoundError) {
      throw error;
    }
    throw new Error("Token refresh service error");
  }
};


export const getAllUsersBusinessService = async () => {
  try {
    const users = await getAllUsersModel();
    return users.map(user => normalizeUserFields(user));
  } catch (error) {
    throw new Error("Failed to fetch users");
  }
};


export const getUserByIdBusinessService = async (userId) => {
  try {
    const user = await getUserByIdModel(userId);
    
    if (!user) {
      throw new UserNotFoundError();
    }
    
    return normalizeUserFields(user);
  } catch (error) {
    if (error instanceof UserNotFoundError) {
      throw error;
    }
    throw new Error("Failed to fetch user");
  }
};


export const deleteUserBusinessService = async (userId) => {
  try {
    const deletedUser = await deleteUserModel(userId);
    
    if (!deletedUser) {
      throw new UserNotFoundError();
    }
    
    return normalizeUserFields(deletedUser);
  } catch (error) {
    if (error instanceof UserNotFoundError) {
      throw error;
    }
    throw new Error("Failed to delete user");
  }
};


export const updateOwnCredentialsBusinessService = async (userId, currentPassword, updates) => {
  try {
    const updatedUser = await updateOwnCredentialsModel(userId, currentPassword, updates);
    const normalizedUser = normalizeUserFields(updatedUser);
    const newToken = generateUserToken(normalizedUser);
    
    return {
      user: normalizedUser,
      token: newToken
    };
  } catch (error) {
    if (error.message === 'Current password is incorrect') {
      throw new ValidationError("Current password is incorrect");
    }
    if (error.message === 'User not found') {
      throw new UserNotFoundError();
    }
    throw new Error("Failed to update credentials");
  }
};


export const adminUpdateCredentialsBusinessService = async (targetUserId, updates, currentAdminId) => {
  try {
    const updatedUser = await adminUpdateCredentialsModel(targetUserId, updates);
    const normalizedUser = normalizeUserFields(updatedUser);
    
    let result = { user: normalizedUser };
    
    // If admin is updating their own account, generate new token
    if (parseInt(targetUserId) === parseInt(currentAdminId)) {
      const newToken = generateUserToken(normalizedUser);
      result.token = newToken;
      result.tokenUpdated = true;
    }
    
    return result;
  } catch (error) {
    if (error.message === 'User not found') {
      throw new UserNotFoundError();
    }
    if (error.message === 'No fields to update') {
      throw new ValidationError("No fields to update");
    }
    throw new Error("Failed to update user credentials");
  }
};


export const getCookieConfig = () => ({
  httpOnly: false,
  secure: process.env.NODE_ENV === "production",
  sameSite: "Strict",
  maxAge: 24 * 60 * 60 * 1000, // 1 day
});
