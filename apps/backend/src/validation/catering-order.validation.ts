import Joi from 'joi';

const CATERING_ORDER_STATUSES = [
  'DRAFT',
  'INQUIRY',
  'QUOTED',
  'CONFIRMED',
  'IN_PREPARATION',
  'READY',
  'DELIVERED',
  'COMPLETED',
  'CANCELLED',
] as const;

const DELIVERY_TYPES = ['PICKUP', 'DELIVERY', 'ON_SITE'] as const;
const DISCOUNT_TYPES = ['PERCENTAGE', 'AMOUNT'] as const;

const orderItemSchema = Joi.object({
  dishId: Joi.string().uuid().required(),
  quantity: Joi.number().integer().min(1).required(),
  unitPrice: Joi.number().min(0).required(),
  note: Joi.string().max(500).optional().allow('', null),
});

const orderExtraSchema = Joi.object({
  name: Joi.string().max(255).required(),
  description: Joi.string().max(1000).optional().allow('', null),
  quantity: Joi.number().integer().min(1).required(),
  unitPrice: Joi.number().min(0).required(),
});

export const createOrderSchema = Joi.object({
  clientId: Joi.string().uuid().required(),
  templateId: Joi.string().uuid().optional().allow(null),
  packageId: Joi.string().uuid().optional().allow(null),
  deliveryType: Joi.string().valid(...DELIVERY_TYPES).optional(),
  eventName: Joi.string().max(255).optional().allow('', null),
  eventDate: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .allow(null),
  eventTime: Joi.string()
    .pattern(/^\d{2}:\d{2}$/)
    .optional()
    .allow(null),
  eventLocation: Joi.string().max(255).optional().allow('', null),
  guestsCount: Joi.number().integer().min(0).optional(),
  deliveryAddress: Joi.string().max(1000).optional().allow('', null),
  deliveryNotes: Joi.string().max(1000).optional().allow('', null),
  deliveryDate: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .allow(null),
  deliveryTime: Joi.string()
    .pattern(/^\d{2}:\d{2}$/)
    .optional()
    .allow(null),
  discountType: Joi.string().valid(...DISCOUNT_TYPES).optional().allow(null),
  discountValue: Joi.number().min(0).optional().allow(null),
  discountReason: Joi.string().max(500).optional().allow('', null),
  contactName: Joi.string().max(200).optional().allow('', null),
  contactPhone: Joi.string().max(20).optional().allow('', null),
  contactEmail: Joi.string().email().max(255).optional().allow('', null),
  notes: Joi.string().max(5000).optional().allow('', null),
  internalNotes: Joi.string().max(5000).optional().allow('', null),
  specialRequirements: Joi.string().max(5000).optional().allow('', null),
  quoteExpiresAt: Joi.string().isoDate().optional().allow(null),
  items: Joi.array().items(orderItemSchema).optional(),
  extras: Joi.array().items(orderExtraSchema).optional(),
});

export const updateOrderSchema = Joi.object({
  templateId: Joi.string().uuid().optional().allow(null),
  packageId: Joi.string().uuid().optional().allow(null),
  deliveryType: Joi.string().valid(...DELIVERY_TYPES).optional(),
  eventName: Joi.string().max(255).optional().allow('', null),
  eventDate: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .allow(null),
  eventTime: Joi.string()
    .pattern(/^\d{2}:\d{2}$/)
    .optional()
    .allow(null),
  eventLocation: Joi.string().max(255).optional().allow('', null),
  guestsCount: Joi.number().integer().min(0).optional(),
  deliveryAddress: Joi.string().max(1000).optional().allow('', null),
  deliveryNotes: Joi.string().max(1000).optional().allow('', null),
  deliveryDate: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .allow(null),
  deliveryTime: Joi.string()
    .pattern(/^\d{2}:\d{2}$/)
    .optional()
    .allow(null),
  discountType: Joi.string().valid(...DISCOUNT_TYPES).optional().allow(null),
  discountValue: Joi.number().min(0).optional().allow(null),
  discountReason: Joi.string().max(500).optional().allow('', null),
  contactName: Joi.string().max(200).optional().allow('', null),
  contactPhone: Joi.string().max(20).optional().allow('', null),
  contactEmail: Joi.string().email().max(255).optional().allow('', null),
  notes: Joi.string().max(5000).optional().allow('', null),
  internalNotes: Joi.string().max(5000).optional().allow('', null),
  specialRequirements: Joi.string().max(5000).optional().allow('', null),
  quoteExpiresAt: Joi.string().isoDate().optional().allow(null),
  items: Joi.array().items(orderItemSchema).optional(),
  extras: Joi.array().items(orderExtraSchema).optional(),
  changeReason: Joi.string().max(500).optional().allow('', null),
});

export const changeStatusSchema = Joi.object({
  status: Joi.string().valid(...CATERING_ORDER_STATUSES).required(),
  reason: Joi.string().max(500).optional().allow('', null),
});

export const createDepositSchema = Joi.object({
  amount: Joi.number().positive().required(),
  dueDate: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .required(),
  title: Joi.string().max(255).optional().allow('', null),
  description: Joi.string().max(1000).optional().allow('', null),
  internalNotes: Joi.string().max(1000).optional().allow('', null),
});
