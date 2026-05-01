const Submission = require("../model/submissions");

// Create Submission
const createSubmission = async (req, res) => {
  try {
    const { title, description, fileLink, company, uploadAt } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: "Title is required" });
    }
    if (!company) {
      return res.status(400).json({ success: false, message: "Company is required" });
    }

    if (uploadAt && new Date(uploadAt) < new Date()) {
      return res.status(400).json({ success: false, message: "Upload date cannot be in the past" });
    }

    const submission = await Submission.create({
      title, description, fileLink, company, uploadAt: uploadAt || null,
      status: "PENDING",
      submittedBy: req.user._id,
    });

    const populated = await Submission.findById(submission._id)
      .populate("submittedBy", "fullName email")
      .populate("company", "name");

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const fetchAllSubmissions = async (req, res) => {
  try {
    const { status, search } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let filter = { isDeleted: { $ne: true } };

    if (status) filter.status = status.toUpperCase();

    // Role based filtering
    if (req.user.role === "hr" || req.user.role === "staff") {
      filter.company = { $in: req.user.assignedCompanies };
    }

    if (search) {
      filter.title = { $regex: search, $options: "i" };
    }

    const submissions = await Submission.find(filter)
      .populate("submittedBy", "fullName email")
      .populate("company", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Submission.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: submissions,
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

// Fetch Single Submission
const fetchSubmissionById = async (req, res) => {
  try {
    const submission = await Submission.findOne({ _id: req.params.id, isDeleted: { $ne: true } })
      .populate("submittedBy", "fullName email")
      .populate("company", "name");

    if (!submission) {
      return res.status(404).json({ success: false, message: "Submission not found" });
    }

    res.status(200).json({ success: true, data: submission });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update Submission
const updateSubmission = async (req, res) => {
  try {
    const validStatuses = ["APPROVED", "PENDING", "REJECTED", "REWORK"];

    if (req.body.status && !validStatuses.includes(req.body.status)) {
      return res.status(400).json({ success: false, message: "Invalid status value" });
    }

    // Role check: Only ADMIN or HR can update status
    if (req.user.role !== "admin" && req.user.role !== "hr") {
      return res.status(403).json({ success: false, message: "Only Admin or HR can update post status" });
    }

    const submissionData = await Submission.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
    if (!submissionData) return res.status(404).json({ success: false, message: "Post not found" });

    // HR check: Can only update if the company is assigned to them
    if (req.user.role === "hr" && !req.user.assignedCompanies.includes(submissionData.company.toString())) {
      return res.status(403).json({ success: false, message: "You are not assigned to this company" });
    }

    const updateFields = {};
    if (req.body.status) updateFields.status = req.body.status;
    if (req.body.adminComment !== undefined) updateFields.adminComment = req.body.adminComment;

    const submission = await Submission.findOneAndUpdate(
      { _id: req.params.id, isDeleted: { $ne: true } },
      updateFields,
      { new: true }
    ).populate("submittedBy", "fullName email").populate("company", "name");

    res.status(200).json({ success: true, data: submission });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Resubmit (staff rework)
const resubmitSubmission = async (req, res) => {
  try {
    const submission = await Submission.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
    if (!submission) return res.status(404).json({ success: false, message: "Submission not found" });
    if (submission.status !== "REWORK")
      return res.status(400).json({ success: false, message: "Only REWORK submissions can be resubmitted" });

    const updated = await Submission.findOneAndUpdate(
      { _id: req.params.id, isDeleted: { $ne: true } },
      { fileLink: req.body.fileLink, status: "PENDING", adminComment: null },
      { new: true }
    ).populate("submittedBy", "fullName email").populate("company", "name");

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete Submission
const deleteSubmission = async (req, res) => {
  try {
    const submission = await Submission.findByIdAndUpdate(req.params.id, { isDeleted: true });

    if (!submission) {
      return res.status(404).json({ success: false, message: "Submission not found" });
    }

    res.status(200).json({ success: true, message: "Submission deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Post to Social Media
const postToSocial = async (req, res) => {
  try {
    const submission = await Submission.findOne({ _id: req.params.id, isDeleted: { $ne: true } });

    if (!submission) {
      return res.status(404).json({ success: false, message: "Submission not found" });
    }

    if (submission.status !== "APPROVED") {
      return res.status(400).json({ success: false, message: "Only approved submissions can be posted" });
    }

    submission.postedToSocial = true;
    submission.socialPostedAt = new Date();
    await submission.save();

    res.status(200).json({ success: true, data: submission });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Stats (Staff & General)
const getSubmissionStats = async (req, res) => {
  try {
    const filter = { isDeleted: { $ne: true } };
    
    if (req.user.role === "hr" || req.user.role === "staff") {
      filter.company = { $in: req.user.assignedCompanies };
    }

    const [total, pending, approved, rejected, rework] = await Promise.all([
      Submission.countDocuments(filter),
      Submission.countDocuments({ ...filter, status: "PENDING" }),
      Submission.countDocuments({ ...filter, status: "APPROVED" }),
      Submission.countDocuments({ ...filter, status: "REJECTED" }),
      Submission.countDocuments({ ...filter, status: "REWORK" }),
    ]);

    res.status(200).json({
      success: true,
      data: { total, pending, approved, rejected, rework },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Admin Dashboard Specific Stats
const getAdminDashboardStats = async (req, res) => {
  try {
    // Only ADMIN or HR can see dashboard stats
    if (req.user.role !== "admin" && req.user.role !== "hr") {
      return res.status(403).json({ success: false, message: "Admin or HR access required" });
    }

    const now = new Date();
    const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const filter = { isDeleted: { $ne: true } };
    
    // Apply company scoping for HR
    if (req.user.role === "hr") {
      filter.company = { $in: req.user.assignedCompanies };
    }

    const [
      totalPosts,
      totalApproved,
      totalRejected,
      thisMonthPosts,
      thisMonthApproved,
      thisMonthRejected,
      lastMonthApproved,
      lastMonthRejected
    ] = await Promise.all([
      Submission.countDocuments(filter),
      Submission.countDocuments({ ...filter, status: "APPROVED" }),
      Submission.countDocuments({ ...filter, status: "REJECTED" }),
      Submission.countDocuments({ ...filter, createdAt: { $gte: firstDayThisMonth } }),
      Submission.countDocuments({ ...filter, status: "APPROVED", createdAt: { $gte: firstDayThisMonth } }),
      Submission.countDocuments({ ...filter, status: "REJECTED", createdAt: { $gte: firstDayThisMonth } }),
      Submission.countDocuments({ ...filter, status: "APPROVED", createdAt: { $gte: firstDayLastMonth, $lte: lastDayLastMonth } }),
      Submission.countDocuments({ ...filter, status: "REJECTED", createdAt: { $gte: firstDayLastMonth, $lte: lastDayLastMonth } }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalPosts,
        thisMonthPosts,
        totalApproved,
        totalRejected,
        thisMonthApproved,
        thisMonthRejected,
        lastMonthApproved,
        lastMonthRejected
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getSubmissionDropdown = async (req, res) => {
  try {
    const filter = { isDeleted: { $ne: true } };
    if (req.user.role !== "admin") {
      filter.company = { $in: req.user.assignedCompanies };
    }
    const submissions = await Submission.find(filter, "title _id").sort({ title: 1 });
    res.status(200).json({ success: true, data: submissions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
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
};
