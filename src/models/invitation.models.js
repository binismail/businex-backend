const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const invitationSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    token: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    role: {
      type: String,
      enum: ["admin", "reviewer", "operations"],
      required: true,
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Invitation = mongoose.model("Invitation", invitationSchema);

module.exports = Invitation;
