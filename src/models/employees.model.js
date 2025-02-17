const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const employeeSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["present", "inactive", "absent"],
      default: "present",
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
    },
    position: {
      type: String,
      required: true,
    },
    department: {
      type: String,
      required: true,
    },
    salary: {
      type: Number,
      required: true,
    },
    company: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    bankDetails: {
      accountNumber: String,
      accountName: String,
      bankCode: String,
      bankName: String,
    },
    country: {
      type: String,
      default: "NIGERIA",
    },
    currency: {
      type: String,
      default: "NGN",
    },
    tax_information: {
      type: String,
      default: null,
    },
    employment_start_date: {
      type: Date,
      default: Date.now,
    },
    employment_end_date: {
      type: Date,
    },
    payroll_status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

const Employee = mongoose.model("Employee", employeeSchema);

module.exports = Employee;
