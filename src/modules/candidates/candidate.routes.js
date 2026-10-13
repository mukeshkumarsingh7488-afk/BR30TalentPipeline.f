const express = require("express");

const candidateController = require("./candidate.controller");
const { requireHR } = require("../auth/auth.middleware");

const router = express.Router();

router.use(requireHR);

router.get("/", candidateController.listCandidates);
router.get("/:id", candidateController.getCandidate);

module.exports = router;
