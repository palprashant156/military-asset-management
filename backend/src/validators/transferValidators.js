import { z } from 'zod';

export const createTransferSchema = z.object({
  sourceBaseId: z.number().int().positive('Source Base ID must be a positive integer'),
  destinationBaseId: z.number().int().positive('Destination Base ID must be a positive integer'),
  equipmentTypeId: z.number().int().positive('Equipment Type ID must be a positive integer'),
  quantity: z.number().int().positive('Quantity must be greater than 0'),
}).refine((data) => data.sourceBaseId !== data.destinationBaseId, {
  message: 'Source and destination bases cannot be the same',
  path: ['destinationBaseId'],
});
