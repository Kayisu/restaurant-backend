import Joi from 'joi';

const userScheme = Joi.object({
  staff_name: Joi.string().min(3).max(50).required(),
  password: Joi.string().min(6).max(50).required(), 
  role_id: Joi.number().integer().min(1).required(),
  email: Joi.string().email().optional().allow(null, ''),
  phone: Joi.string().optional().allow(null, '')
});

const loginScheme = Joi.object({
  staff_name: Joi.string().min(3).max(50).required(),
  password: Joi.string().min(6).max(50).required()
});

// Schema for updating own credentials (requires current password)
const updateOwnCredentialsScheme = Joi.object({
  current_password: Joi.string().min(6).max(50).required(),
  new_password: Joi.string().min(6).max(50).optional(),
  staff_name: Joi.string().min(3).max(50).optional(),
  email: Joi.string().email().optional().allow(null, ''),
  phone: Joi.string().optional().allow(null, '')
}).min(2); // At least current_password and one field to update

// Schema for admin updating any user's credentials (no current password needed)
const adminUpdateCredentialsScheme = Joi.object({
  staff_name: Joi.string().min(3).max(50).optional(),
  password: Joi.string().min(6).max(50).optional(),
  role_id: Joi.number().integer().min(1).optional(),
  email: Joi.string().email().optional().allow(null, ''),
  phone: Joi.string().optional().allow(null, '')
}).min(1); // At least one field to update

const validateUser = (req, res, next) => {
  const { error } = userScheme.validate(req.body);
  if (error) {
    return res.status(400).json({
      status: 400,
      message: error.details[0].message
    });
  }
  next();
};

const validateLogin = (req, res, next) => {
  const { error } = loginScheme.validate(req.body);
  if (error) {
    return res.status(400).json({
      status: 400,
      message: error.details[0].message
    });
  }
  next();
};

const validateUpdateOwnCredentials = (req, res, next) => {
  const { error } = updateOwnCredentialsScheme.validate(req.body);
  if (error) {
    return res.status(400).json({
      status: 400,
      message: error.details[0].message
    });
  }
  next();
};

const validateAdminUpdateCredentials = (req, res, next) => {
  const { error } = adminUpdateCredentialsScheme.validate(req.body);
  if (error) {
    return res.status(400).json({
      status: 400,
      message: error.details[0].message
    });
  }
  next();
};

export { 
  validateUser, 
  validateLogin, 
  validateUpdateOwnCredentials, 
  validateAdminUpdateCredentials 
};
// This middleware validates the user input for creating or updating a user.