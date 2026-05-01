const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },

    fileLink: {       
      type: String,
      trim: true,
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    uploadAt: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["APPROVED", "PENDING", "REJECTED", "REWORK"],
      default: "PENDING",
    },
    adminComment: {
      type: String,
      trim: true,
      default: null,
    },
    postedToSocial: {
      type: Boolean,
      default: false,
    },
    socialPostedAt: {
      type: Date,
      default: null,
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Submission", submissionSchema);