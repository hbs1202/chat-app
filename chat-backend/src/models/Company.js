// src/models/Company.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const companySchema = new Schema({
  name: { type: String, required: true, unique: true },
  code: { type: String, required: true, unique: true, trim: true }, // <-- 이 줄 추가
});

module.exports = mongoose.model("Company", companySchema);
