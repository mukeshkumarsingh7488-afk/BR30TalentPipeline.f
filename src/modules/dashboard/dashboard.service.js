const mongoose = require("mongoose");
const Application = require("../applications/application.model");
const Candidate = require("../candidates/candidate.model");
const JobRole = require("../job-roles/job-role.model");
const Department = require("../departments/department.model");

const APPLICATION_STATUSES = ["applied", "screening", "shortlisted", "interview", "offered", "hired", "rejected", "withdrawn"];

const getDashboardOverview = async () => {
  const [totalCandidates, totalApplications, activeJobRoles, activeDepartments, statusCounts, departmentCounts, recentApplications] = await Promise.all([
    Candidate.countDocuments(),
    Application.countDocuments(),
    JobRole.countDocuments({ isActive: true }),
    Department.countDocuments({ isActive: true }),

    Application.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]),

    Application.aggregate([
      {
        $group: {
          _id: "$departmentId",
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: Department.collection.name,
          localField: "_id",
          foreignField: "_id",
          as: "department",
        },
      },
      {
        $unwind: {
          path: "$department",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 0,
          departmentId: "$_id",
          departmentName: {
            $ifNull: ["$department.name", "Unknown department"],
          },
          count: 1,
        },
      },
      { $sort: { count: -1, departmentName: 1 } },
    ]),

    Application.find().sort({ submittedAt: -1, createdAt: -1 }).limit(10).populate("candidateId", "fullName email mobile").populate("jobRoleId", "title").populate("departmentId", "name").lean(),
  ]);

  const countsByStatus = Object.fromEntries(APPLICATION_STATUSES.map((status) => [status, 0]));

  for (const item of statusCounts) {
    if (Object.prototype.hasOwnProperty.call(countsByStatus, item._id)) {
      countsByStatus[item._id] = item.count;
    }
  }

  return {
    totals: {
      candidates: totalCandidates,
      applications: totalApplications,
      activeJobRoles,
      activeDepartments,
    },
    applicationsByStatus: countsByStatus,
    applicationsByDepartment: departmentCounts,
    recentApplications: recentApplications.map((item) => ({
      id: item._id,
      candidate: item.candidateId
        ? {
            id: item.candidateId._id,
            name: item.candidateId.fullName,
            email: item.candidateId.email,
            mobile: item.candidateId.mobile,
          }
        : null,
      jobRole: item.jobRoleId
        ? {
            id: item.jobRoleId._id,
            title: item.jobRoleId.title,
          }
        : null,
      department: item.departmentId
        ? {
            id: item.departmentId._id,
            name: item.departmentId.name,
          }
        : null,
      status: item.status,
      submittedAt: item.submittedAt || item.createdAt,
    })),
  };
};

const getApplicationStatusAnalytics = async () => {
  const [results] = await Application.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        applied: {
          $sum: { $cond: [{ $eq: ["$status", "applied"] }, 1, 0] },
        },
        screening: {
          $sum: { $cond: [{ $eq: ["$status", "screening"] }, 1, 0] },
        },
        shortlisted: {
          $sum: { $cond: [{ $eq: ["$status", "shortlisted"] }, 1, 0] },
        },
        interview: {
          $sum: { $cond: [{ $eq: ["$status", "interview"] }, 1, 0] },
        },
        offered: {
          $sum: { $cond: [{ $eq: ["$status", "offered"] }, 1, 0] },
        },
        hired: {
          $sum: { $cond: [{ $eq: ["$status", "hired"] }, 1, 0] },
        },
        rejected: {
          $sum: { $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] },
        },
        withdrawn: {
          $sum: { $cond: [{ $eq: ["$status", "withdrawn"] }, 1, 0] },
        },
      },
    },
  ]);

  return (
    results || {
      total: 0,
      applied: 0,
      screening: 0,
      shortlisted: 0,
      interview: 0,
      offered: 0,
      hired: 0,
      rejected: 0,
      withdrawn: 0,
    }
  );
};

const buildExportFilter = async (query = {}) => {
  const filter = {};

  if (query.status && query.status !== "all") {
    if (!APPLICATION_STATUSES.includes(query.status)) {
      const error = new Error("Invalid application status filter.");
      error.statusCode = 400;
      throw error;
    }
    filter.status = query.status;
  }

  if (query.jobRoleId) {
    if (!mongoose.isValidObjectId(query.jobRoleId)) {
      const error = new Error("Invalid job role ID.");
      error.statusCode = 400;
      throw error;
    }

    filter.jobRoleId = new mongoose.Types.ObjectId(query.jobRoleId);
  }

  if (query.departmentId) {
    if (!mongoose.isValidObjectId(query.departmentId)) {
      const error = new Error("Invalid department ID.");
      error.statusCode = 400;
      throw error;
    }

    filter.departmentId = new mongoose.Types.ObjectId(query.departmentId);
  }

  if (query.from || query.to) {
    filter.submittedAt = {};

    if (query.from) {
      const from = new Date(query.from);

      if (Number.isNaN(from.getTime())) {
        const error = new Error("Invalid from date.");
        error.statusCode = 400;
        throw error;
      }

      filter.submittedAt.$gte = from;
    }

    if (query.to) {
      const to = new Date(query.to);

      if (Number.isNaN(to.getTime())) {
        const error = new Error("Invalid to date.");
        error.statusCode = 400;
        throw error;
      }

      to.setUTCHours(23, 59, 59, 999);
      filter.submittedAt.$lte = to;
    }

    if (filter.submittedAt.$gte && filter.submittedAt.$lte && filter.submittedAt.$gte > filter.submittedAt.$lte) {
      const error = new Error("The from date must be before the to date.");
      error.statusCode = 400;
      throw error;
    }
  }

  if (query.search && String(query.search).trim()) {
    const search = String(query.search).trim().slice(0, 100);
    const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(safeSearch, "i");

    const candidates = await Candidate.find({
      $or: [{ fullName: regex }, { email: regex }, { mobile: regex }],
    })
      .select("_id")
      .limit(5000)
      .lean();

    const candidateIds = candidates.map((candidate) => candidate._id);

    filter.candidateId = { $in: candidateIds };
  }

  return filter;
};

const escapeCsv = (value) => {
  const text = value === null || value === undefined ? "" : String(value);
  const safeText = /^[\s]*[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safeText.replace(/"/g, '""')}"`;
};

const exportApplicationsCsv = async (query = {}) => {
  const filter = await buildExportFilter(query);

  const applications = await Application.find(filter).sort({ submittedAt: -1, createdAt: -1 }).limit(20000).populate("candidateId", "fullName email mobile location skills experienceYears").populate("jobRoleId", "title").populate("departmentId", "name").lean();

  const headers = ["Application ID", "Candidate Name", "Email", "Mobile", "Location", "Job Role", "Department", "Experience Years", "Skills", "Status", "Expected Salary", "Salary Currency", "Applied At"];

  const rows = applications.map((application) => [
    application._id,
    application.candidateId?.fullName,
    application.candidateId?.email,
    application.candidateId?.mobile,
    application.candidateId?.location,
    application.jobRoleId?.title,
    application.departmentId?.name,
    application.candidateId?.experienceYears,
    Array.isArray(application.candidateId?.skills) ? application.candidateId.skills.join(", ") : "",
    application.status,
    application.expectedSalary,
    application.salaryCurrency,
    application.submittedAt || application.createdAt,
  ]);

  return [headers, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\r\n");
};

module.exports = {
  getDashboardOverview,
  getApplicationStatusAnalytics,
  exportApplicationsCsv,
};
