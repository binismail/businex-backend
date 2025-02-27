const baseStyle = `
<style>
  .email-container {
    max-width: 600px;
    margin: 0 auto;
    font-family: Arial, sans-serif;
    color: #333333;
  }
  
  .header {
    background-color: #004D40;
    padding: 20px;
    text-align: center;
  }
  
  .logo {
    color: white;
    font-size: 24px;
    font-weight: bold;
  }
  
  .content {
    padding: 30px 20px;
    background-color: #ffffff;
  }
  
  .footer {
    padding: 20px;
    text-align: center;
    font-size: 12px;
    color: #666666;
  }
  
  .button {
    display: inline-block;
    padding: 12px 24px;
    background-color: #004D40;
    color: white;
    text-decoration: none;
    border-radius: 4px;
    margin: 20px 0;
  }
  
  .otp-code {
    font-size: 32px;
    font-weight: bold;
    text-align: center;
    letter-spacing: 4px;
    margin: 20px 0;
    color: #004D40;
  }
</style>`;

const templates = {
  // Authentication Templates
  otpVerification: (otp) => `
    <div class="email-container">
      <div class="header">
        <div class="logo">BusineX</div>
      </div>
      <div class="content">
        <h2>Verify Your Account</h2>
        <p>Hello,</p>
        <p>Your verification code is:</p>
        <div class="otp-code">${otp}</div>
        <p>This code will expire in 10 minutes. Please do not share this code with anyone.</p>
      </div>
      <div class="footer">
        <p>© 2024 BusineX. All rights reserved.</p>
      </div>
    </div>
  `,

  // Company Onboarding Templates
  onboardingReview: (data) => `
    <div class="email-container">
      <div class="header">
        <div class="logo">BusineX</div>
      </div>
      <div class="content">
        <h2>Onboarding Under Review</h2>
        <p>Hello ${data.companyName},</p>
        <p>We've received your onboarding documents and our team is currently reviewing them. This typically takes 1-2 business days.</p>
        <p>We'll notify you once the review is complete.</p>
        <a href="${data.dashboardUrl}" class="button">Check Status</a>
      </div>
      <div class="footer">
        <p>© 2024 BusineX. All rights reserved.</p>
      </div>
    </div>
  `,

  companyApproved: (data) => `
    <div class="email-container">
      <div class="header">
        <div class="logo">BusineX</div>
      </div>
      <div class="content">
        <h2>Welcome to BusineX! 🎉</h2>
        <p>Hello ${data.companyName},</p>
        <p>Great news! Your company has been approved on BusineX. You can now start managing your payroll efficiently.</p>
        <a href="${data.dashboardUrl}" class="button">Get Started</a>
      </div>
      <div class="footer">
        <p>© 2024 BusineX. All rights reserved.</p>
      </div>
    </div>
  `,

  // Payroll Templates
  payrollProcessed: (data) => `
    <div class="email-container">
      <div class="header">
        <div class="logo">BusineX</div>
      </div>
      <div class="content">
        <h2>Payroll Successfully Processed</h2>
        <p>Hello ${data.adminName},</p>
        <p>Your payroll for ${data.period} has been successfully processed.</p>
        <p><strong>Details:</strong></p>
        <ul>
          <li>Total Amount: ${data.totalAmount}</li>
          <li>Number of Employees: ${data.employeeCount}</li>
          <li>Processing Date: ${data.processDate}</li>
        </ul>
        <a href="${data.dashboardUrl}" class="button">View Details</a>
      </div>
      <div class="footer">
        <p>© 2024 BusineX. All rights reserved.</p>
      </div>
    </div>
  `,

  payrollFailed: (data) => `
    <div class="email-container">
      <div class="header">
        <div class="logo">BusineX</div>
      </div>
      <div class="content">
        <h2>⚠️ Payroll Processing Failed</h2>
        <p>Hello ${data.adminName},</p>
        <p>We encountered an issue while processing your payroll for ${data.period}.</p>
        <p><strong>Error:</strong> ${data.errorMessage}</p>
        <p>Please review and try again. If you need assistance, our support team is here to help.</p>
        <a href="${data.dashboardUrl}" class="button">Review Payroll</a>
      </div>
      <div class="footer">
        <p>© 2024 BusineX. All rights reserved.</p>
      </div>
    </div>
  `,

  payslip: (data) => `
    <div class="email-container">
      <div class="header">
        <div class="logo">BusineX</div>
      </div>
      <div class="content">
        <h2>Your Payslip is Ready</h2>
        <p>Hello ${data.employeeName},</p>
        <p>Your payslip for ${data.period} is now available.</p>
        <p><strong>Summary:</strong></p>
        <ul>
          <li>Net Pay: ${data.netPay}</li>
          <li>Pay Period: ${data.period}</li>
        </ul>
        <a href="${data.payslipUrl}" class="button">View Payslip</a>
      </div>
      <div class="footer">
        <p>© 2024 BusineX. All rights reserved.</p>
      </div>
    </div>
  `,

  // Employee Templates
  employeeCreated: (data) => `
    <div class="email-container">
      <div class="header">
        <div class="logo">BusineX</div>
      </div>
      <div class="content">
        <h2>Welcome to ${data.companyName}!</h2>
        <p>Hello ${data.employeeName},</p>
        <p>Your employee profile has been created in BusineX. Please complete your profile setup to access your payroll information.</p>
        <p><strong>Next steps:</strong></p>
        <ol>
          <li>Set up your password</li>
          <li>Complete your profile information</li>
          <li>Add your bank details</li>
        </ol>
        <a href="${data.setupUrl}" class="button">Complete Setup</a>
      </div>
      <div class="footer">
        <p>© 2024 BusineX. All rights reserved.</p>
      </div>
    </div>
  `,

  // Additional Templates
  lowWalletBalance: (data) => `
    <div class="email-container">
      <div class="header">
        <div class="logo">BusineX</div>
      </div>
      <div class="content">
        <h2>⚠️ Low Wallet Balance Alert</h2>
        <p>Hello ${data.adminName},</p>
        <p>Your company wallet balance is running low.</p>
        <p><strong>Current Balance:</strong> ${data.currentBalance}</p>
        <p><strong>Upcoming Payroll:</strong> ${data.upcomingPayroll}</p>
        <p>Please fund your wallet to ensure smooth payroll processing.</p>
        <a href="${data.walletUrl}" class="button">Fund Wallet</a>
      </div>
      <div class="footer">
        <p>© 2024 BusineX. All rights reserved.</p>
      </div>
    </div>
  `,

  waitlistSignup: (data) => `
    <div class="email-container">
      <div class="header">
        <div class="logo">BusineX</div>
      </div>
      <div class="content">
        <h2>Welcome to BusineX Waitlist! 🎉</h2>
        <p>Hello ${data.firstName},</p>
        <p>Thank you for your interest in BusineX. We've added you to our waitlist and will notify you as soon as we're ready to onboard your company.</p>
        <p><strong>Your Details:</strong></p>
        <ul>
          <li>Company: ${data.companyName}</li>
          <li>Email: ${data.email}</li>
        </ul>
        <p>We're working hard to provide you with the best payroll management experience.</p>
      </div>
      <div class="footer">
        <p>© 2024 BusineX. All rights reserved.</p>
      </div>
    </div>
  `
};

module.exports = {
  baseStyle,
  templates
};
