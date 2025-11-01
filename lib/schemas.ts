import { z } from 'zod'

// Item schemas
export const ItemCategory = z.enum(['ID', 'Gadget', 'Book', 'Clothing', 'Other'])
export const ItemStatus = z.enum(['lost', 'found', 'claimed', 'returned'])
export const Campus = z.enum(['TC', 'MC'])

export const createItemSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title too long'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(1000),
  category: ItemCategory,
  status: ItemStatus,
  location: z.string().min(2, 'Location is required').max(200),
  campus: Campus,
  photo: z.instanceof(File).optional().nullable(),
})

export const updateItemSchema = createItemSchema.partial().extend({
  id: z.number(),
})

export type CreateItemInput = z.infer<typeof createItemSchema>
export type UpdateItemInput = z.infer<typeof updateItemSchema>

// Claim schemas
export const ClaimStatus = z.enum(['pending', 'approved', 'rejected'])

export const createClaimSchema = z.object({
  item_id: z.number(),
  message: z.string().min(10, 'Please provide details about why this item is yours').max(500),
})

export const updateClaimSchema = z.object({
  id: z.number(),
  status: ClaimStatus,
})

export type CreateClaimInput = z.infer<typeof createClaimSchema>
export type UpdateClaimInput = z.infer<typeof updateClaimSchema>

// Flag schema
export const createFlagSchema = z.object({
  item_id: z.number(),
  reason: z.string().min(10, 'Please provide a reason for flagging').max(500),
})

export type CreateFlagInput = z.infer<typeof createFlagSchema>

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>

// Search/Filter schema
export const searchFiltersSchema = z.object({
  query: z.string().optional(),
  category: ItemCategory.optional(),
  status: ItemStatus.optional(),
  location: z.string().optional(),
  campus: Campus.optional(),
})

export type SearchFilters = z.infer<typeof searchFiltersSchema>
