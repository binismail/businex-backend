const axios = require("axios");

class TaxPaymentService {
  constructor() {
    this.baseUrl = process.env.TAX_API_BASE_URL;
    this.apiKey = process.env.TAX_API_API_KEY;
  }

  async processTaxPayment(paymentData) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/merchant/bill/LASG/PAYETax`,
        {
          pid: paymentData.pid,
          amount: paymentData.amount,
          appliedDate: paymentData.appliedDate,
          email: paymentData.email,
          mobile: paymentData.mobile,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error(
        "Tax payment processing failed:",
        error.response?.data || error.message
      );
      throw error;
    }
  }

  async reprocessPayment(paymentRef) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/merchant/bill/LASG/ReProcessPayment`,
        {
          paymentRef,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error(
        "Payment reprocessing failed:",
        error.response?.data || error.message
      );
      throw error;
    }
  }

  async reversePayment(paymentRef) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/merchant/bill/LASG/ReversePayment`,
        {
          apiKey: this.apiKey,
          paymentRef,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error(
        "Payment reversal failed:",
        error.response?.data || error.message
      );
      throw error;
    }
  }

  async verifyPaymentStatus(paymentRef) {
    try {
      // First try to verify through reprocess endpoint
      const response = await this.reprocessPayment(paymentRef);

      if (response.data && response.data.status === "success") {
        return {
          verified: true,
          status: "completed",
          data: response.data,
        };
      }

      return {
        verified: false,
        status: "pending",
        message: "Payment not verified",
      };
    } catch (error) {
      console.error(
        "Payment verification failed:",
        error.response?.data || error.message
      );
      throw error;
    }
  }
}

module.exports = new TaxPaymentService();
