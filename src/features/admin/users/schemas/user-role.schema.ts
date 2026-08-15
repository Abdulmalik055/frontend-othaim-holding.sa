import { z } from 'zod'

export const userRoleSchema = z.object({
  name:        z.string().trim().min(1),
  permissions: z.array(z.string()).min(1),
})

export type UserRoleFormData = z.infer<typeof userRoleSchema>
