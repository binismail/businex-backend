const mongoose = require('mongoose');
const Company = require('../models/company.model');
const User = require('../models/user.model');

const generateFakeCompany = (adminId) => ({
  name: 'Demo Company Ltd',
  businessIndustry: 'Technology',
  staffSize: '10-50',
  email: 'demo@company.com',
  phone: '+2348012345678',
  address: 'Lagos, Nigeria',
  admin: adminId,
  documents: {
    cacDocument: 'https://example.com/cac.pdf',
    cacForm: 'https://example.com/cacform.pdf',
    memart: 'https://example.com/memart.pdf'
  },
  tax: {
    taxPayeeId: 'TPD123456',
    taxRegNumber: 'TRN123456',
    vatNumber: 'VAT123456'
  },
  directors: [
    {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@company.com',
      phone: '+2348011111111'
    }
  ],
  payroll: {
    payrollFrequency: 'monthly',
    defaultPayday: '25',
    hasOvertimePolicies: 'yes'
  },
  onboardingStatus: 'completed',
  onboardingStep: 4,
  kycStatus: 'approved',
  kycDetails: {
    documentVerificationStatus: {
      cac: 'verified',
      cacForm: 'verified',
      memart: 'verified',
      taxClearance: 'verified'
    }
  }
});

const seedCompany = async () => {
  try {
    // Clear existing companies
    await Company.deleteMany({});
    
    // Get or create an admin user
    let adminUser = await User.findOne({ role: 'admin' });
    
    if (!adminUser) {
      console.log('No admin user found. Please seed users first.');
      return;
    }

    const fakeCompany = generateFakeCompany(adminUser._id);
    const company = await Company.create(fakeCompany);
    
    // Update admin user with company reference
    await User.findByIdAndUpdate(adminUser._id, { company: company._id });

    console.log('Successfully seeded company');
  } catch (error) {
    console.error('Error seeding company:', error);
  }
};

module.exports = {
  seedCompany
};
