const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const extraEarningSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Extra earning name is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount cannot be negative"],
    },
    type: {
      type: String,
      enum: ["fixed", "percentage"],
      default: "fixed",
    },
    frequency: {
      type: String,
      enum: ["one-time", "recurring"],
      default: "one-time",
    },
    company: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    // Track where this extra earning is applied
    applications: [
      {
        target_type: {
          type: String,
          enum: ["employee", "department"],
          required: true,
        },
        target_id: {
          type: Schema.Types.ObjectId,
          required: true,
          refPath: "applications.target_type",
        },
        start_date: {
          type: Date,
          required: true,
        },
        end_date: Date,
        status: {
          type: String,
          enum: ["active", "inactive"],
          default: "active",
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Add indexes for better query performance
extraEarningSchema.index({ company: 1, status: 1 });
extraEarningSchema.index({
  "applications.target_type": 1,
  "applications.target_id": 1,
});

// Pre-save middleware to validate references
extraEarningSchema.pre("save", async function (next) {
  try {
    if (this.isModified("applications")) {
      // Only validate the last application (the newly added one)
      const newApplication = this.applications[this.applications.length - 1];
      if (newApplication) {
        // Ensure correct model name (first letter capitalized)
        const modelName =
          newApplication.target_type.charAt(0).toUpperCase() +
          newApplication.target_type.slice(1).toLowerCase();

        // Dynamically get the correct model
        let Model;
        try {
          Model = mongoose.model(modelName);
        } catch (modelError) {
          console.error(`Model not found for target type: ${modelName}`);
          throw new Error(`Invalid target type: ${modelName}`);
        }

        const target = await Model.findById(newApplication.target_id);
        if (!target) {
          throw new Error(`${modelName} with ID ${newApplication.target_id} not found`);
        }
      }
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Virtual populate for target details
extraEarningSchema.virtual("applications.target_details", {
  refPath: "applications.target_type",
  localField: "applications.target_id",
  foreignField: "_id",
  justOne: true,
});

const ExtraEarning = mongoose.model("ExtraEarning", extraEarningSchema);
module.exports = ExtraEarning;
