const mongoose = require("mongoose");

const StaffSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    status: { type: String, default: "active" },
    role: { type: String, enum: ["admin", "hr", "staff"], default: "staff" },
    assignedCompanies: [{ type: mongoose.Schema.Types.ObjectId, ref: "Company" }],
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Staff", StaffSchema);
