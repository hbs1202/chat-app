// src/models/BusinessSite.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const businessSiteSchema = new Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true, trim: true }, // <-- 이 줄 추가
  company: { type: Schema.Types.ObjectId, ref: "Company", required: true },
});

module.exports = mongoose.model("BusinessSite", businessSiteSchema);
