const Company = require("../model/company");

exports.createCompany = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ success: false, message: "Company name is required" });
    const company = await Company.create({ name });
    res.status(201).json({ success: true, data: company });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ success: false, message: "Company already exists" });
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.fetchAllCompanies = async (req, res) => {
  try {
    const companies = await Company.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: companies });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteCompany = async (req, res) => {
  try {
    await Company.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Company deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
