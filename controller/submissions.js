const Submission = require("../model/submissions");

// Create Submission
const createSubmission = async (req, res) => {
  try {
    const { title, description, fileLink, company, uploadAt } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: "Title is required" });
    }

    if (uploadAt && new Date(uploadAt) < new Date()) {
      return res.status(400).json({ success: false, message: "Upload date cannot be in the past" });
    }

    const atFile = req.file ? `/images/at/${req.file.filename}` : undefined;

    const submission = await Submission.create({
      title, description, fileLink, company: company || null, uploadAt: uploadAt || null,
      status: "PENDING",
      submittedBy: req.user._id,
    });

    const populated = await Submission.findById(submission._id)
      .populate("submittedBy", "fullName email");

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const fetchAllSubmissions = async (req, res) => {
  try {
    const { status } = req.query;
    let filter = {};

    if (status) filter.status = status;

    if (req.user.role === "staff") {
      filter.submittedBy = req.user._id;
    }
    const submissions = await Submission.find(filter)
      .populate("submittedBy", "fullName email")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: submissions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// Fetch Single Submission
const fetchSubmissionById = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id).populate(
      "submittedBy",
      "fullName email",
    );

    if (!submission) {
      return res
        .status(404)
        .json({ success: false, message: "Submission not found" });
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
      return res
        .status(400)
        .json({ success: false, message: "Invalid status value" });
    }

    const updateFields = {};
    if (req.body.status) updateFields.status = req.body.status;
    if (req.body.adminComment !== undefined) updateFields.adminComment = req.body.adminComment;

    const submission = await Submission.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true },
    ).populate("submittedBy", "fullName email");

    if (!submission) {
      return res
        .status(404)
        .json({ success: false, message: "Submission not found" });
    }

    res.status(200).json({ success: true, data: submission });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Resubmit (staff rework)
const resubmitSubmission = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id);
    if (!submission) return res.status(404).json({ success: false, message: "Submission not found" });
    if (submission.status !== "REWORK") return res.status(400).json({ success: false, message: "Only REWORK submissions can be resubmitted" });

    const updated = await Submission.findByIdAndUpdate(
      req.params.id,
      { fileLink: req.body.fileLink, status: "PENDING", adminComment: null },
      { new: true }
    ).populate("submittedBy", "fullName email");

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete Submission
const deleteSubmission = async (req, res) => {
  try {
    const submission = await Submission.findByIdAndDelete(req.params.id);

    if (!submission) {
      return res
        .status(404)
        .json({ success: false, message: "Submission not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "Submission deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Post to Social Media
const postToSocial = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id);

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

// Get Stats
const getSubmissionStats = async (req, res) => {
  try {
    const total = await Submission.countDocuments();
    const pending = await Submission.countDocuments({ status: "PENDING" });
    const approved = await Submission.countDocuments({ status: "APPROVED" });
    const rejected = await Submission.countDocuments({ status: "REJECTED" });

    res.status(200).json({
      success: true,
      data: { total, pending, approved, rejected },
    });
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
  postToSocial,
};
