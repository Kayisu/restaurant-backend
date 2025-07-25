import Joi from 'joi';

const userScheme = Joi.object({
  staff_name: Joi.string().min(3).max(50).required(),
  password: Joi.string().min(6).max(50).required(), // Raw password limit
  role_id: Joi.number().integer().min(1).required()
});

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

export default validateUser;
// This middleware validates the user input for creating or updating a user.