var express = require("express");
var router = express.Router();

let {
  createSubmission,
  fetchAllSubmissions,
  fetchSubmissionById,
  updateSubmission,
  resubmitSubmission,
  deleteSubmission,
  getSubmissionStats,
} = require("../controller/submissions");

const authMiddleware = require("../middleware/auth");

router.post("/create", authMiddleware, createSubmission);
router.post("/:id/resubmit", authMiddleware, resubmitSubmission);
router.get("/stats", authMiddleware, getSubmissionStats);
router.get("/", authMiddleware, fetchAllSubmissions);
router.get("/:id", authMiddleware, fetchSubmissionById);
router.put("/:id", authMiddleware, updateSubmission);
router.delete("/:id", authMiddleware, deleteSubmission);

module.exports = router;