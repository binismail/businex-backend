const formData = require("form-data");
const Mailgun = require("mailgun.js");
const { baseStyle, templates } = require("./emailTemplates");
require("dotenv").config();

class EmailService {
  constructor() {
    // Validate Mailgun configuration
    if (!process.env.MAILGUN_API_KEY || !process.env.MAILGUN_DOMAIN) {
      console.error("Missing Mailgun configuration:", {
        MAILGUN_API_KEY: !!process.env.MAILGUN_API_KEY,
        MAILGUN_DOMAIN: !!process.env.MAILGUN_DOMAIN,
      });
      throw new Error(
        "Mailgun configuration is missing. Please set MAILGUN_API_KEY and MAILGUN_DOMAIN"
      );
    }

    // Initialize Mailgun
    this.mailgun = new Mailgun(formData);
    this.client = this.mailgun.client({
      username: "api",
      key: process.env.MAILGUN_API_KEY,
    });

    // Default sender
    this.defaultSender = `Businex <kabcoder@gmail.com>`;
  }

  /**
   * Send a generic email
   * @param {Object} options - Email configuration
   * @param {string} options.to - Recipient email
   * @param {string} [options.from] - Sender email (optional)
   * @param {string} options.subject - Email subject
   * @param {string} options.text - Plain text email body
   * @param {string} [options.html] - HTML email body (optional)
   * @returns {Promise<Object>} Mailgun send response
   */
  async sendEmail(options) {
    try {
      const messageData = {
        from: options.from || this.defaultSender,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html ? baseStyle + options.html : undefined,
      };

      const response = await this.client.messages.create(
        process.env.MAILGUN_DOMAIN,
        messageData
      );
      console.log("Email sent successfully:", response);
      return response;
    } catch (error) {
      console.error("Email sending failed:", error);
      // Log more details about the error
      if (error.response) {
        console.error("Mailgun API Error:", {
          status: error.response.status,
          data: error.response.data,
        });
      }
      throw error;
    }
  }

  // Authentication Emails
  async sendOTPEmail(email, otp, userName) {
    const templateData = {
      otp,
      userName,
      email,
    };
    return this.sendEmail({
      to: email,
      subject: "Your OTP Code for Secure Access",
      text: `Dear ${
        userName || "User"
      }, Your one-time password (OTP) for secure access to BusineX is: ${otp}`,
      html: templates.otpVerification(templateData),
    });
  }

  // Company Onboarding Emails
  async sendOnboardingReviewEmail(companyData) {
    const templateData = {
      userName: companyData.adminName || companyData.contactName,
      companyName: companyData.companyName,
      dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`,
      email: companyData.email,
    };
    return this.sendEmail({
      to: companyData.email,
      subject: "Your Onboarding is Under Review",
      text: `Dear ${templateData.userName}, Thank you for completing your onboarding process with BusineX. Your details are currently under review.`,
      html: templates.onboardingReview(templateData),
    });
  }

  async sendCompanyApprovalEmail(companyData) {
    const templateData = {
      userName: companyData.adminName || companyData.contactName,
      companyName: companyData.companyName,
      dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`,
      email: companyData.email,
    };
    return this.sendEmail({
      to: companyData.email,
      subject: "Congratulations! Your Company is Now Approved",
      text: `Dear ${templateData.userName}, We are pleased to inform you that your company, ${companyData.companyName}, has been successfully approved on BusineX.`,
      html: templates.companyApproved(templateData),
    });
  }

  // Payroll Emails
  async sendPayrollProcessedEmail(payrollData) {
    return this.sendEmail({
      to: payrollData.adminEmail,
      subject: "Payroll Successfully Processed",
      text: `Your payroll for ${payrollData.period} has been processed successfully.`,
      html: templates.payrollProcessed(payrollData),
    });
  }

  async sendPayrollFailedEmail(payrollData) {
    return this.sendEmail({
      to: payrollData.adminEmail,
      subject: "Payroll Processing Failed",
      text: `There was an error processing your payroll for ${payrollData.period}.`,
      html: templates.payrollFailed(payrollData),
    });
  }

  async sendPayslipEmail(payslipData) {
    return this.sendEmail({
      to: payslipData.employeeEmail,
      subject: `Your Payslip for ${payslipData.period}`,
      text: `Your payslip for ${payslipData.period} is now available.`,
      html: templates.payslip(payslipData),
    });
  }

  // Employee Emails
  async sendEmployeeWelcomeEmail(employeeData) {
    const templateData = {
      userName: employeeData.firstName + " " + employeeData.lastName,
      employeeName: employeeData.firstName + " " + employeeData.lastName,
      companyName: employeeData.companyName,
      setupUrl: `${process.env.FRONTEND_URL}/employee/setup/${employeeData.setupToken}`,
      hrEmail: employeeData.hrEmail || "support@businex.com",
      email: employeeData.email,
    };
    return this.sendEmail({
      to: employeeData.email,
      subject: `Welcome to BusineX! Your Employee Profile is Set Up`,
      text: `Dear ${templateData.userName}, Welcome to ${employeeData.companyName}! You have been successfully added to your company's HR system on BusineX.`,
      html: templates.employeeCreated(templateData),
    });
  }

  // Wallet Emails
  async sendLowBalanceAlert(walletData) {
    const templateData = {
      adminName: walletData.adminName,
      payrollPeriod: walletData.payrollPeriod,
      currentBalance: walletData.currentBalance,
      upcomingPayroll: walletData.upcomingPayroll,
      walletUrl: `${process.env.FRONTEND_URL}/wallet/fund`,
      adminEmail: walletData.adminEmail,
    };
    return this.sendEmail({
      to: walletData.adminEmail,
      subject: "Action Required: Insufficient Account Balance for Payroll",
      text: `Dear ${templateData.adminName}, We encountered an issue while processing payroll for ${templateData.payrollPeriod} due to insufficient funds in your designated account.`,
      html: templates.lowWalletBalance(templateData),
    });
  }

  // Waitlist Emails
  async sendWaitlistConfirmation(waitlistData) {
    return this.sendEmail({
      to: waitlistData.email,
      subject: "Welcome to BusineX Waitlist",
      text: `Thank you for joining our waitlist, ${waitlistData.firstName}!`,
      html: templates.waitlistSignup(waitlistData),
    });
  }
}

module.exports = new EmailService();
