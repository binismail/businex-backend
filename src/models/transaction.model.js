const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const transactionSchema = new Schema(
  {
    employee: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: ["credit", "debit"],
      required: true,
    },
    status: {
      type: String,
      enum: ["successful", "failed", "pending"],
      default: "successful",
    },
    description: {
      type: String,
    },
    provider: {
      type: String,
      required: true,
    },
    transactionId: {
      type: String, // Bank transaction ID
    },
  },
  {
    timestamps: true,
  }
);

const Transaction = mongoose.model("Transaction", transactionSchema);

module.exports = Transaction;
