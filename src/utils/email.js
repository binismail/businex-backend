const formData = require("form-data");
const Mailgun = require("mailgun.js");

class EmailService {
  constructor() {
    // Validate Mailgun configuration
    if (!process.env.MAILGUN_API_KEY || !process.env.MAILGUN_DOMAIN) {
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
    this.defaultSender = `Businex <noreply@${process.env.MAILGUN_DOMAIN}>`;
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
        html: options.html,
      };

      const response = await this.client.messages.create(
        process.env.MAILGUN_DOMAIN,
        messageData
      );

      console.log("Email sent successfully:", response);
      return response;
    } catch (error) {
      console.error("Email sending failed:", error);
      throw error;
    }
  }

  /**
   * Send welcome email to new user
   * @param {Object} user - User details
   */
  async sendWelcomeEmail(user) {
    const subject = "Welcome to Businex!";
    const text = `Hello ${user.name},\n\nWelcome to Businex! We're excited to have you on board.`;
    const html = `
      <h1>Welcome to Businex!</h1>
      <p>Hello ${user.name},</p>
      <p>We're excited to have you join our platform. Get started by exploring your dashboard.</p>
      <a href="${process.env.FRONTEND_URL}/login">Login to Businex</a>
    `;

    await this.sendEmail({
      to: user.email,
      subject,
      text,
      html,
    });
  }

  /**
   * Send password reset email
   * @param {Object} user - User details
   * @param {string} resetToken - Password reset token
   */
  async sendPasswordResetEmail(user, resetToken) {
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    const subject = "Password Reset Request";
    const text = `You requested a password reset. Click the following link to reset your password: ${resetLink}`;
    const html = `
      <h2>Password Reset Request</h2>
      <p>You requested a password reset. Click the button below to reset your password:</p>
      <a href="${resetLink}" style="background-color: #4CAF50; color: white; padding: 14px 25px; text-align: center; text-decoration: none; display: inline-block;">
        Reset Password
      </a>
      <p>If you did not request a password reset, please ignore this email.</p>
    `;

    await this.sendEmail({
      to: user.email,
      subject,
      text,
      html,
    });
  }

  /**
   * Send notification email
   * @param {Object} options - Notification details
   */
  async sendNotificationEmail(options) {
    const { recipient, subject, message, actionUrl, actionText } = options;

    const html = `
      <h2>${subject}</h2>
      <p>${message}</p>
      ${
        actionUrl
          ? `<a href="${actionUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none;">${
              actionText || "Take Action"
            }</a>`
          : ""
      }
    `;

    await this.sendEmail({
      to: recipient,
      subject,
      text: message,
      html,
    });
  }
}

module.exports = new EmailService();
