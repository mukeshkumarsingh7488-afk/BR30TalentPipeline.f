const { z } = require("zod");

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid ID.");

const applicationSubmissionSchema = z
  .object({
    jobRoleId: objectIdSchema,
    coverLetter: z.string().trim().max(5000).optional().default(""),
    expectedSalary: z.preprocess((value) => (value === "" || value === undefined || value === null ? null : Number(value)), z.number().min(0).max(1000000000000).nullable()),
    salaryCurrency: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z]{3}$/)
      .optional()
      .default("INR"),
  })
  .strict();

const listApplicationsSchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().max(150).optional().default(""),
    status: z.enum(["applied", "screening", "shortlisted", "interview", "offered", "hired", "rejected", "withdrawn", "all"]).default("all"),
    jobRoleId: objectIdSchema.optional(),
    departmentId: objectIdSchema.optional(),
    sortBy: z.enum(["createdAt", "updatedAt", "status"]).default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  })
  .strict();

const applicationIdSchema = objectIdSchema;

const updateApplicationStatusSchema = z
  .object({
    status: z.enum(["screening", "shortlisted", "interview", "offered", "hired", "rejected", "withdrawn"]),
    note: z.string().trim().max(1000).optional().default(""),
  })
  .strict();

const addInternalNoteSchema = z
  .object({
    text: z.string().trim().min(1).max(3000),
  })
  .strict();

module.exports = {
  applicationSubmissionSchema,
  listApplicationsSchema,
  applicationIdSchema,
  updateApplicationStatusSchema,
  addInternalNoteSchema,
};
