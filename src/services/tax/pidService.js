const axios = require("axios");

class PidService {
  constructor() {
    this.baseUrl = process.env.TAX_API_BASE_URL;
    this.apiKey = process.env.TAX_API_API_KEY;
  }

  async createPidWithBVN(userData) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/merchant/bill/LASG/CreatePIDBVN`,
        {
          type: "N",
          Title: userData.title,
          Sex: userData.sex,
          LastName: userData.lastName,
          FirstName: userData.firstName,
          MiddleName: userData.middleName,
          MaritalStatus: userData.maritalStatus,
          DateOfBirth: userData.dateOfBirth,
          PhoneNumber: userData.phoneNumber,
          email: userData.email,
          Address: userData.address,
          BVNNumber: userData.bvnNumber,
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
        "PID Creation with BVN failed:",
        error.response?.data || error.message
      );
      throw error;
    }
  }

  async createPidWithNIN(userData) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/merchant/bill/LASG/CreatePIDNIN`,
        {
          type: "N",
          Title: userData.title,
          Sex: userData.sex,
          LastName: userData.lastName,
          FirstName: userData.firstName,
          MiddleName: userData.middleName,
          MaritalStatus: userData.maritalStatus,
          DateOfBirth: userData.dateOfBirth,
          PhoneNumber: userData.phoneNumber,
          email: userData.email,
          Address: userData.address,
          ninNumber: userData.ninNumber,
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
        "PID Creation with NIN failed:",
        error.response?.data || error.message
      );
      throw error;
    }
  }

  async verifyPid(pid) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/merchant/bill/LASG/VerifyPID`,
        {
          pid,
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
        "PID Verification failed:",
        error.response?.data || error.message
      );
      throw error;
    }
  }
}

module.exports = new PidService();
