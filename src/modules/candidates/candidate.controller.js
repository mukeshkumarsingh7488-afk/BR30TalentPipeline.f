const asyncHandler = require("../../utils/asyncHandler");
const candidateService = require("./candidate.service");

const { listCandidatesSchema, candidateIdSchema } = require("./candidate.validator");

const validate = (schema, data) => {
  const result = schema.safeParse(data);

  if (!result.success) {
    const error = new Error(result.error.issues.map((issue) => issue.message).join(" "));
    error.statusCode = 400;
    throw error;
  }

  return result.data;
};

const listCandidates = asyncHandler(async (req, res) => {
  const query = validate(listCandidatesSchema, req.query);
  const result = await candidateService.listCandidates(query);

  res.status(200).json({
    success: true,
    data: result.candidates,
    pagination: result.pagination,
  });
});

const getCandidate = asyncHandler(async (req, res) => {
  const id = validate(candidateIdSchema, req.params.id);
  const candidate = await candidateService.getCandidateById(id);

  res.status(200).json({
    success: true,
    data: candidate,
  });
});

module.exports = {
  listCandidates,
  getCandidate,
};
