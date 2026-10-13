const { z } = require("zod");

const optionalUrl = z
  .string()
  .trim()
  .max(2048)
  .refine((value) => {
    if (!value) return true;

    try {
      const url = new URL(value);
      return url.protocol === "https:" || url.protocol === "http:";
    } catch {
      return false;
    }
  }, "Please provide a valid HTTP or HTTPS URL.")
  .optional()
  .default("");

const listCandidatesSchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().max(150).optional().default(""),
    sortBy: z.enum(["fullName", "createdAt", "updatedAt"]).default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  })
  .strict();

const candidateIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid candidate ID.");

const candidateProfileSchema = z
  .object({
    fullName: z.string().trim().min(2).max(120),
    email: z.string().trim().email().max(254),
    mobile: z.string().trim().min(7).max(25),
    location: z.string().trim().max(200).optional().default(""),
    githubUrl: optionalUrl,
    portfolioUrl: optionalUrl,
    linkedinUrl: optionalUrl,
    skills: z.array(z.string().trim().min(1).max(100)).max(50).default([]),
    experienceYears: z.coerce.number().min(0).max(60).default(0),
    currentCompany: z.string().trim().max(200).optional().default(""),
    education: z
      .array(
        z
          .object({
            qualification: z.string().trim().max(150).optional().default(""),
            institution: z.string().trim().max(200).optional().default(""),
            fieldOfStudy: z.string().trim().max(150).optional().default(""),
            graduationYear: z.coerce.number().int().min(1950).max(2100).optional(),
          })
          .strict()
      )
      .max(10)
      .default([]),
    projects: z
      .array(
        z
          .object({
            name: z.string().trim().max(150).optional().default(""),
            description: z.string().trim().max(1000).optional().default(""),
            url: optionalUrl,
            technologies: z.array(z.string().trim().min(1).max(100)).max(30).default([]),
          })
          .strict()
      )
      .max(20)
      .default([]),
  })
  .strict();

module.exports = {
  listCandidatesSchema,
  candidateIdSchema,
  candidateProfileSchema,
};
