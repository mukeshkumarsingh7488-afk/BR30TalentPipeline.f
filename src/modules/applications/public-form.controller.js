const crypto = require("crypto");
const asyncHandler = require("../../utils/asyncHandler");
const PublicForm = require("./public-form.model");
const JobRole = require("../job-roles/job-role.model");
const Department = require("../departments/department.model");

const fail = (message, statusCode = 400) => { const error = new Error(message); error.statusCode = statusCode; throw error; };
const publicUrlData = (form) => ({
  id: form._id,
  publicId: form.publicId,
  title: form.title,
  description: form.description,
  jobRoleId: form.jobRoleId?._id || form.jobRoleId,
  jobRole: form.jobRoleId?.title || "",
  department: form.jobRoleId?.departmentId?.name || "",
  status: form.status,
  allowCoverLetter: form.allowCoverLetter,
  allowProfileImage: form.allowProfileImage,
  publicPath: `/f/${form.publicId}`,
  publishedAt: form.publishedAt,
  createdAt: form.createdAt,
});

const populateForm = (query) => query.populate({ path: "jobRoleId", select: "title isActive departmentId", populate: { path: "departmentId", select: "name isActive" } });

exports.list = asyncHandler(async (req, res) => {
  const forms = await populateForm(PublicForm.find().sort({ createdAt: -1 }));
  res.json({ success: true, data: forms.map(publicUrlData) });
});

exports.create = asyncHandler(async (req, res) => {
  const title = String(req.body.title || "").trim();
  const description = String(req.body.description || "").trim();
  const jobRoleId = String(req.body.jobRoleId || "");
  if (title.length < 3 || title.length > 120) fail("Form title must be between 3 and 120 characters.");
  if (description.length > 2000) fail("Description cannot exceed 2000 characters.");
  const role = await JobRole.findOne({ _id: jobRoleId, isActive: true }).lean();
  if (!role) fail("Select an active job role.");
  const department = await Department.findOne({ _id: role.departmentId, isActive: true }).lean();
  if (!department) fail("The selected job role's department is inactive.");

  let form;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const publicId = String(crypto.randomInt(10000000, 100000000));
    try {
      form = await PublicForm.create({
        publicId, title, description, jobRoleId,
        allowCoverLetter: req.body.allowCoverLetter !== false,
        allowProfileImage: req.body.allowProfileImage !== false,
        status: "DRAFT", createdBy: req.user.id, updatedBy: req.user.id,
      });
      break;
    } catch (error) {
      if (error.code !== 11000 || attempt === 4) throw error;
    }
  }
  const populated = await populateForm(PublicForm.findById(form._id));
  res.status(201).json({ success: true, message: "Form created as draft.", data: publicUrlData(populated) });
});

exports.update = asyncHandler(async (req, res) => {
  const form = await PublicForm.findById(req.params.id);
  if (!form) fail("Form not found.", 404);
  const { title, description, jobRoleId, allowCoverLetter, allowProfileImage } = req.body;
  if (title !== undefined) {
    const clean = String(title).trim();
    if (clean.length < 3 || clean.length > 120) fail("Form title must be between 3 and 120 characters.");
    form.title = clean;
  }
  if (description !== undefined) {
    const clean = String(description).trim();
    if (clean.length > 2000) fail("Description cannot exceed 2000 characters.");
    form.description = clean;
  }
  if (jobRoleId !== undefined) {
    const role = await JobRole.findOne({ _id: jobRoleId, isActive: true }).lean();
    if (!role) fail("Select an active job role.");
    const department = await Department.findOne({ _id: role.departmentId, isActive: true }).lean();
    if (!department) fail("The selected job role's department is inactive.");
    form.jobRoleId = jobRoleId;
  }
  if (allowCoverLetter !== undefined) form.allowCoverLetter = Boolean(allowCoverLetter);
  if (allowProfileImage !== undefined) form.allowProfileImage = Boolean(allowProfileImage);
  if (form.status === "PUBLISHED" && jobRoleId) fail("Pause or unpublish this form before changing its job role.");
  form.updatedBy = req.user.id;
  await form.save();
  const populated = await populateForm(PublicForm.findById(form._id));
  res.json({ success: true, message: "Form updated.", data: publicUrlData(populated) });
});

exports.setStatus = asyncHandler(async (req, res) => {
  const form = await PublicForm.findById(req.params.id);
  if (!form) fail("Form not found.", 404);
  const status = String(req.body.status || "").toUpperCase();
  if (!["DRAFT", "PUBLISHED", "PAUSED"].includes(status)) fail("Invalid form status.");
  if (status === "PUBLISHED") {
    const role = await JobRole.findOne({ _id: form.jobRoleId, isActive: true }).lean();
    if (!role) fail("The linked job role is inactive. Select an active role before publishing.");
    const department = await Department.findOne({ _id: role.departmentId, isActive: true }).lean();
    if (!department) fail("The linked department is inactive. Activate it before publishing.");
    form.publishedAt = new Date();
  }
  form.status = status;
  form.updatedBy = req.user.id;
  await form.save();
  const populated = await populateForm(PublicForm.findById(form._id));
  res.json({ success: true, message: status === "PUBLISHED" ? "Form published." : status === "PAUSED" ? "Form paused." : "Form saved as draft.", data: publicUrlData(populated) });
});

exports.remove = asyncHandler(async (req, res) => {
  const form = await PublicForm.findByIdAndDelete(req.params.id);
  if (!form) fail("Form not found.", 404);
  res.json({ success: true, message: "Form deleted." });
});

exports.getPublic = asyncHandler(async (req, res) => {
  const form = await populateForm(PublicForm.findOne({ publicId: req.params.publicId, status: "PUBLISHED" }));
  if (!form || !form.jobRoleId?.isActive || !form.jobRoleId?.departmentId?.isActive) fail("This form is not available or is no longer accepting responses.", 404);
  res.json({ success: true, data: publicUrlData(form) });
});

exports.assertPublishedForm = async (publicId, jobRoleId) => {
  if (!publicId) return null;
  const form = await PublicForm.findOne({ publicId: String(publicId), status: "PUBLISHED" }).lean();
  if (!form) fail("This public form is no longer accepting responses.", 410);
  if (String(form.jobRoleId) !== String(jobRoleId)) fail("The selected job role does not match this form.", 400);
  return form;
};
