const mongoose = require('mongoose');

const WalletSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  customer: {
    id: { type: String },
    tier: { type: String },
    bvn: { type: String },
    phoneNumber: { type: String },
    email: { type: String },
    firstName: { type: String },
    lastName: { type: String },
    address: { type: String },
    metadata: { type: mongoose.Schema.Types.Mixed }
  },
  wallet: {
    id: { type: String },
    status: { type: String },
    bankName: { type: String },
    bankCode: { type: String },
    walletId: { type: String },
    walletType: { type: String },
    accountName: { type: String },
    accountNumber: { type: String },
    bookedBalance: { type: Number, default: 0 },
    availableBalance: { type: Number, default: 0 },
    accountReference: { type: String }
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'suspended'],
    default: 'pending'
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Wallet', WalletSchema);
