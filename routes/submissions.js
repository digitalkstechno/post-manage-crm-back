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
  getAdminDashboardStats,
  postToSocial,
  getSubmissionDropdown,
} = require("../controller/submissions");

const authMiddleware = require("../middleware/auth");
const createUploader = require("../utils/multer");
const upload = createUploader("images/at");

router.post("/create", authMiddleware, createSubmission);
router.post("/:id/resubmit", authMiddleware, resubmitSubmission);
router.get("/stats", authMiddleware, getSubmissionStats);
router.get("/dashboard-stats", authMiddleware, getAdminDashboardStats);
router.get("/dropdown", authMiddleware, getSubmissionDropdown);
router.get("/", authMiddleware, fetchAllSubmissions);
router.get("/:id", authMiddleware, fetchSubmissionById);
router.put("/:id", authMiddleware, updateSubmission);
router.post("/:id/post-social", authMiddleware, postToSocial);
router.delete("/:id", authMiddleware, deleteSubmission);

module.exports = router;