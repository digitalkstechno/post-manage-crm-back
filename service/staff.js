const STAFF = require("../model/staff");
const { encryptData, decryptData } = require("../utils/crypto");
const jwt = require("jsonwebtoken");

exports.createStaffService = async ({ fullName, email, password, role, assignedCompanies }) => {
  const encryptedPassword = encryptData(password);
  const staffData = { 
    fullName, 
    email, 
    status: "active", 
    password: encryptedPassword, 
    role: role || "staff",
    assignedCompanies: assignedCompanies || []
  };
  const staffDetails = await STAFF.create(staffData);
  return staffDetails;
};

exports.loginStaffService = async ({ email, password }) => {
  const staffverify = await STAFF.findOne({ email, isDeleted: { $ne: true } });
  if (!staffverify) throw new Error("Invalid Email or password");

  const decryptedPassword = decryptData(staffverify.password);
  if (String(decryptedPassword) !== password) throw new Error("Invalid password");

  const token = jwt.sign({ id: staffverify._id }, process.env.JWT_SECRET_KEY);
  return { staff: staffverify, token };
};

exports.fetchAllStaffsService = async ({ page, limit, search }) => {
  const skip = (page - 1) * limit;
  const query = {
    isDeleted: { $ne: true },
    $or: [
      { fullName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { status: { $regex: search, $options: "i" } },
      { role: { $regex: search, $options: "i" } }
    ],
  };
  const totalStaff = await STAFF.countDocuments(query);
  const staffsData = await STAFF.find(query)
    .populate("assignedCompanies", "name")
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });
  return { totalStaff, staffsData, page, limit };
};

exports.fetchStaffByIdService = async (staffId) => {
  const staffData = await STAFF.findOne({ _id: staffId, isDeleted: { $ne: true } }).populate("assignedCompanies", "name");
  if (!staffData) throw new Error("Staff not found");
  return staffData;
};

exports.staffUpdateService = async (staffId, body) => {
  const oldStaff = await STAFF.findOne({ _id: staffId, isDeleted: { $ne: true } });
  if (!oldStaff) throw new Error("Staff not found");
  if (body.password) body.password = encryptData(body.password);
  const updatedStaff = await STAFF.findByIdAndUpdate(staffId, body, { new: true }).populate("assignedCompanies", "name");
  return updatedStaff;
};

exports.staffDeleteService = async (staffId) => {
  const oldStaff = await STAFF.findOne({ _id: staffId, isDeleted: { $ne: true } });
  if (!oldStaff) throw new Error("Staff not found");
  await STAFF.findByIdAndUpdate(staffId, { isDeleted: true });
};

exports.fetchStaffDropdownService = async () => {
  return await STAFF.find({ isDeleted: { $ne: true } }, "fullName _id").sort({ fullName: 1 });
};
