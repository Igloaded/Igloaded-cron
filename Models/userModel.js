import mongoose from 'mongoose';
import {
	epochCurrent,
	addToEpoch,
} from '../Reusables/getTimestamp.js';

const limitsSchema = new mongoose.Schema({
	isReelTrackingEnabled: {
		type: Boolean,
	},
	maxReelsPerMonth: { type: Number },
	maxReelsPerDay: { type: Number },
	dailyReelCount: { type: Number },
	lastReelReset: { type: Number },
	isSearchingEnabled: {
		type: Boolean,
	},
	maxSearchPerMonth: { type: Number },
	maxSearchPerDay: { type: Number },
	dailySearchCount: { type: Number },
	lastSearchReset: {
		type: Number,
	},
	isRequestScanningEnabled: {
		type: Boolean,
	},
	maxScanPerMonth: { type: Number },
	maxScanPerDay: { type: Number },
	dailyScanCount: { type: Number },
	lastScanReset: { type: Number },
});

const newResetDate = addToEpoch(1);

const limitsDefault = {
	isReelTrackingEnabled: false,
	maxReelsPerMonth: 0,
	maxReelsPerDay: 0,
	dailyReelCount: 0,
	lastReelReset: newResetDate,
	isSearchingEnabled: true,
	maxSearchPerMonth: 100,
	maxSearchPerDay: 100,
	dailySearchCount: 0,
	lastSearchReset: newResetDate,
	isRequestScanningEnabled: true,
	maxScanPerMonth: 300,
	maxScanPerDay: 10,
	dailyScanCount: 0,
	lastScanReset: newResetDate,
};

const userSchema = new mongoose.Schema(
	{
		name: { type: String, required: true },
		email: { type: String, required: true },
		password: { type: String, required: true },
		isAdmin: {
			type: Boolean,
			default: false,
		},
		isVerified: {
			type: Boolean,
			default: false,
		},
		isBlocked: {
			type: Boolean,
			default: false,
		},
		credits: {
			type: Number,
			required: true,
			default: 0,
		},
		activity: {
			type: Object,
			required: true,
			default: {
				transactions: 0,
				reels: 0,
				searches: 0,
				scans: 0,
			},
		},
		plan: {
			type: Object,
			required: true,
			default: {
				planName: 'Free',
				planExpiry: null,
				planPurchaseDate: null,
				planPrice: 0,
				isExtensionEnabled: false,
				extensionUsernames: [],
			},
		},
		limits: {
			type: limitsSchema,
			default: limitsDefault,
		},
	},
	{
		timestamps: true,
	}
);

const User = mongoose.model('User', userSchema);

export default User;
