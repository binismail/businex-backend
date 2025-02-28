function formatDate(expDate) {
  const date = new Date(expDate);
  const day = `0${date.getDate()}`.slice(-2);
  const month = `0${date.getMonth() + 1}`.slice(-2);
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

function formatCurrency(amount) {
  return `₦${amount.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

const templates = {
  // Authentication Templates
  otpVerification: (otp) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Account</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          background-color: #f4f4f4;
        }
        .email-container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
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
        }
        .footer {
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: #666666;
          background-color: #f9f9f9;
        }
        .otp-code {
          font-size: 32px;
          font-weight: bold;
          text-align: center;
          letter-spacing: 4px;
          margin: 20px 0;
          color: #004D40;
          padding: 20px;
          background-color: #f5f5f5;
          border-radius: 4px;
        }
        h2 {
          color: #333333;
          margin-bottom: 20px;
        }
        p {
          margin-bottom: 15px;
          color: #555555;
        }
      </style>
    </head>
    <body>
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
          <p> 2024 BusineX. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `,

  // Company Onboarding Templates
  onboardingReview: (data) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Onboarding Under Review</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          background-color: #f4f4f4;
        }
        .email-container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
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
        }
        .footer {
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: #666666;
          background-color: #f9f9f9;
        }
        .button {
          display: inline-block;
          padding: 12px 24px;
          background-color: #004D40;
          color: white !important;
          text-decoration: none;
          border-radius: 4px;
          margin: 20px 0;
          text-align: center;
        }
        h2 {
          color: #333333;
          margin-bottom: 20px;
        }
        p {
          margin-bottom: 15px;
          color: #555555;
        }
      </style>
    </head>
    <body>
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
          <p> ${new Date().getFullYear()} BusineX. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `,

  companyApproved: (data) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to BusineX!</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          background-color: #f4f4f4;
        }
        .email-container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
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
        }
        .footer {
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: #666666;
          background-color: #f9f9f9;
        }
        .button {
          display: inline-block;
          padding: 12px 24px;
          background-color: #004D40;
          color: white !important;
          text-decoration: none;
          border-radius: 4px;
          margin: 20px 0;
          text-align: center;
        }
        h2 {
          color: #333333;
          margin-bottom: 20px;
        }
        p {
          margin-bottom: 15px;
          color: #555555;
        }
      </style>
    </head>
    <body>
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
          <p> ${new Date().getFullYear()} BusineX. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `,

  // Payroll Templates
  payrollProcessed: (data) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payroll Successfully Processed</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          background-color: #f4f4f4;
        }
        .email-container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
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
        }
        .footer {
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: #666666;
          background-color: #f9f9f9;
        }
        .button {
          display: inline-block;
          padding: 12px 24px;
          background-color: #004D40;
          color: white !important;
          text-decoration: none;
          border-radius: 4px;
          margin: 20px 0;
          text-align: center;
        }
        .details-list {
          list-style: none;
          padding: 15px;
          background-color: #f5f5f5;
          border-radius: 4px;
          margin: 20px 0;
        }
        .details-list li {
          margin: 10px 0;
          color: #555555;
        }
        h2 {
          color: #333333;
          margin-bottom: 20px;
        }
        p {
          margin-bottom: 15px;
          color: #555555;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <div class="logo">BusineX</div>
        </div>
        <div class="content">
          <h2>Payroll Successfully Processed</h2>
          <p>Hello ${data.adminName},</p>
          <p>Your payroll for ${formatDate(
            data.processDate
          )} has been successfully processed.</p>
          <p><strong>Details:</strong></p>
          <ul class="details-list">
            <li>Total Amount: ${data.totalAmount}</li>
            <li>Number of Employees: ${data.employeeCount}</li>
            <li>Processing Date: ${formatDate(data.processDate)}</li>
          </ul>
          <a href="${data.dashboardUrl}" class="button">View Details</a>
        </div>
        <div class="footer">
          <p> ${new Date().getFullYear()} BusineX. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `,

  payrollFailed: (data) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>⚠️ Payroll Processing Failed</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          background-color: #f4f4f4;
        }
        .email-container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
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
        }
        .footer {
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: #666666;
          background-color: #f9f9f9;
        }
        .button {
          display: inline-block;
          padding: 12px 24px;
          background-color: #004D40;
          color: white !important;
          text-decoration: none;
          border-radius: 4px;
          margin: 20px 0;
          text-align: center;
        }
        h2 {
          color: #333333;
          margin-bottom: 20px;
        }
        p {
          margin-bottom: 15px;
          color: #555555;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <div class="logo">BusineX</div>
        </div>
        <div class="content">
          <h2>⚠️ Payroll Processing Failed</h2>
          <p>Hello ${data.adminName},</p>
          <p>We encountered an issue while processing your payroll for ${
            data.period
          }.</p>
          <p><strong>Error:</strong> ${data.errorMessage}</p>
          <p>Please review and try again. If you need assistance, our support team is here to help.</p>
          <a href="${data.dashboardUrl}" class="button">Review Payroll</a>
        </div>
        <div class="footer">
          <p> ${new Date().getFullYear()} BusineX. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `,

  payslip: (data) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Payslip is Ready</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          background-color: #f4f4f4;
        }
        .email-container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
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
        }
        .footer {
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: #666666;
          background-color: #f9f9f9;
        }
        .button {
          display: inline-block;
          padding: 12px 24px;
          background-color: #004D40;
          color: white !important;
          text-decoration: none;
          border-radius: 4px;
          margin: 20px 0;
          text-align: center;
        }
        .summary-list {
          list-style: none;
          padding: 15px;
          background-color: #f5f5f5;
          border-radius: 4px;
          margin: 20px 0;
        }
        .summary-list li {
          margin: 10px 0;
          color: #555555;
        }
        h2 {
          color: #333333;
          margin-bottom: 20px;
        }
        p {
          margin-bottom: 15px;
          color: #555555;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <div class="logo">BusineX</div>
        </div>
        <div class="content">
          <h2>Your Payslip is Ready</h2>
          <p>Hello ${data.employeeName},</p>
          <p>Your payslip for ${data.period} is now available.</p>
          <p><strong>Summary:</strong></p>
          <ul class="summary-list">
            <li>Net Pay: ${formatCurrency(data.netPay)}</li>
            <li>Pay Period: ${formatDate(data.period)}</li>
          </ul>
          <a href="${data.payslipUrl}" class="button">View Payslip</a>
        </div>
        <div class="footer">
          <p> ${new Date().getFullYear()} BusineX. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `,

  // Employee Templates
  employeeCreated: (data) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to ${data.companyName}!</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          background-color: #f4f4f4;
        }
        .email-container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
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
        }
        .footer {
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: #666666;
          background-color: #f9f9f9;
        }
        .button {
          display: inline-block;
          padding: 12px 24px;
          background-color: #004D40;
          color: white !important;
          text-decoration: none;
          border-radius: 4px;
          margin: 20px 0;
          text-align: center;
        }
        .steps-list {
          list-style: none;
          padding: 15px;
          background-color: #f5f5f5;
          border-radius: 4px;
          margin: 20px 0;
        }
        .steps-list li {
          margin: 10px 0;
          color: #555555;
        }
        h2 {
          color: #333333;
          margin-bottom: 20px;
        }
        p {
          margin-bottom: 15px;
          color: #555555;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <div class="logo">BusineX</div>
        </div>
        <div class="content">
          <h2>Welcome to ${data.companyName}!</h2>
          <p>Hello ${data.employeeName},</p>
          <p>Your employee profile has been created in BusineX. Please complete your profile setup to access your payroll information.</p>
          <p><strong>Next steps:</strong></p>
          <ol class="steps-list">
            <li>Set up your password</li>
            <li>Complete your profile information</li>
            <li>Add your bank details</li>
          </ol>
          <a href="${data.setupUrl}" class="button">Complete Setup</a>
        </div>
        <div class="footer">
          <p> ${new Date().getFullYear()} BusineX. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `,

  // Additional Templates
  lowWalletBalance: (data) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>⚠️ Low Wallet Balance Alert</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          background-color: #f4f4f4;
        }
        .email-container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
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
        }
        .footer {
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: #666666;
          background-color: #f9f9f9;
        }
        .button {
          display: inline-block;
          padding: 12px 24px;
          background-color: #004D40;
          color: white !important;
          text-decoration: none;
          border-radius: 4px;
          margin: 20px 0;
          text-align: center;
        }
        h2 {
          color: #333333;
          margin-bottom: 20px;
        }
        p {
          margin-bottom: 15px;
          color: #555555;
        }
      </style>
    </head>
    <body>
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
          <p> 2024 BusineX. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `,

  waitlistSignup: (data) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to BusineX Waitlist! 🎉</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          background-color: #f4f4f4;
        }
        .email-container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
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
        }
        .footer {
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: #666666;
          background-color: #f9f9f9;
        }
        h2 {
          color: #333333;
          margin-bottom: 20px;
        }
        p {
          margin-bottom: 15px;
          color: #555555;
        }
      </style>
    </head>
    <body>
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
          <p> 2024 BusineX. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `,
};

module.exports = {
  templates,
};
