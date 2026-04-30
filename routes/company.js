var express = require("express");
var router = express.Router();
const { createCompany, fetchAllCompanies, deleteCompany } = require("../controller/company");
const authMiddleware = require("../middleware/auth");

router.post("/create", authMiddleware, createCompany);
router.get("/", fetchAllCompanies);
router.delete("/:id", authMiddleware, deleteCompany);

module.exports = router;
