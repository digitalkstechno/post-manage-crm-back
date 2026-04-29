const Submission = require("../model/submissions");

// Create Submission
const createSubmission = async (req, res) => {
  try {
    const { title, description, fileLink } = req.body;

    if (!title) {
      return res
        .status(400)
        .json({ success: false, message: "Title is required" });
    }

    const submission = await Submission.create({
      title,
      description,
      fileLink,
      status: "PENDING",
      submittedBy: req.user._id, // ✅ id → _id
    });

    // ✅ Populate karke return karo
    const populated = await Submission.findById(submission._id).populate(
      "submittedBy",
      "fullName email",
    );

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
    const validStatuses = ["APPROVED", "PENDING", "REJECTED"];

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
  deleteSubmission,
  getSubmissionStats,
};
