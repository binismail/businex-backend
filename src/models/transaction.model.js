const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const transactionSchema = new Schema(
  {
    // Optional references
    employee: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
    },
    company: {
      type: Schema.Types.ObjectId,
      ref: "Company",
    },
    wallet: {
      type: Schema.Types.ObjectId,
      ref: "Wallet",
    },
    amount: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: [
        // Wallet transactions
        "wallet_credit", 
        "wallet_debit", 
        
        // Employee transactions
        "salary_credit", 
        "bonus_credit", 
        "deduction_debit",
        
        // Other financial transactions
        "credit", 
        "debit"
      ],
      required: true,
    },
    status: {
      type: String,
      enum: ["successful", "failed", "pending"],
      default: "pending",
    },
    description: {
      type: String,
    },
    provider: {
      type: String,
      default: "Xpress Wallet",
    },
    transactionId: {
      type: String, // External transaction ID
    },
    reference: {
      type: String, // Unique transaction reference
      unique: true,
    },
    metadata: {
      type: Schema.Types.Mixed, // Flexible metadata storage
    },
    balance_before: {
      type: Number,
      default: 0
    },
    balance_after: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true,
  }
);

// Create a unique index on reference to prevent duplicates
transactionSchema.index({ reference: 1 }, { unique: true });

const Transaction = mongoose.model("Transaction", transactionSchema);

module.exports = Transaction;
