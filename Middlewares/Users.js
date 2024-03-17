import jwt from 'jsonwebtoken';
import User from '../Models/userModel.js';
import { vars } from '../secrets.js';
import {
	epochCurrent,
	addToEpoch,
	epochToDate,
} from '../Reusables/getTimestamp.js';
import {
	resetPlan,
	resetDailyLimits,
	isPlanExpired,
} from '../Controllers/Users/userUtils.js';

const checkBlocked = async (req, res, next) => {
	const InitToken = req.headers.authorization;
	if (!InitToken) {
		return res.status(401).json({
			status: 'error',
			message: 'Missing Token',
			actionRequired: 'login',
		});
	}
	const token = InitToken.split(' ')[1];
	const tokenData = await ValidateToken(token);
	if (tokenData.error) {
		return res.status(401).json({
			status: 'error',
			message: 'Invalid Token',
			actionRequired: 'login',
			error: tokenData.error,
		});
	}
	if (tokenData.status == 'success') {
		const user = await User.findById(tokenData.id);
		if (!user) {
			req.userId = 'guest';
			return res.status(401).json({
				status: 'error',
				message: 'User does not exist',
			});
		}
		if (user.isBlocked == true) {
			return res.status(401).json({
				status: 'error',
				error: 'User is blocked',
				message:
					'You are blocked! Please contact admin for further details',
			});
		} else {
			req.userId = tokenData.id;
			next();
		}
	}
};

const checkSearchLimit = async (
	req,
	res,
	next
) => {
	const token = req.userId;
	const user = await User.findById(token);
	if (!user.limits.isSearchingEnabled) {
		return res.status(401).json({
			status: 'error',
			message:
				'Profile/Post Searching is disabled for your account',
		});
	}

	if (
		user.limits.dailySearchCount >=
			user.limits.maxSearchPerDay &&
		user.limits.maxSearchPerDay ==
			user.limits.maxSearchPerMonth
	) {
		return res.status(429).json({
			status: 'error',
			code: 'Monthly Search Limit Reached',
			message:
				'You have reached your monthly search limit',
		});
	} else if (
		user.limits.dailySearchCount >=
			user.limits.maxSearchPerDay &&
		user.limits.maxSearchPerDay !=
			user.limits.maxSearchPerMonth
	) {
		return res.status(429).json({
			status: 'error',
			code: 'Daily Search Limit Reached',
			message:
				'You have reached your daily search limit',
		});
	} else {
		user.limits.dailySearchCount += 1;
		user.activity.searches += 1;
		user.markModified('activity');
		user.markModified('limits');
		await user.save();
		next();
	}
};

const formatRequest = async (req, res, next) => {
	if (
		req.body &&
		Object.keys(req.body).length > 0
	) {
		try {
			for (let key in req.body) {
				if (typeof req.body[key] === 'string') {
					req.body[key] = req.body[key].trim();
				}
			}
		} catch (error) {
			console.log(error);
		}
	}
	next();
};

const isAdmin = async (req, res, next) => {
	try {
		req.userId = null;
		req.isAdmin = false;
		const { token } = req.headers;
		if (token) {
			const { id } = jwt.verify(
				token,
				vars.jwtSecret
			);
			req.userId = id;
			const userData = await User.findById(id);
			if (userData) {
				req.isAdmin = userData.isAdmin;
			}
		} else {
			res.status(401).json({
				status: 'error',
				message: 'Missing Token',
				actionRequired: 'login',
			});
			return;
		}
		next();
	} catch (error) {
		if (error instanceof jwt.TokenExpiredError) {
			console.log('The token has expired');
			res.status(401).json({
				status: 'error',
				message: 'The token has expired',
				actionRequired: 'login',
			});
		} else {
			console.log(error.message + 'here');
		}
	}
};

const Auth = async (req, res, next) => {
	try {
		req.userId = null;
		const { token } = req.headers;
		if (token) {
			const { id } = jwt.verify(
				token,
				vars.jwtSecret
			);
			if (!id) {
				return res.status(401).json({
					status: 'error',
					message:
						'Could not verify user (Token Retrieval Error)',
					actionRequired: 'login',
				});
			}
			req.userId = id;
			const userData = await User.findById(id);
			if (!userData) {
				return res.status(401).json({
					status: 'error',
					message:
						'Admin User Account is either deleted or does not exist',
					actionRequired: 'Please check token',
				});
			}
			if (userData.isAdmin == true) {
				return next();
			}
			if (userData.isBlocked) {
				return res.status(401).json({
					status: 'error',
					message: 'You are blocked',
					actionRequired: 'contact admin',
				});
			}
		}
		res.status(401).json({
			status: 'error',
			message: 'Missing Token',
			actionRequired: 'login',
		});
	} catch (error) {
		if (error instanceof jwt.TokenExpiredError) {
			console.log('The token has expired');
			res.status(401).json({
				status: 'error',
				message: 'The token has expired',
				actionRequired: 'login',
			});
		} else {
			console.log(error.message);
		}
	}
};

const HandleAuthorization = async (
	req,
	res,
	next
) => {
	let userId;
	const InitToken = req.headers.authorization;
	if (!InitToken) {
		userId = null;
	} else {
		userId = InitToken.split(' ')[1];
	}

	if (userId) {
		const resp = await ValidateToken(userId);
		if (resp.error) {
			return res.status(401).json({
				status: 'error',
				message: 'Invalid Token',
				actionRequired: 'login',
				error: resp.error,
			});
		}

		if (resp.status == 'success') {
			userId = resp.id;
		}
	}

	if (!userId && !req.session.hasQueried) {
		req.userId = 'guest';
		return next();
	}

	if (!userId && req.session.hasQueried) {
		return res.status(401).json({
			status: 'error',
			message: 'Login required to access this route',
			actionRequired: 'login',
		});
	}

	if (userId != undefined) {
		req.userId = userId;
		return next();
	}
};

const ValidateToken = async (token) => {
	try {
		if (token) {
			const { id } = jwt.verify(
				token,
				vars.jwtSecret
			);
			if (!id) {
				return {
					status: 'failure',
					message:
						'Could not verify user (Token Retrieval Error)',
				};
			} else {
				return {
					id: id,
					status: 'success',
					message: 'User exists',
				};
			}
		} else {
			return { error: 'Please provide a token' };
		}
	} catch (error) {
		console.log(error);
		if (error instanceof jwt.TokenExpiredError) {
			return {
				error: 'The token has expired',
			};
		} else {
			return { error: error };
		}
	}
};
export {
	Auth,
	isAdmin,
	checkSearchLimit,
	formatRequest,
	HandleAuthorization,
	ValidateToken,
	checkBlocked,
};
