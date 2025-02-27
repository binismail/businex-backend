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
  async sendOTPEmail(email, otp) {
    return this.sendEmail({
      to: email,
      subject: "Your Verification Code",
      text: `Your verification code is: ${otp}`,
      html: templates.otpVerification(otp),
    });
  }

  // Company Onboarding Emails
  async sendOnboardingReviewEmail(companyData) {
    return this.sendEmail({
      to: companyData.email,
      subject: "Onboarding Under Review",
      text: `Hello ${companyData.companyName}, Your onboarding documents are under review.`,
      html: templates.onboardingReview(companyData),
    });
  }

  async sendCompanyApprovalEmail(companyData) {
    return this.sendEmail({
      to: companyData.email,
      subject: "Welcome to BusineX! Company Approved",
      text: `Congratulations! Your company ${companyData.companyName} has been approved.`,
      html: templates.companyApproved(companyData),
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
    return this.sendEmail({
      to: employeeData.email,
      subject: `Welcome to ${employeeData.companyName}`,
      text: `Welcome to ${employeeData.companyName}! Please complete your profile setup.`,
      html: templates.employeeCreated(employeeData),
    });
  }

  // Wallet Emails
  async sendLowBalanceAlert(walletData) {
    return this.sendEmail({
      to: walletData.adminEmail,
      subject: "Low Wallet Balance Alert",
      text: `Your wallet balance is running low. Current balance: ${walletData.currentBalance}`,
      html: templates.lowWalletBalance(walletData),
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
