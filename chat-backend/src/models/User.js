// src/models/User.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const userSchema = new Schema({
  username: { type: String, required: true, unique: true, trim: true },
  fullName: { type: String, required: true },
  code: { type: String, required: true, unique: true, trim: true }, // <-- 이 줄 추가 (사번 역할)
  password: { type: String, required: true }, // <-- 이 줄을 추가합니다.
  position: { type: Schema.Types.ObjectId, ref: "Position" },

  department: {
    type: Schema.Types.ObjectId,
    ref: "Department",
    required: true,
  },
  businessSite: {
    type: Schema.Types.ObjectId,
    ref: "BusinessSite",
    required: true,
  },
  company: { type: Schema.Types.ObjectId, ref: "Company", required: true },
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model("User", userSchema);
module.exports = User;
