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
  otpVerification: (data) => `
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
          <h2>Your OTP Code for Secure Access</h2>
          <p>Dear ${data.userName || "User"},</p>
          <p>Your one-time password (OTP) for secure access to BusineX is:</p>
          <div class="otp-code">${data.otp}</div>
          <p>This OTP is valid for 10 minutes and should not be shared with anyone.</p>
          <p style="color: #666; font-size: 12px;">If you did not request this code, please ignore this email.</p>
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
          <h2>Your Onboarding is Under Review</h2>
          <p>Dear ${data.userName},</p>
          <p>Thank you for completing your onboarding process with BusineX. Your details are currently under review, and we will notify you once the process is complete.</p>
          <p>If we need any additional information, we will reach out to you directly. Our team typically completes the review within 1-2 business days.</p>
          <p style="margin-top: 20px;">Should you have any questions, feel free to contact us at <a href="mailto:support@businex.com" style="color: #004D40;">support@businex.com</a>.</p>
          <a href="${data.dashboardUrl}" class="button">Check Review Status</a>
        </div>
        <div class="footer">
          <p> ${new Date().getFullYear()} BusineX. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `,

  // Company Onboarding Templates
  signupEmail: (data) => `
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
          <h2>Thank you for signing up</h2>
          <p>Dear ${data.userName},</p>
          <p>Thank you for signing up with BusineX. Kindly go ahead and complete your company onboarding process to start using the platform.</p>
          <p style="margin-top: 20px;">Should you have any questions, feel free to contact us at <a href="mailto:support@businex.com" style="color: #004D40;">support@businex.com</a>.</p>
          <a href="${data.dashboardUrl}" class="button">Start Using BusineX</a>
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
          <h2>Congratulations! Your Company is Now Approved</h2>
          <p>Dear ${data.userName},</p>
          <p>We are pleased to inform you that your company, ${
            data.companyName
          }, has been successfully approved on BusineX.</p>
          <p>You can now:</p>
          <ul style="list-style: none; padding: 0; margin: 15px 0;">
            <li style="margin: 8px 0;">✓ Access your comprehensive dashboard</li>
            <li style="margin: 8px 0;">✓ Onboard and manage employees</li>
            <li style="margin: 8px 0;">✓ Process payroll seamlessly</li>
            <li style="margin: 8px 0;">✓ Utilize all HR management features</li>
          </ul>
          <p>Click below to log in and get started:</p>
          <a href="${
            data.dashboardUrl
          }" class="button">Access Your Dashboard</a>
          <p style="margin-top: 20px;">If you have any questions about getting started, our support team is here to help at <a href="mailto:support@businex.com" style="color: #004D40;">support@businex.com</a>.</p>
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
      <title>Payroll Successfully Processed - ${formatDate(
        data.processDate
      )}</title>
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
        .details-section {
          padding: 15px;
          background-color: #f5f5f5;
          border-radius: 4px;
          margin: 20px 0;
        }
        .details-row {
          display: flex;
          justify-content: space-between;
          margin: 10px 0;
          color: #555555;
        }
        .total-row {
          font-weight: bold;
          border-top: 2px solid #004D40;
          padding-top: 10px;
          margin-top: 10px;
        }
        h2, h3 {
          color: #333333;
          margin-bottom: 15px;
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
          <p>Dear ${data.adminName},</p>
          <p>We are pleased to inform you that the payroll for ${formatDate(
            data.periodStart
          )} to ${formatDate(
    data.periodEnd
  )} has been successfully processed. All employee salaries have been disbursed according to the schedule.</p>
          <p>Here's a comprehensive breakdown of this payroll cycle:</p>
          
          <div class="details-section">
            <h3>Payroll Summary</h3>
            <div class="details-row">
              <span>Total Employees:</span>
              <span>${data.employeeCount}</span>
            </div>
            <div class="details-row">
              <span>Basic Salaries:</span>
              <span>${formatCurrency(data.basicSalariesTotal)}</span>
            </div>
            <div class="details-row">
              <span>Total Allowances:</span>
              <span>${formatCurrency(data.allowancesTotal)}</span>
            </div>
            <div class="details-row">
              <span>Total Deductions:</span>
              <span>-${formatCurrency(data.deductionsTotal)}</span>
            </div>
            <div class="details-row total-row">
              <span>Total Disbursement:</span>
              <span>${formatCurrency(data.totalAmount)}</span>
            </div>
          </div>

          <div class="details-section">
            <h3>Processing Details</h3>
            <div class="details-row">
              <span>Pay Period:</span>
              <span>${formatDate(data.periodStart)} to ${formatDate(
    data.periodEnd
  )}</span>
            </div>
            <div class="details-row">
              <span>Processing Date:</span>
              <span>${formatDate(data.processDate)}</span>
            </div>
            <div class="details-row">
              <span>Payment Status:</span>
              <span style="color: #004D40; font-weight: bold;">Initiated</span>
            </div>
          </div>

          <p>All payslips have been generated and will be sent to employees shortly. You can view detailed reports and download payroll documents from your dashboard.</p>
          
          <a href="${data.dashboardUrl}" class="button">View Detailed Report</a>
          
          <p style="margin-top: 20px; font-size: 12px;">Need assistance? Contact our support team at support@businex.com</p>
        </div>
        <div class="footer">
          <p> 2024 BusineX. All rights reserved.</p>
          <p style="margin-top: 10px;">This is an automated email. Please do not reply.</p>
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
      <title> Payroll Processing Failed - Action Required</title>
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
        .error-section {
          background-color: #FFF3F3;
          border: 1px solid #FFD7D7;
          border-radius: 4px;
          padding: 15px;
          margin: 20px 0;
        }
        .error-title {
          color: #D32F2F;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .error-message {
          color: #D32F2F;
          font-family: monospace;
          background: #FFE9E9;
          padding: 10px;
          border-radius: 4px;
          margin: 10px 0;
        }
        .details-section {
          background-color: #f5f5f5;
          border-radius: 4px;
          padding: 15px;
          margin: 20px 0;
        }
        .details-row {
          display: flex;
          justify-content: space-between;
          margin: 8px 0;
          color: #555555;
        }
        .action-steps {
          background-color: #E8F5E9;
          border: 1px solid #C8E6C9;
          border-radius: 4px;
          padding: 15px;
          margin: 20px 0;
        }
        .action-steps h3 {
          color: #2E7D32;
          margin-bottom: 10px;
        }
        .action-steps ul {
          list-style-type: none;
          padding: 0;
        }
        .action-steps li {
          margin: 8px 0;
          padding-left: 20px;
          position: relative;
        }
        .action-steps li:before {
          content: ' ';
          position: absolute;
          left: 0;
          color: #2E7D32;
        }
        h2, h3 {
          color: #333333;
          margin-bottom: 15px;
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
          <h2> Payroll Processing Failed</h2>
          <p>Hello ${data.adminName},</p>
          <p>We encountered an issue while attempting to process the payroll for ${
            data.period
          }. Immediate attention is required to ensure timely payment to your employees.</p>
          <div class="details-section">
            <h3>Payroll Details</h3>
            <div class="details-row">
              <span>Pay Period:</span>
              <span>${formatDate(data.periodStart)} to ${formatDate(
    data.periodEnd
  )}</span>
            </div>
            <div class="details-row">
              <span>Affected Employees:</span>
              <span>${data.affectedEmployees || "All"}</span>
            </div>
            <div class="details-row">
              <span>Attempted Processing Time:</span>
              <span>${formatDate(data.processDate)}</span>
            </div>
          </div>

          <div class="error-section">
            <div class="error-title">Error Details</div>
            <div class="error-message">${data.errorMessage}</div>
            ${data.errorDetails ? `<p>${data.errorDetails}</p>` : ""}
          </div>

          <div class="action-steps">
            <h3>Recommended Actions</h3>
            <ul>
              ${
                data.recommendedActions
                  ? data.recommendedActions
                      .map((action) => `<li>${action}</li>`)
                      .join("")
                  : `<li>Review the error message and payroll details</li>
                 <li>Ensure all employee information is complete and accurate</li>
                 <li>Verify sufficient funds in your account</li>
                 <li>Check for any policy violations or compliance issues</li>`
              }
            </ul>
          </div>

          <p>Click the button below to review and resolve these issues:</p>
          <a href="${data.dashboardUrl}" class="button">Review Payroll</a>
          
          <p style="margin-top: 20px;">Need immediate assistance? Our support team is available to help:</p>
          <ul style="list-style: none; padding: 0;">
            <li> Email: support@businex.com</li>
            <li> Phone: +234 XXX XXX XXXX</li>
          </ul>
        </div>
        <div class="footer">
          <p> 2024 BusineX. All rights reserved.</p>
          <p style="margin-top: 10px;">This is an automated email. Please do not reply.</p>
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
      <title>Your Payslip for ${formatDate(data.period)}</title>
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
        .payslip-section {
          margin: 15px 0;
          padding: 15px;
          background-color: #f5f5f5;
          border-radius: 4px;
        }
        .payslip-row {
          display: flex;
          justify-content: space-between;
          margin: 8px 0;
          color: #555555;
        }
        .payslip-total {
          font-weight: bold;
          border-top: 2px solid #004D40;
          padding-top: 8px;
          margin-top: 8px;
        }
        h2, h3 {
          color: #333333;
          margin-bottom: 15px;
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
          <h2>Your Payslip for ${formatDate(data.period)} is Ready</h2>
          <p>Dear ${data.employeeName},</p>
          <p>Your payslip for ${formatDate(
            data.period
          )} is now available. Please find below a detailed breakdown of your salary components:</p>
          <p style="color: #666; font-size: 13px;">Note: This payslip serves as an official record of your earnings and deductions. Please save it for your records.</p>
          
          <div class="payslip-section">
            <h3>Basic Information</h3>
            <div class="payslip-row">
              <span>Employee ID:</span>
              <span>${data.employeeId}</span>
            </div>
            <div class="payslip-row">
              <span>Department:</span>
              <span>${data.department}</span>
            </div>
            <div class="payslip-row">
              <span>Pay Period:</span>
              <span>${formatDate(data.period)}</span>
            </div>
          </div>

          <div class="payslip-section">
            <h3>Earnings</h3>
            <div class="payslip-row">
              <span>Basic Salary:</span>
              <span>${formatCurrency(data.basicSalary)}</span>
            </div>
            ${data.allowances
              .map(
                (allowance) => `
              <div class="payslip-row">
                <span>${allowance.name}:</span>
                <span>${formatCurrency(allowance.amount)}</span>
              </div>
            `
              )
              .join("")}
            <div class="payslip-row payslip-total">
              <span>Gross Pay:</span>
              <span>${formatCurrency(data.grossPay)}</span>
            </div>
          </div>

          <div class="payslip-section">
            <h3>Deductions</h3>
            ${data.deductions
              .map(
                (deduction) => `
              <div class="payslip-row">
                <span>${deduction.name}:</span>
                <span>-${formatCurrency(deduction.amount)}</span>
              </div>
            `
              )
              .join("")}
            <div class="payslip-row payslip-total">
              <span>Total Deductions:</span>
              <span>-${formatCurrency(data.totalDeductions)}</span>
            </div>
          </div>

          <div class="payslip-section">
            <h3>Net Pay</h3>
            <div class="payslip-row payslip-total">
              <span>Net Pay:</span>
              <span>${formatCurrency(data.netPay)}</span>
            </div>
          </div>

          <p>To access your complete payroll history and download previous payslips, please visit your employee dashboard:</p>
          <a href="${data.dashboardUrl}" class="button">View Payment History</a>
          <p style="margin-top: 20px; color: #666; font-size: 13px;">If you have any questions about your payslip, please reach out to your HR or payroll administrator.</p>
          <p style="color: #666; font-size: 12px;">This is an automated email. Please do not reply.</p>
          <a href="${data.payslipUrl}" class="button">View Full Payslip</a>
          
          <p style="margin-top: 20px; font-size: 12px;">If you have any questions about your payslip, please contact your HR department or reach out to our support team at support@businex.com</p>
        </div>
        <div class="footer">
          <p> 2024 BusineX. All rights reserved.</p>
          <p style="margin-top: 10px;">This is an automated email. Please do not reply.</p>
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
          <h2>Welcome to BusineX! Your Employee Profile is Set Up</h2>
          <p>Dear ${data.employeeName},</p>
          <p>You have been successfully added to the ${
            data.companyName
          } HR system on Businex:</p>
          <p style="margin-top: 20px; color: #666; font-size: 13px;">For any assistance during the setup process, please contact your HR team at <a href="mailto:${
            data.hrEmail
          }" style="color: #004D40;">${data.hrEmail}</a>.</p>
          <p style="color: #666; font-size: 12px;">This is an automated email. Please do not reply.</p>
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
      <title> Low Wallet Balance Alert</title>
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
          <h2>Action Required: Insufficient Account Balance for Payroll</h2>
          <p>Dear ${data.adminName},</p>
          <p>We encountered an issue while processing payroll for ${formatDate(
            data.payrollPeriod
          )} due to insufficient funds in your designated account. As a result, employee payments have not been completed.</p>
          <div style="background-color: #fff3e0; padding: 15px; border-radius: 4px; margin: 20px 0;">
            <p style="color: #e65100; margin: 0;"><strong>Account Status:</strong></p>
            <p style="margin: 10px 0;">Current Balance: <strong>${
              data.currentBalance
            }</strong></p>
            <p style="margin: 10px 0;">Required Amount: <strong>${
              data.upcomingPayroll
            }</strong></p>
            <p style="margin: 10px 0;">Shortfall: <strong>${formatCurrency(
              data.upcomingPayroll - data.currentBalance
            )}</strong></p>
          </div>
          <p>Please ensure that your account is funded and retry the payroll processing. You can update payment details and take necessary action via your BusineX dashboard:</p>
          <a href="${data.walletUrl}" class="button">Fund Account Now</a>
          <p style="margin-top: 20px; color: #666; font-size: 13px;">For immediate assistance, contact our support team at <a href="mailto:support@businex.com" style="color: #004D40;">support@businex.com</a>.</p>
          <p style="color: #666; font-size: 12px;">This is an automated email. Please do not reply.</p>
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
      <title>Welcome to BusineX Waitlist! </title>
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
          <h2>Welcome to BusineX Waitlist! </h2>
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

  kycDocumentRejected: (data) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Document Verification Update</title>
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
          <h2>Document Verification Update</h2>
          <p>Dear ${data.userName},</p>
          <p>Your ${data.documentType} document was not approved.</p>
          <p><strong>Reason:</strong> ${data.rejectionReason}</p>
          <p>Please update and resubmit your document.</p>
          <a href="${data.kycUrl}" class="button">Update Documents</a>
          <p style="margin-top: 20px;">If you need assistance, please contact our support team.</p>
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
