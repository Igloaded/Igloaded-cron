import User from '../../Models/userModel.js';
import {
	epochCurrent,
	addToEpoch,
	epochToDate,
	modifyAddToEpoch,
} from '../../Reusables/getTimestamp.js';

export const resetDailyLimits = async (id) => {
	const userToReset = await User.findById(id);
	if (!userToReset) {
		throw new Error('User not found');
	}
	const currentEpoch = epochCurrent('ms');
	const newResetEpoch = addToEpoch(1);
	userToReset.limits.dailyScanCount = 0;
	userToReset.limits.dailySearchCount = 0;
	userToReset.limits.lastScanReset = newResetEpoch;
	userToReset.limits.lastSearchReset =
		newResetEpoch;
	userToReset.limits.lastReelReset = newResetEpoch;
	userToReset.markModified('limits');
	const resp = await userToReset.save();
	if (resp) {
		return {
			success: true,
			message: 'Daily limits reset successfully',
		};
	}
};

export const resetPlan = async (id) => {
	const userToReset = await User.findById(id);
	if (!userToReset) {
		throw new Error('User not found');
	}
	const newResetEpoch = addToEpoch(1);
	userToReset.plan = {
		planName: 'Free',
		planPurchaseDate: null,
		planExpiry: null,
		planPrice: 0,
		isExtensionEnabled: false,
		extensionUsernames: [],
	};
	userToReset.markModified('plan');
	userToReset.markModified('limits');
	const newRes = await userToReset.save();

	const resp = await User.updateOne(
		{ _id: userToReset._id },
		{
			$set: {
				'plan.planName': 'Free',
				'plan.planPurchaseDate': null,
				'plan.planExpiry': null,
				'plan.planPrice': 0,
				'plan.isExtensionEnabled': false,
				'plan.extensionUsernames': [],
				'limits.isReelTrackingEnabled': false,
				'limits.maxReelsPerDay': 0,
				'limits.maxReelsPerMonth': 0,
				'limits.lastReelReset': newResetEpoch,
				'limits.isSearchingEnabled': true,
				'limits.maxSearchPerDay': 100,
				'limits.maxSearchPerMonth': 100,
				'limits.dailySearchCount': 0,
				'limits.lastSearchReset': newResetEpoch,
				'limits.isRequestScanningEnabled': true,
				'limits.maxScanPerDay': 10,
				'limits.maxScanPerMonth': 300,
				'limits.lastScanReset': newResetEpoch,
			},
		}
	);

	return new Promise((resolve, reject) => {
		if (!newRes || !resp) {
			reject({
				success: false,
				message: 'Plan reset failed',
			});
		} else {
			resolve({
				succcess: true,
				message: 'Plan reset successfully',
			});
		}
	});
};

export const isPlanExpired = async (id) => {
	const user = await User.findById(id);
	if (!user) {
		throw new Error('User not found');
	}
	const currentEpoch = epochCurrent('ms');
	const planExpiry = user.plan.planExpiry;

	if (planExpiry === null) {
		return false;
	}
	if (planExpiry <= currentEpoch) {
		return true;
	}
	return false;
};

export const setPlan = async (
	email,
	planDetails
) => {
	const user = await User.findOne({
		email: email,
	});
	if (!user) {
		throw new Error('User not found');
	}

	const {
		planPrice,
		isExtensionEnabled,
		planName,
		extensionUsernames,
		planPurchaseDate,
	} = planDetails;

	const currentEpoch = planPurchaseDate;
	const planExpiry = modifyAddToEpoch(
		currentEpoch,
		30
	);

	if (planName == 'Professional') {
		user.plan = {
			planName: planName,
			planPurchaseDate: currentEpoch,
			planExpiry: planExpiry,
			planPrice: planPrice,
			isExtensionEnabled: isExtensionEnabled,
			extensionUsernames: extensionUsernames,
		};
		user.limits = {
			isReelTrackingEnabled: true,
			maxReelsPerDay: 200,
			maxReelsPerMonth: 200,
			dailyReelCount: 0,
			lastReelReset: currentEpoch,
			isSearchingEnabled: true,
			maxSearchPerDay: 500,
			maxSearchPerMonth: 500,
			dailySearchCount: 0,
			lastSearchReset: currentEpoch,
			isRequestScanningEnabled: true,
			maxScanPerDay: 300,
			maxScanPerMonth: 1000,
			dailyScanCount: 0,
			lastScanReset: currentEpoch,
		};

		user.markModified('plan');
		user.markModified('limits');
		const res = await user.save();
		if (!res) {
			throw new Error('Plan update failed');
		} else {
			return {
				success: true,
				message: 'Plan updated successfully',
			};
		}
	}
	if (planName == 'Individual') {
		user.plan = {
			planName: planName,
			planPurchaseDate: currentEpoch,
			planExpiry: planExpiry,
			planPrice: planPrice,
			isExtensionEnabled: isExtensionEnabled,
			extensionUsernames: extensionUsernames,
		};
		user.limits = {
			isReelTrackingEnabled: true,
			maxReelsPerDay: 75,
			maxReelsPerMonth: 75,
			dailyReelCount: 0,
			lastReelReset: currentEpoch,
			isSearchingEnabled: true,
			maxSearchPerDay: 300,
			maxSearchPerMonth: 300,
			dailySearchCount: 0,
			lastSearchReset: currentEpoch,
			isRequestScanningEnabled: true,
			maxScanPerDay: 10,
			maxScanPerMonth: 300,
			dailyScanCount: 0,
			lastScanReset: currentEpoch,
		};
		user.markModified('plan');
		user.markModified('limits');
		const res = await user.save();
		if (!res) {
			throw new Error('Plan update failed');
		} else {
			return {
				success: true,
				message: 'Plan updated successfully',
			};
		}
	}
};

export const isResetRequired = async (id) => {
	const user = await User.findById(id);
	if (!user) {
		throw new Error('User not found');
	}
	const currentEpoch = epochCurrent('ms');
	const lastSearchReset =
		user.limits.lastSearchReset;
	const lastScanReset = user.limits.lastScanReset;
	const lastReelReset = user.limits.lastReelReset;

	if (
		currentEpoch > lastSearchReset ||
		currentEpoch > lastScanReset ||
		currentEpoch > lastReelReset
	) {
		return {
			success: true,
			message: 'Reset required',
		};
	}
	return {
		success: false,
		message: 'Reset not required',
	};
};

export const performLimitReset = async (
	req,
	res,
	next
) => {
	const id = req.userId;
	const resetStatus = await isResetRequired(id);
	if (resetStatus.success) {
		const resp = await resetDailyLimits(id);
		if (resp) {
			console.log('Limits reset successfully');
		}
	}
	next();
};

export const perFormPlanReset = async (
	req,
	res,
	next
) => {
	const token = req.userId;
	const is_Plan_Expired =
		await isPlanExpired(token);
	if (is_Plan_Expired) {
		const resp = await resetPlan(token);
		if (resp.success) {
			console.log('Plan reset successfully');
		}
	}
	next();
};

export const isScanningAllowed = async (id) => {
	const user = await User.findById(id);
	if (!user) {
		throw new Error('User not found');
	}

	if (!user.limits.isRequestScanningEnabled) {
		return {
			success: false,
			message: 'Scanning is disabled',
		};
	}

	const dailyScanCount =
		user.limits.dailyScanCount;
	const maxScanPerDay = user.limits.maxScanPerDay;
	const maxScanPerMonth =
		user.limits.maxScanPerMonth;

	if (
		dailyScanCount >= maxScanPerDay &&
		maxScanPerDay != maxScanPerMonth
	) {
		return {
			success: false,
			message: 'Daily scan limit exceeded',
		};
	}

	if (
		dailyScanCount >= maxScanPerDay &&
		maxScanPerDay == maxScanPerMonth
	) {
		return {
			success: false,
			message: 'Monthly scan limit exceeded',
		};
	}
	return {
		success: true,
		message: 'Scan allowed',
	};
};
