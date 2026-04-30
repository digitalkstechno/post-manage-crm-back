const express = require("express");
const router = express.Router();
const { createCompany, fetchAllCompanies, deleteCompany } = require("../controller/company");
const authMiddleware = require("../middleware/auth");

router.post("/create", authMiddleware, createCompany);
router.get("/", authMiddleware, fetchAllCompanies);
router.delete("/:id", authMiddleware, deleteCompany);

module.exports = router;
