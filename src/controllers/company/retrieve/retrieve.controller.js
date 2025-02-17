const axios = require("axios");
const Company = require("../../../models/company.model");
const User = require("../../../models/user.model");

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const { userId } = req.params; // Extract userId from request parameters

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Send user data as a response
    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({
      message: `Error retrieving user: ${error.message}`,
    });
  }
};

// Get company by user ID
exports.getCompanyById = async (req, res) => {
  try {
    const { id } = req.params; // Extract userId from request parameters

    // Assuming 'user' is a reference field in your company model
    const company = await Company.findById(id);
    if (!company) {
      return res
        .status(404)
        .json({ message: "Company not found for this user" });
    }

    // Send company data as a response
    return res
      .status(200)
      .json({ message: "Company retrieved successfully", data: company });
  } catch (error) {
    return res.status(500).json({
      message: `Error retrieving company: ${error.message}`,
    });
  }
};

// Get wallet from an external API
exports.getCompanyWallet = async (req, res) => {
  try {
    const { id } = req.params; // Extract userId from request parameters

    // Replace 'API_ENDPOINT' with the actual API endpoint URL
    const response = await axios.get(
      `${process.env.PAY4IT_WALLET_BASE}/wallet`,
      {
        params: { id }, // Assuming wallet API accepts userId as a query parameter
      }
    );

    if (!response.data) {
      return res
        .status(404)
        .json({ message: "Wallet not found for this user" });
    }

    // Send wallet data as a response
    return res.status(200).json(response.data);
  } catch (error) {
    return res.status(500).json({
      message: `Error retrieving wallet: ${
        error.response ? error.response.data : error.message
      }`,
    });
  }
};
