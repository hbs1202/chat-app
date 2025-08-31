// src/models/Department.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const departmentSchema = new Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true, trim: true }, // <-- 이 줄 추가
  businessSite: {
    type: Schema.Types.ObjectId,
    ref: "BusinessSite",
    required: true,
  },
});

module.exports = mongoose.model("Department", departmentSchema);
