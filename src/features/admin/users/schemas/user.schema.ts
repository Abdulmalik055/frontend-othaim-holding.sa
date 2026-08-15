import { z } from 'zod'

export const userCreateSchema = z.object({
  name:     z.string().trim().min(1),
  email:    z.string().trim().email(),
  password: z.string().min(8),
  role:     z.string().trim().min(1),
})

export const userUpdateSchema = z.object({
  name:     z.string().trim().min(1).optional(),
  email:    z.string().trim().email().optional(),
  password: z.string().min(8).optional(),
  role:     z.string().trim().min(1).optional(),
})

export type UserCreateData = z.infer<typeof userCreateSchema>
export type UserUpdateData = z.infer<typeof userUpdateSchema>
