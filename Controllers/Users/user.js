import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import User from '../../Models/userModel.js';
import TrackReel from '../../Models/trackReelModel.js';
import Transaction from '../../Models/TransactionModel.js';

import { vars } from '../../secrets.js';
import { ValidateToken } from '../../Middlewares/Users.js';
import { sendMailTest } from '../../Controllers/SendEmail/sendEmail.js';
import {
	epochCurrent,
	epochToDate,
	addToEpoch,
} from '../../Reusables/getTimestamp.js';
import { setPlan } from '../../Controllers/Users/userUtils.js';

export const createUser = async (req, res) => {
	try {
		const { email, password, ...restOfBody } =
			req.body;
		const userExists = await User.findOne({
			email,
		});
		if (userExists) {
			res.status(400).json({
				status: 'error',
				message: 'User already exists',
			});
			return;
		}

		const hash = await bcrypt.hash(password, 10);

		const user = await User.create({
			email: email,
			password: hash,
			...restOfBody,
		});

		if (user) {
			res.status(200).json({
				status: 'ok',
				message: 'User created successfully',
				token: jwt.sign(
					{ id: user._id },
					vars.jwtSecret,
					{ expiresIn: '1d' }
				),
				user,
			});
		} else {
			res.status(500).json({
				status: 'error',
				message:
					'Something went wrong in creating account',
			});
		}
	} catch (error) {
		console.error(error);
		res.status(500).json({
			status: 'error',
			message:
				'Something went wrong in creating account',
			error,
		});
	}
};

export const getUser = async (req, res) => {
	const token =
		req.headers.authorization.split(' ')[1];
	let tokenData;

	if (token) {
		tokenData = await ValidateToken(token);
	} else {
		return res.status(401).json({
			status: 'error',
			message: 'Token not found',
			actionRequired: 'login',
		});
	}

	if (tokenData.error) {
		return res.status(401).json({
			status: 'error',
			message: 'Invalid Token',
			actionRequired: 'login',
			error: isUserValid.error,
		});
	}

	if (tokenData.status == 'success') {
		let userId = tokenData.id;
		try {
			const user = await User.findById(userId);
			const {
				email,
				name,
				credits,
				isAdmin,
				plan,
				limits,
			} = user;
			res.status(200).json({
				status: 'ok',
				message: 'User fetched successfully',
				email,
				name,
				credits,
				isAdmin,
				plan,
				limits,
			});
		} catch (error) {
			console.error(error);
			res.status(500).json({
				status: 'error',
				message:
					'Something went wrong in getting user',
				error,
			});
		}
	}
};

export const loginUser = async (req, res) => {
	const { email, password } = req.body;
	try {
		const user = await User.findOne({ email });
		if (!user) {
			return res.status(400).json({
				status: 'error',
				message: 'Invalid Email',
			});
		}

		const { name, credits, isAdmin, plan } = user;
		const isPasswordValid = await bcrypt.compare(
			password,
			user.password
		);

		if (!isPasswordValid) {
			return res.status(400).json({
				status: 'error',
				message: 'Invalid Password',
			});
		}

		if (user.isBlocked) {
			return res.status(401).json({
				status: 'error',
				message: 'User blocked',
				actionRequired: 'contact support',
			});
		}

		const token = jwt.sign(
			{ id: user._id },
			vars.jwtSecret,
			{ expiresIn: '1d' }
		);

		res.status(200).json({
			status: 'ok',
			message: 'User logged in successfully',
			name,
			credits,
			email,
			isAdmin,
			token,
			plan,
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({
			status: 'error',
			message: 'Something went wrong',
			error,
		});
	}
};

export const getPlanDetails = async (
	req,
	res
) => {
	const { email } = req.query;
	try {
		const user = await User.findOne({ email });
		const plandetails = {
			name: user.name,
			credits: user.credits,
			plan: user.plan,
		};
		res.status(200).json({
			status: 'ok',
			message: 'Plan details fetched successfully',
			data: plandetails,
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({
			status: 'error',
			message:
				'Something went wrong in getting plan details',
			error,
		});
	}
};

export const getUsers = async (req, res) => {
	if (!req.isAdmin) {
		res.status(401).json({
			status: 'error',
			message: 'Not authorized',
			actionRequired: 'admin login required',
		});
		return;
	}
	try {
		const users = await User.find({});
		res.status(200).json({
			status: 'ok',
			message: 'Users fetched successfully',
			users,
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({
			status: 'error',
			message:
				'Something went wrong in fetching users',
			error,
		});
	}
};

export const deleteUser = async (req, res) => {
	if (!req.isAdmin) {
		res.status(401).json({
			status: 'error',
			message: 'Not authorized',
			actionRequired: 'admin login required',
			status1: req.isAdmin,
		});
		return;
	}
	try {
		const { email } = req.params;
		const user = await User.findOne({ email });
		if (!user) {
			return res.status(400).json({
				status: 'error',
				message: 'Invalid Email',
			});
		}
		const userDelete = await User.findOneAndDelete({
			email,
		});
		res.status(200).json({
			status: 'ok',
			message: 'User deleted successfully',
			id: userDelete._id,
			email: userDelete.email,
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({
			status: 'error',
			message:
				'Something went wrong in deleting user',
			error,
		});
	}
};

export const findUser = async (req, res) => {
	try {
		const { email } = req.query;
		const user = await User.findOne({ email });
		if (!user) {
			req.body.email = email;
			sendMailTest(req, res);
		} else {
			return res.status(400).json({
				status: 'error',
				message: 'User found',
				userExist: true,
				email: email,
			});
		}
	} catch (error) {
		res.status(500).json({
			status: 'error',
			message:
				'Something went wrong in finding user',
			error,
		});
	}
};

export const updateUser = async (req, res) => {
	if (!req.userId) {
		res.status(401).json({
			status: 'error',
			message: 'Not logged In',
			actionRequired: 'login',
		});
		return;
	}
	try {
		if (Object.keys(req.body).length === 0) {
			return res.status(400).json({
				status: 'error',
				message: 'No fields to update',
			});
		}
		const user = await User.findById(req.userId);
		if (!user) {
			return res.status(400).json({
				status: 'error',
				message: 'User not found',
				email: email,
			});
		}
		const userUpdate = await User.findByIdAndUpdate(
			req.userId,
			req.body,
			{
				new: true,
				runValidators: true,
			}
		);

		const updatedFields = {};
		for (const key in req.body) {
			if (req.body[key] !== user[key]) {
				updatedFields[key] = userUpdate[key];
			}
		}
		res.status(200).json({
			status: 'ok',
			message: 'User updated successfully',
			...updatedFields,
		});
	} catch (error) {
		res.status(500).json({
			status: 'error',
			message:
				'Something went wrong in updating user',
			error,
		});
	}
};

export const forgetPassword = async (
	req,
	res
) => {
	const { newpassword, email } = req.body;
	try {
		const user = await User.findOne({ email });
		const IsPasswordSame = await bcrypt.compare(
			newpassword,
			user.password
		);
		if (!IsPasswordSame) {
			const hash = await bcrypt.hash(
				newpassword,
				10
			);
			user.password = hash;
			await user.save();
			return res.status(200).json({
				status: 'ok',
				message: 'Password reset successfully',
				id: user._id,
				email: user.email,
			});
		} else {
			return res.status(400).json({
				status: 'error',
				message:
					'New password cannot be same as old password',
			});
		}
	} catch (error) {
		res.status(500).json({
			status: 'error',
			message:
				'Something went wrong in resetting password',
			error,
		});
	}
};

export const changePassword = async (
	req,
	res
) => {
	const { newpassword, oldpassword, email } =
		req.body;
	try {
		const user = await User.findOne({ email });

		const IsPasswordSame = await bcrypt.compare(
			oldpassword,
			user.password
		);

		const isNewPasswordSame = await bcrypt.compare(
			newpassword,
			user.password
		);

		if (IsPasswordSame && !isNewPasswordSame) {
			user.password = await bcrypt.hash(
				newpassword,
				10
			);
			await user.save();
			return res.status(200).json({
				status: 'ok',
				message: 'Password changed successfully',
				id: user._id,
				email: user.email,
			});
		} else {
			if (!IsPasswordSame) {
				return res.status(400).json({
					status: 'error',
					message: 'Old password is incorrect',
				});
			}
			if (isNewPasswordSame) {
				return res.status(400).json({
					status: 'error',
					message:
						'New password cannot be same as old password',
				});
			}
		}
	} catch (error) {
		res.status(500).json({
			status: 'error',
			message:
				'Something went wrong in changing password',
			error,
		});
	}
};

export const getUsage = async (req, res) => {
	const token =
		req.headers.authorization.split(' ')[1];
	let tokenData;
	if (token) {
		tokenData = await ValidateToken(token);
	} else {
		return res.status(401).json({
			status: 'error',
			message: 'Token not found',
			actionRequired: 'login',
		});
	}

	if (tokenData.error) {
		return res.status(401).json({
			status: 'error',
			message: 'Invalid Token',
			actionRequired: 'login',
			error: tokenData.error,
		});
	}

	if (tokenData.status == 'success') {
		let userId = tokenData.id;
		try {
			const user = await User.findById(userId);
			res.status(200).json({
				status: 'ok',
				message: 'Usage fetched successfully',
				data: {
					limits: user.limits,
					plan: user.plan,
					reelsTracked: user.activity.reels,
					credits: user.credits,
				},
			});
		} catch (error) {
			console.error(error);
			res.status(500).json({
				status: 'error',
				message: 'Something went wrong',
				error,
			});
		}
	}
};

export const addTransaction = async (
	req,
	res
) => {
	try {
		const {
			email,
			amount,
			title,
			Description,
			transactionType,
			plan,
		} = req.body;

		let transactionObject = {
			userId: '',
			email: email,
			Id: '',
			date: 0,
			title: '',
			description: '',
			amount: 0,
			type: '',
			status: '',
		};

		const user = await User.findOne({ email });
		if (!user) {
			return res.status(400).json({
				status: 'error',
				message: 'Invalid Email',
			});
		}

		if (
			transactionType == 'debit' &&
			user.credits < amount
		) {
			return res.status(400).json({
				status: 'error',
				message: 'Insufficient credits',
			});
		}

		if (
			transactionType == 'debit' &&
			user.credits >= amount
		) {
			const currentDate = epochCurrent('ms');
			transactionObject = {
				userId: user._id,
				email: email,
				id: String(`IGL${currentDate}`),
				date: currentDate,
				title: title,
				description: Description,
				amount: amount,
				type: transactionType,
				status: 'success',
			};
			user.credits = user.credits - amount;
			user.activity.transactions =
				user.activity.transactions + 1;
			user.markModified('activity');
			await user.save();

			const result = await Transaction.create(
				transactionObject
			);
			if (result) {
				return res.status(200).json({
					status: 'ok',
					message: 'Transaction added successfully',
					transaction: transactionObject,
				});
			} else {
				return res.status(500).json({
					status: 'error',
					message:
						'Something went wrong in adding transaction',
				});
			}
		}

		if (transactionType == 'credit') {
			const currentDate = epochCurrent('ms');
			transactionObject = {
				userId: user._id,
				email: email,
				id: String(`IGL${currentDate}`),
				date: currentDate,
				title: title,
				description: Description,
				amount: amount,
				type: transactionType,
				status: 'success',
			};
			user.credits = user.credits + amount;
			user.activity.transactions =
				user.activity.transactions + 1;
			user.markModified('activity');
			await user.save();
			const result = await Transaction.create(
				transactionObject
			);
			if (result) {
				return res.status(200).json({
					status: 'ok',
					message: 'Transaction added successfully',
					transaction: transactionObject,
				});
			} else {
				return res.status(500).json({
					status: 'error',
					message:
						'Something went wrong in adding transaction',
				});
			}
		}

		if (transactionType == 'planpurchase') {
			const currentDate = epochCurrent('ms');
			transactionObject = {
				userId: user._id,
				email: email,
				id: String(`IGL${currentDate}`),
				date: currentDate,
				title: title,
				description: Description,
				amount: plan.planPrice,
				type: transactionType,
				status: 'success',
			};

			const planDetails = {
				planPrice: plan.planPrice,
				isExtensionEnabled: plan.isExtensionEnabled,
				planName: plan.planName,
				extensionUsernames: plan.extensionUsernames,
				planPurchaseDate: currentDate,
			};

			console.log(currentDate);

			user.activity.transactions =
				user.activity.transactions + 1;
			user.markModified('activity');
			await user.save();

			const planResp = await setPlan(
				email,
				planDetails
			);
			const result = await Transaction.create(
				transactionObject
			);
			console.log(currentDate);

			if (result && planResp.success) {
				return res.status(200).json({
					status: 'ok',
					message: 'Transaction added successfully',
					transaction: transactionObject,
				});
			} else {
				return res.status(500).json({
					status: 'error',
					message:
						'Something went wrong in adding transaction',
				});
			}
		}
	} catch (error) {
		console.error(error);
		res.status(500).json({
			status: 'error',
			message:
				'Something went wrong in adding transaction',
			error,
		});
	}
};

export const getTrackedReels = async (
	req,
	res
) => {
	const { page, limit, email, include } = req.body;

	if (!page || !limit || !email || !include) {
		return res.status(400).json({
			status: 'error',
			message: 'please check the body fields',
		});
	}

	const token = req.userId;

	const user = await User.findById(token);

	if (user && user.email != email) {
		return res.status(401).json({
			status: 'error',
			message: 'Token and Email not matched',
			actionRequired: 'login',
		});
	}

	if (!user) {
		return res.status(401).json({
			status: 'error',
			message: 'User not found',
			actionRequired: 'login',
		});
	}

	const reelLength = user.limits.dailyReelCount
	;

	if (include == 1) {
		const reelItems = await TrackReel.find({
			userEmail: user.email,
		})
			.sort({ createdAt: -1 })
			.skip((page - 1) * limit)
			.limit(limit);

		if (reelItems.length == 0) {
			return res.status(200).json({
				status: 'ok',
				message: 'No reels found',
				hasMore: false,
				reels: [],
				totalReels: reelItems.length,
			});
		}

		res.status(200).json({
			status: 'ok',
			message: 'Reels fetched successfully',
			reels: reelItems,
			hasMore: reelLength > page * limit,
			totalReels: reelLength,
		});
	} else {
		const documents = await TrackReel.find({
			userEmail: user.email,
			shortcode: { $regex: include, $options: 'i' },
		});

		if (documents.length == 0) {
			return res.status(200).json({
				status: 'ok',
				message: 'No reels found',
				hasMore: false,
				reels: [],
				totalReels: 0,
			});
		}

		res.status(200).json({
			status: 'ok',
			message: 'Reels fetched successfully',
			reels: documents,
			totalReels: documents.length,
		});
	}
};

export const verifyMail = async (req, res) => {
	const { email } = req.body;
	if (!email) {
		return res.status(400).json({
			status: 'error',
			message: 'Email is required',
		});
	}
	const user = await User.findOne({ email });
	if (!user) {
		return res.status(400).json({
			status: 'error',
			message: 'Invalid Email',
		});
	} else {
		req.body.email = email;
		sendMailTest(req, res);
	}
};

export const getTransaction = async (
	req,
	res
) => {
	const { page, limit, email } = req.body;
	if (!page || !limit || !email) {
		return res.status(400).json({
			status: 'error',
			message: 'page, limit and email are required',
		});
	}
	const token = req.userId;

	const user = await User.findById(token);
	const transactionLength =
		user.activity.transactions;

	const transaction = await Transaction.find({
		userId: token,
		email: email,
	})
		.sort({ createdAt: -1 })
		.skip((page - 1) * limit)
		.limit(limit);

	if (transaction.length == 0) {
		return res.status(200).json({
			status: 'ok',
			message: 'No transaction found',
			hasMore: false,
			transactions: [],
			totalTransactions: transactionLength,
		});
	}

	res.status(200).json({
		status: 'ok',
		message: 'Transactions fetched successfully',
		transactions: transaction,
		hasMore: transactionLength > page * limit,
		totalTransactions: transactionLength,
	});
};
