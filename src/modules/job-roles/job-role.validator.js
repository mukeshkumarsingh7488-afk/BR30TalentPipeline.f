const { z } = require("zod");

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid ID.");

const titleSchema = z.string().trim().min(2, "Job role title must contain at least 2 characters.").max(120, "Job role title cannot exceed 120 characters.");

const descriptionSchema = z.string().trim().max(5000, "Description cannot exceed 5000 characters.");

const responsibilitySchema = z.array(z.string().trim().min(1).max(500)).max(30).optional();

const skillsSchema = z.array(z.string().trim().min(1).max(100)).max(50);

const experienceSchema = z.number().min(0).max(60);

const salarySchema = z.number().min(0).max(1000000000000);

const employmentTypeSchema = z.enum(["full_time", "part_time", "contract", "internship", "freelance"]);

const workModeSchema = z.enum(["onsite", "hybrid", "remote"]);

const createJobRoleSchema = z
  .object({
    departmentId: objectIdSchema,
    title: titleSchema,
    description: descriptionSchema.optional().default(""),
    responsibilities: responsibilitySchema.default([]),
    requiredSkills: skillsSchema.default([]),
    preferredSkills: skillsSchema.optional().default([]),
    minExperienceYears: experienceSchema.optional().default(0),
    maxExperienceYears: experienceSchema.nullable().optional().default(null),
    employmentType: employmentTypeSchema.optional().default("full_time"),
    workMode: workModeSchema.optional().default("hybrid"),
    location: z.string().trim().max(200).optional().default(""),
    salaryMin: salarySchema.nullable().optional().default(null),
    salaryMax: salarySchema.nullable().optional().default(null),
    currency: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z]{3}$/)
      .optional()
      .default("INR"),
    isActive: z.boolean().optional().default(true),
  })
  .strict()
  .refine((data) => data.maxExperienceYears === null || data.maxExperienceYears >= data.minExperienceYears, {
    message: "Maximum experience must be greater than or equal to minimum experience.",
    path: ["maxExperienceYears"],
  })
  .refine((data) => data.salaryMin === null || data.salaryMax === null || data.salaryMax >= data.salaryMin, {
    message: "Maximum salary must be greater than or equal to minimum salary.",
    path: ["salaryMax"],
  });

const updateJobRoleSchema = z
  .object({
    departmentId: objectIdSchema.optional(),
    title: titleSchema.optional(),
    description: descriptionSchema.optional(),
    responsibilities: responsibilitySchema,
    requiredSkills: skillsSchema.optional(),
    preferredSkills: skillsSchema.optional(),
    minExperienceYears: experienceSchema.optional(),
    maxExperienceYears: experienceSchema.nullable().optional(),
    employmentType: employmentTypeSchema.optional(),
    workMode: workModeSchema.optional(),
    location: z.string().trim().max(200).optional(),
    salaryMin: salarySchema.nullable().optional(),
    salaryMax: salarySchema.nullable().optional(),
    currency: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z]{3}$/)
      .optional(),
    isActive: z.boolean().optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Provide at least one field to update.",
  })
  .refine((data) => data.minExperienceYears === undefined || data.maxExperienceYears === undefined || data.maxExperienceYears === null || data.maxExperienceYears >= data.minExperienceYears, {
    message: "Maximum experience must be greater than or equal to minimum experience.",
    path: ["maxExperienceYears"],
  })
  .refine((data) => data.salaryMin === undefined || data.salaryMax === undefined || data.salaryMin === null || data.salaryMax === null || data.salaryMax >= data.salaryMin, {
    message: "Maximum salary must be greater than or equal to minimum salary.",
    path: ["salaryMax"],
  });

const listJobRolesSchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().max(120).optional().default(""),
    departmentId: objectIdSchema.optional(),
    status: z.enum(["active", "inactive", "all"]).default("all"),
    employmentType: employmentTypeSchema.optional(),
    workMode: workModeSchema.optional(),
    sortBy: z.enum(["title", "createdAt", "updatedAt"]).default("title"),
    sortOrder: z.enum(["asc", "desc"]).default("asc"),
  })
  .strict();

const publicJobRolesSchema = z
  .object({
    departmentId: objectIdSchema.optional(),
    search: z.string().trim().max(120).optional().default(""),
    employmentType: employmentTypeSchema.optional(),
    workMode: workModeSchema.optional(),
  })
  .strict();

const jobRoleIdSchema = objectIdSchema;

const setJobRoleStatusSchema = z
  .object({
    isActive: z.boolean(),
  })
  .strict();

module.exports = {
  createJobRoleSchema,
  updateJobRoleSchema,
  listJobRolesSchema,
  publicJobRolesSchema,
  jobRoleIdSchema,
  setJobRoleStatusSchema,
};
