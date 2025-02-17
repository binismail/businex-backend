const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Schema for allowances and deductions within payslips
const paymentItemSchema = new Schema({
  type: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  description: String
});

// Schema for individual employee payslips within a payroll
const payslipSchema = new Schema({
  employee: {
    type: Schema.Types.ObjectId,
    ref: "Employee",
    required: true
  },
  base_salary: {
    type: Number,
    required: true,
    min: 0
  },
  allowances: [paymentItemSchema],
  deductions: [paymentItemSchema],
  gross_pay: {
    type: Number,
    required: true,
    min: 0
  },
  net_pay: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ["pending", "processing", "completed", "failed"],
    default: "pending"
  },
  payment_reference: String,
  payment_date: Date
});

// Main payroll schema for batch processing
const payrollSchema = new Schema(
  {
    company: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    name: {
      type: String,
      required: true
    },
    period: {
      start_date: {
        type: Date,
        required: true
      },
      end_date: {
        type: Date,
        required: true
      }
    },
    frequency: {
      type: String,
      enum: ["weekly", "bi-weekly", "monthly"],
      required: true
    },
    status: {
      type: String,
      enum: ["draft", "pending", "processing", "completed", "failed"],
      default: "draft"
    },
    total_employees: {
      type: Number,
      required: true
    },
    payslips: [payslipSchema],
    summary: {
      total_gross: {
        type: Number,
        default: 0
      },
      total_deductions: {
        type: Number,
        default: 0
      },
      total_allowances: {
        type: Number,
        default: 0
      },
      total_net: {
        type: Number,
        default: 0
      }
    },
    processing_history: [{
      status: {
        type: String,
        enum: ["started", "processing", "completed", "failed"]
      },
      timestamp: {
        type: Date,
        default: Date.now
      },
      message: String
    }],
    schedule: {
      next_run: Date,
      last_run: Date,
      is_recurring: {
        type: Boolean,
        default: false
      }
    }
  },
  {
    timestamps: true
  }
);

// Indexes for efficient querying
payrollSchema.index({ company: 1, status: 1 });
payrollSchema.index({ company: 1, "period.start_date": 1, "period.end_date": 1 });
payrollSchema.index({ "schedule.next_run": 1 }, { sparse: true });

// Virtual populate for employee details
payrollSchema.virtual('payslips.employee_details', {
  ref: 'Employee',
  localField: 'payslips.employee',
  foreignField: '_id',
  justOne: true
});

const Payroll = mongoose.model("Payroll", payrollSchema);
module.exports = Payroll;
