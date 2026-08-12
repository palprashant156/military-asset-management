import { z } from 'zod';

export const createExpenditureSchema = z.object({
  baseId: z.number().int().positive('Base ID must be a positive integer'),
  equipmentTypeId: z.number().int().positive('Equipment Type ID must be a positive integer'),
  quantity: z.number().int().positive('Quantity must be greater than 0'),
  description: z.string().min(1, 'Description is required'),
  date: z.string().datetime({ offset: true }).optional()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format').optional()),
});
