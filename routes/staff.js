var express = require("express");
var router = express.Router();
const createUploader = require("../utils/multer");
const upload = createUploader("images/StaffProfileImages");
let {
  createStaff,
  loginStaff,
  fetchAllStaffs,
  fetchStaffById,
  staffUpdate,
  staffDelete,
  getCurrentStaff,
  fetchStaffDropdown,
} = require("../controller/staff");
const authMiddleware = require("../middleware/auth");

router.post("/create", createStaff);
router.post("/login", loginStaff);
router.get("/me", getCurrentStaff);
router.get("/dropdown", authMiddleware, fetchStaffDropdown);
router.get("/", fetchAllStaffs);
router.get("/:id", fetchStaffById);
router.put("/:id", staffUpdate);
router.delete("/:id",staffDelete);
module.exports = router;   
