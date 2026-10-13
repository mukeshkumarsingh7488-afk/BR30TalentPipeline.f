const { z } = require("zod");

const nameSchema = z.string().trim().min(2, "Department name must contain at least 2 characters.").max(100, "Department name cannot exceed 100 characters.");

const descriptionSchema = z.string().trim().max(1000, "Description cannot exceed 1000 characters.");

const createDepartmentSchema = z
  .object({
    name: nameSchema,
    description: descriptionSchema.optional().default(""),
    isActive: z.boolean().optional().default(true),
  })
  .strict();

const updateDepartmentSchema = z
  .object({
    name: nameSchema.optional(),
    description: descriptionSchema.optional(),
    isActive: z.boolean().optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Provide at least one field to update.",
  });

const departmentIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid department ID.");

const listDepartmentsSchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().max(100).optional().default(""),
    status: z.enum(["active", "inactive", "all"]).default("all"),
    sortBy: z.enum(["name", "createdAt", "updatedAt"]).default("name"),
    sortOrder: z.enum(["asc", "desc"]).default("asc"),
  })
  .strict();

const setDepartmentStatusSchema = z
  .object({
    isActive: z.boolean(),
  })
  .strict();

module.exports = {
  createDepartmentSchema,
  updateDepartmentSchema,
  departmentIdSchema,
  listDepartmentsSchema,
  setDepartmentStatusSchema,
};
