const Waitlist = require('../models/waitlist.model');
const emailService = require('../utils/email');

// Signup for waitlist
exports.signupWaitlist = async (req, res) => {
  try {
    const { 
      firstName, 
      lastName, 
      email, 
      phone, 
      companyName 
    } = req.body;

    // Validate input
    if (!firstName || !lastName || !email || !phone || !companyName) {
      return res.status(400).json({
        message: 'All fields are required',
        requiredFields: ['firstName', 'lastName', 'email', 'phone', 'companyName']
      });
    }

    // Check if email already exists
    const existingEntry = await Waitlist.findOne({ email });
    if (existingEntry) {
      return res.status(409).json({
        message: 'Email is already on the waitlist'
      });
    }

    // Create new waitlist entry
    const waitlistEntry = new Waitlist({
      firstName,
      lastName,
      email,
      phone,
      companyName
    });

    // Save to database
    await waitlistEntry.save();

    // Send confirmation email
    await emailService.sendWaitlistConfirmation({
      firstName,
      email,
      companyName
    });

    res.status(201).json({
      message: 'Successfully added to waitlist',
      data: {
        firstName,
        lastName,
        email,
        companyName
      }
    });
  } catch (error) {
    console.error('Waitlist Signup Error:', error);
    
    // Handle unique constraint violation
    if (error.code === 11000) {
      return res.status(409).json({
        message: 'Email is already on the waitlist'
      });
    }

    res.status(500).json({
      message: 'Error signing up for waitlist',
      error: error.message
    });
  }
};

// Get waitlist entries (admin use)
exports.getWaitlist = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    // Build query
    const query = status ? { status } : {};

    // Paginate results
    const waitlistEntries = await Waitlist.find(query)
      .sort({ signupDate: -1 })
      .limit(Number(limit))
      .skip((page - 1) * limit);

    // Get total count
    const total = await Waitlist.countDocuments(query);

    res.status(200).json({
      message: 'Waitlist retrieved successfully',
      data: waitlistEntries,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / limit),
        totalEntries: total
      }
    });
  } catch (error) {
    console.error('Get Waitlist Error:', error);
    res.status(500).json({
      message: 'Error retrieving waitlist',
      error: error.message
    });
  }
};
