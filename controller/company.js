const Company = require("../model/company");

const createCompany = async (req, res) => {
  try {
    const { name, facebook, instagram, googleMyBusiness, category } = req.body;
    if (!name) return res.status(400).json({ success: false, message: "Company name is required" });
    const company = await Company.create({
      name,
      facebook,
      instagram,
      googleMyBusiness,
      category,
      createdBy: req.user._id,
    });
    res.status(201).json({ success: true, data: company });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ success: false, message: "Company already exists" });
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateCompany = async (req, res) => {
  try {
    const { name, facebook, instagram, googleMyBusiness, category } = req.body;
    const company = await Company.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { name, facebook, instagram, googleMyBusiness, category },
      { new: true, runValidators: true }
    );
    if (!company) return res.status(404).json({ success: false, message: "Company not found" });
    res.status(200).json({ success: true, data: company });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ success: false, message: "Company name already exists" });
    res.status(500).json({ success: false, message: error.message });
  }
};

const fetchAllCompanies = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const skip = (page - 1) * limit;

    let filter = { isDeleted: { $ne: true } };
    
    // Role based filtering for companies
    if (req.user.role !== "admin") {
      filter._id = { $in: req.user.assignedCompanies };
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } }
      ];
    }

    const companies = await Company.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Company.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: companies,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getCompanyDropdown = async (req, res) => {
  try {
    let filter = { isDeleted: { $ne: true } };
    if (req.user.role !== "admin") {
      filter._id = { $in: req.user.assignedCompanies };
    }
    const companies = await Company.find(filter, "name _id").sort({ name: 1 });
    res.status(200).json({ success: true, data: companies });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteCompany = async (req, res) => {
  try {
    const company = await Company.findByIdAndUpdate(req.params.id, { isDeleted: true });
    if (!company) return res.status(404).json({ success: false, message: "Company not found" });
    res.status(200).json({ success: true, message: "Company deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createCompany, updateCompany, fetchAllCompanies, getCompanyDropdown, deleteCompany };
