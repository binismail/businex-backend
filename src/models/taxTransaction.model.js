const mongoose = require('mongoose');

const taxTransactionSchema = new mongoose.Schema({
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    payroll: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payroll',
        required: true
    },
    month: {
        type: Date,
        required: true
    },
    total_amount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed', 'late'],
        default: 'pending'
    },
    payment_reference: String,
    receipt_number: String,
    applied_date: Date,
    processed_date: Date,
    processing_history: [{
        status: String,
        message: String,
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    breakdown: [{
        employee: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Employee'
        },
        pid: String,
        amount: Number,
        tax_breakdown: [{
            name: String,
            amount: Number,
            rate: Number,
            tax: Number
        }],
        status: {
            type: String,
            enum: ['pending', 'processed', 'failed'],
            default: 'pending'
        }
    }],
    retry_count: {
        type: Number,
        default: 0
    },
    last_retry: Date,
    metadata: {
        type: Map,
        of: mongoose.Schema.Types.Mixed
    }
}, {
    timestamps: true
});

// Indexes
taxTransactionSchema.index({ company: 1, month: 1 });
taxTransactionSchema.index({ status: 1 });
taxTransactionSchema.index({ payment_reference: 1 });

const TaxTransaction = mongoose.model('TaxTransaction', taxTransactionSchema);
module.exports = TaxTransaction;
