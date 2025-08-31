// src/models/Position.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const positionSchema = new Schema({
  name: { type: String, required: true, unique: true }, // 예: 선임 연구원
  code: { type: String, required: true, unique: true, trim: true }, // 예: POS-001
});

module.exports = mongoose.model("Position", positionSchema);
