const Joi = require("joi");

const validateRequest = (schema) => {
  return async (req, res, next) => {
    try {
      const { error, value } = schema.validate(req.body, {
        abortEarly: false,
      });

      if (error) {
        const details = error.details.map((d) => ({
          field: d.path.join("."),
          message: d.message,
        }));
        return res.status(400).json({
          success: false,
          message: "Validation error",
          details,
        });
      }

      req.validatedData = value;
      return next();
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: "Validation middleware error",
        error: err.message,
      });
    }
  };
};

// Schemas
const registerSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  email: Joi.string()
    .email()
    .required(),
  password: Joi.string().min(6).required(),
});

const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required(),
  password: Joi.string().required(),
});

const taskSchema = Joi.object({
  title: Joi.string().max(100).required(),
  description: Joi.string().max(500),
  priority: Joi.string()
    .valid("Low", "Medium", "High")
    .default("Medium"),
  status: Joi.string()
    .valid("Pending", "In Progress", "Completed")
    .default("Pending"),
  deadline: Joi.date(),
  tags: Joi.array().items(Joi.string()),
  recurring: Joi.object({
    enabled: Joi.boolean(),
    frequency: Joi.string().valid("daily", "weekly"),
  }),
});

const updateTaskSchema = Joi.object({
  title: Joi.string().max(100),
  description: Joi.string().max(500),
  priority: Joi.string().valid("Low", "Medium", "High"),
  status: Joi.string().valid("Pending", "In Progress", "Completed"),
  deadline: Joi.date(),
  tags: Joi.array().items(Joi.string()),
}).min(1);

module.exports = {
  validateRequest,
  registerSchema,
  loginSchema,
  taskSchema,
  updateTaskSchema,
};
