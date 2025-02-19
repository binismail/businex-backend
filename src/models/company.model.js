const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const companySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    businessIndustry: {
      type: String,
      required: true,
    },
    staffSize: {
      type: String,
      default: "1-10",
    },
    email: {
      type: String,
      default: "",
    },
    phone: {
      type: String,
      default: "",
    },
    // Company Documents
    documents: {
      cacDocument: { type: String, default: "" },
      taxClearance: { type: String, default: "" },
      cac: { type: String, default: "" },
      cacForm: { type: String, default: "" },
      memart: { type: String, default: "" },
    },
    // Tax Information
    tax: {
      hasTaxPayeeId: { type: Boolean, default: false },
      taxPayeeId: { type: String, default: "" },
      taxRegNumber: { type: String, default: "" },
      vatNumber: { type: String, default: "" },
    },
    directors: [
      {
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        email: { type: String, required: true },
        phone: { type: String, required: true },
        bvn: { type: String, default: "" },
      },
    ],
    // Payroll Settings
    payroll: {
      payrollFrequency: {
        type: String,
        enum: ["weekly", "biweekly", "monthly"],
        default: "monthly",
      },
      defaultPayday: { type: String, default: "28" },
      hasOvertimePolicies: {
        type: String,
        enum: ["yes", "no"],
        default: "no",
      },
    },
    admin: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    employees: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    address: {
      type: String,
      default: "",
    },
    onboardingStatus: {
      type: String,
      enum: [
        "incomplete",
        "documents_pending",
        "tax_pending",
        "payroll_pending",
        "completed",
      ],
      default: "incomplete",
    },
    onboardingStep: {
      type: Number,
      default: 1,
      min: 1,
      max: 4,
    },
    kycStatus: {
      type: String,
      enum: ["pending", "in_review", "approved", "rejected"],
      default: "pending",
    },
    wallet: {
      type: Schema.Types.ObjectId,
      ref: 'Wallet'
    },
    kycDetails: {
      reviewedAt: { type: Date },
      reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
      rejectionReason: { type: String },
      approvalDate: { type: Date },
      lastCheckedAt: { type: Date },
      documentVerificationStatus: {
        cac: {
          type: String,
          enum: ["pending", "verified", "rejected"],
          default: "pending",
        },
        cacForm: {
          type: String,
          enum: ["pending", "verified", "rejected"],
          default: "pending",
        },
        memart: {
          type: String,
          enum: ["pending", "verified", "rejected"],
          default: "pending",
        },
        taxClearance: {
          type: String,
          enum: ["pending", "verified", "rejected"],
          default: "pending",
        },
      },
    },
  },
  {
    timestamps: true,
  }
);

const Company = mongoose.model("Company", companySchema);

module.exports = Company;
