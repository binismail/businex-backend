const Company = require("../../../models/company.model");
const User = require("../../../models/user.model");
const Department = require("../../../models/department.model");
const { seedDefaultDepartments } = require("../../../utils/defaultDepartments");

// Save onboarding step data
exports.saveOnboardingStep = async (req, res) => {
  try {
    const { step, data } = req.body;
    const userId = req.user._id; // Get the user ID for company creation

    let company;

    if (step === 1) {
      // For step 1, create new company if it doesn't exist
      const {
        companyName,
        businessIndustry,
        staffPower,
        email,
        phoneNumber,
        address,
      } = data.company;

      if (
        !companyName ||
        !businessIndustry ||
        !email ||
        !phoneNumber ||
        !address
      ) {
        return res.status(400).json({
          message: "All fields are required",
        });
      }

      // Check if company with same name exists
      const existingCompany = await Company.findOne({ name: companyName });
      if (existingCompany) {
        return res.status(400).json({
          message: "Company with this name already exists",
        });
      }

      // Create new company
      company = new Company({
        name: companyName,
        businessIndustry,
        staffSize: staffPower ?? "1-10",
        email,
        phone: phoneNumber,
        address,
        admin: userId,
        onboardingStatus: "documents_pending",
        onboardingStep: 1,
      });

      await seedDefaultDepartments(company._id, Department);

      await company.save();

      // Update user's company reference (assuming you have a User model)
      await User.findByIdAndUpdate(userId, { company: company._id });
    } else {
      // For other steps, find existing company
      const companyId = req.user.company;
      company = await Company.findById(companyId);

      if (!company) {
        return res.status(404).json({
          message: "Please complete step 1 first to create your company",
        });
      }

      // Update company data based on the current step
      switch (step) {
        case 2: // Payroll Settings
          company.payroll = data.payroll;
          company.onboardingStatus = "tax_pending";
          break;

        case 3: // Tax Info
          company.tax = data.tax;
          company.onboardingStatus = "documents_pending";
          break;

        case 4: // Documents
          const { documents } = data;
          company.documents = {
            cac: documents.files[0].url,
            cacForm: documents.files[1].url,
            memart: documents.files[2].url,
          };

          company.directors = data.documents.directors;
          company.onboardingStatus = "completed";
          // Reset document verification status when new documents are uploaded
          company.kycDetails = company.kycDetails || {};
          company.kycDetails.documentVerificationStatus = {
            cac: "pending",
            cacForm: "pending",
            memart: "pending",
            taxClearance: "pending",
          };
          company.kycStatus = "in_review";
          break;

        default:
          return res.status(400).json({ message: "Invalid step" });
      }

      company.onboardingStep = step;
      await company.save();
    }

    res.status(200).json({
      message:
        step === 1
          ? "Company created successfully"
          : "Onboarding step saved successfully",
      step,
      company,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error saving onboarding step",
      error: error.message,
    });
  }
};

// Get onboarding progress
exports.getOnboardingProgress = async (req, res) => {
  try {
    const companyId = req.user.company;

    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    res.status(200).json({
      currentStep: company.onboardingStep,
      status: company.onboardingStatus,
      kycStatus: company.kycStatus,
      company: {
        companyName: company.name,
        businessIndustry: company.businessIndustry,
        documents: company.documents,
        tax: company.tax,
        payroll: company.payroll,
        kycDetails: company.kycDetails,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching onboarding progress",
      error: error.message,
    });
  }
};

// Complete onboarding
exports.completeOnboarding = async (req, res) => {
  try {
    const companyId = req.user.company;

    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    // Verify all required data is present
    if (!company.name || !company.businessIndustry) {
      return res
        .status(400)
        .json({ message: "Company information is incomplete" });
    }

    if (
      !company.documents.cac ||
      !company.documents.cacForm ||
      !company.documents.memart
    ) {
      return res
        .status(400)
        .json({ message: "Required documents are missing" });
    }

    if (!company.payroll.payrollFrequency || !company.payroll.defaultPayday) {
      return res
        .status(400)
        .json({ message: "Payroll settings are incomplete" });
    }

    company.onboardingStatus = "completed";
    company.onboardingStep = 4; // Final step
    await company.save();

    res.status(200).json({
      message: "Onboarding completed successfully",
      company,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error completing onboarding",
      error: error.message,
    });
  }
};

// Review KYC documents
exports.reviewKycDocuments = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { documentType, status, rejectionReason } = req.body;
    const reviewerId = req.user._id;

    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    // Update document verification status
    if (
      company.kycDetails &&
      company.kycDetails.documentVerificationStatus[documentType] !== undefined
    ) {
      company.kycDetails.documentVerificationStatus[documentType] = status;
    }

    // Update review details
    company.kycDetails = company.kycDetails || {};
    company.kycDetails.lastCheckedAt = new Date();
    company.kycDetails.reviewedBy = reviewerId;
    company.kycDetails.reviewedAt = new Date();

    // Check if all documents are verified
    const allDocumentsVerified = Object.values(
      company.kycDetails.documentVerificationStatus
    ).every((status) => status === "verified");

    // Update KYC status based on verification results
    if (status === "rejected") {
      company.kycStatus = "rejected";
      company.kycDetails.rejectionReason = rejectionReason;
    } else if (allDocumentsVerified) {
      company.kycStatus = "approved";
      company.kycDetails.approvalDate = new Date();
      company.kycDetails.rejectionReason = null;
    }

    await company.save();

    res.status(200).json({
      message: `Document ${documentType} ${status} successfully`,
      company,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error reviewing KYC document",
      error: error.message,
    });
  }
};
