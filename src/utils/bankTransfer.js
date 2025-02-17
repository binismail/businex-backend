exports.processBankTransfer = async (bankAccount, amount) => {
  try {
    // Call to your bank's API
    // Example: const response = await axios.post('https://bankapi.com/transfer', {...});

    // Mock response
    return {
      success: true,
      transactionId: "TRANS123456",
    };
  } catch (error) {
    console.error("Bank transfer failed:", error);
    return {
      success: false,
    };
  }
};
