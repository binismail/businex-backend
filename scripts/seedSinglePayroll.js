const mongoose = require('mongoose');
const dotenv = require('dotenv');
const WalletService = require('../src/services/walletService');
const Payroll = require('../src/models/payroll.model');
const Company = require('../src/models/company.model');
const Employee = require('../src/models/employees.model');
const Wallet = require('../src/models/wallet.model');

dotenv.config();

async function seedSinglePayroll() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Find a company
    const company = await Company.findOne();
    if (!company) {
      throw new Error('No company found');
    }

    // Create or find a wallet for the company
    let wallet = await Wallet.findOne({ company: company._id });
    if (!wallet) {
      wallet = await WalletService.createWalletForCompany(company._id);
    }

    // Credit the wallet with enough balance
    await WalletService.creditWallet(company._id, 1000000, { 
      description: 'Payroll funding' 
    });

    // Find an employee
    const employee = await Employee.findOne({
      company: company._id,
      bankDetails: { $exists: true, $ne: null }
    });

    if (!employee) {
      throw new Error('No employee with bank details found');
    }

    // Create a payroll record
    const payroll = new Payroll({
      company: company._id,
      name: `Test Payroll for ${employee.name}`,
      period: {
        start_date: new Date(new Date().setDate(1)),
        end_date: new Date(new Date().setDate(30))
      },
      frequency: 'monthly',
      status: 'pending',
      total_employees: 1,
      payslips: [{
        employee: employee._id,
        base_salary: employee.salary || 150000,
        allowances: [{
          type: 'transport',
          amount: 22500,
          description: 'Transport Allowance'
        }],
        deductions: [{
          type: 'tax',
          amount: 15000,
          description: 'PAYE Tax'
        }],
        gross_pay: 172500,
        net_pay: 157500,
        status: 'pending'
      }]
    });

    await payroll.save();

    console.log('Payroll seeded successfully:');
    console.log('Company:', company.name);
    console.log('Employee:', employee.name);
    console.log('Payroll ID:', payroll._id);
    console.log('Wallet Balance:', wallet.wallet.availableBalance);

    return payroll._id;
  } catch (error) {
    console.error('Error seeding payroll:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
  }
}

// If run directly
if (require.main === module) {
  seedSinglePayroll()
    .then(payrollId => console.log(`Payroll seeded with ID: ${payrollId}`))
    .catch(console.error);
}

module.exports = seedSinglePayroll;
