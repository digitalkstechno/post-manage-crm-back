const express = require("express");
const router = express.Router();
const { createCompany, fetchAllCompanies, deleteCompany, updateCompany, getCompanyDropdown } = require("../controller/company");
const authMiddleware = require("../middleware/auth");

router.post("/create", authMiddleware, createCompany);
router.get("/", authMiddleware, fetchAllCompanies);
router.get("/dropdown", authMiddleware, getCompanyDropdown);
router.put("/:id", authMiddleware, updateCompany);
router.delete("/:id", authMiddleware, deleteCompany);

module.exports = router;
