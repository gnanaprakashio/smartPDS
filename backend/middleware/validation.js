const Joi = require('joi');

const schemas = {
  userRegister: Joi.object({
    rationCardNumber: Joi.string().min(5).required(),
    name: Joi.string().min(2).max(100).required(),
    phone: Joi.string().pattern(/^[6-9]\d{9}$/).required(),
    cardType: Joi.string().valid('AAY', 'PHH', 'NPHH', 'NPHH_S').required()
  }),

  inventoryUpdate: Joi.object({
    shopId: Joi.string().required(),
    riceStock: Joi.number().min(0).optional(),
    sugarStock: Joi.number().min(0).optional(),
    wheatStock: Joi.number().min(0).optional(),
    oilStock: Joi.number().min(0).optional(),
    toorDalStock: Joi.number().min(0).optional(),
    reschedule: Joi.boolean().optional()
  }),

  slotCreate: Joi.object({
    slotDate: Joi.date().min('now').required(),
    startTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
    endTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
    maxUsers: Joi.number().integer().min(1).max(100).required()
  }),

  otpSend: Joi.object({
    phone: Joi.string().pattern(/^[6-9]\d{9}$/).required()
  }),

  otpVerify: Joi.object({
    phone: Joi.string().pattern(/^[6-9]\d{9}$/).required(),
    otp: Joi.string().length(6).required()
  }),

  reputationUpdate: Joi.object({
    userId: Joi.string().uuid().required(),
    changeReason: Joi.string().required(),
    scoreChange: Joi.number().min(-50).max(50).required()
  }),

  rationsVerify: Joi.object({
    slotId: Joi.string().uuid().required(),
    otp: Joi.string().length(6).required()
  })
};

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
};

module.exports = { validate, schemas };

