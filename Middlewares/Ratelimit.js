import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
	windowMs: 10 * 60 * 1000,
	max: 1500,
	message: {
		status: 'error',
		message:
			'Too many requests from this IP, please try again later.',
	},
});

const limitOTP = rateLimit({
	windowMs: 5 * 60 * 1000,
	max: 10,
	message: {
		status: 'error',
		message:
			'Too many requests from this IP, please try again later.',
	},
});

const limitTrackRequest = rateLimit({
	windowMs: 60 * 60 * 1000,
	max: 500,
	message: {
		status: 'error',
		message:
			'Too many requests from this IP, please try again later.',
	},
});

export { limiter, limitOTP, limitTrackRequest };
