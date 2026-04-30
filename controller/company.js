const Company = require("../model/company");

const createCompany = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ success: false, message: "Company name is required" });
    const company = await Company.create({ name, createdBy: req.user._id });
    res.status(201).json({ success: true, data: company });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ success: false, message: "Company already exists" });
    res.status(500).json({ success: false, message: error.message });
  }
};

const fetchAllCompanies = async (req, res) => {
  try {
    const companies = await Company.find().sort({ name: 1 });
    res.status(200).json({ success: true, data: companies });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteCompany = async (req, res) => {
  try {
    const company = await Company.findByIdAndDelete(req.params.id);
    if (!company) return res.status(404).json({ success: false, message: "Company not found" });
    res.status(200).json({ success: true, message: "Company deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createCompany, fetchAllCompanies, deleteCompany };
