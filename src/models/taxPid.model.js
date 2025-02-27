const mongoose = require('mongoose');

const taxPidSchema = new mongoose.Schema({
    employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true
    },
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    pid: {
        type: String,
        unique: true,
        sparse: true
    },
    status: {
        type: String,
        enum: ['pending', 'active', 'failed', 'expired'],
        default: 'pending'
    },
    registration_type: {
        type: String,
        enum: ['BVN', 'NIN'],
        required: true
    },
    id_number: {
        type: String,
        required: true
    },
    personal_info: {
        title: String,
        sex: String,
        lastName: String,
        firstName: String,
        middleName: String,
        maritalStatus: String,
        dateOfBirth: Date,
        phoneNumber: String,
        email: String,
        address: String
    },
    verification_history: [{
        status: String,
        message: String,
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    last_verified: Date,
    expiry_date: Date,
    metadata: {
        type: Map,
        of: mongoose.Schema.Types.Mixed
    }
}, {
    timestamps: true
});

// Indexes
taxPidSchema.index({ employee: 1 });
taxPidSchema.index({ company: 1 });
taxPidSchema.index({ pid: 1 });
taxPidSchema.index({ status: 1 });
taxPidSchema.index({ id_number: 1 });

const TaxPid = mongoose.model('TaxPid', taxPidSchema);
module.exports = TaxPid;
