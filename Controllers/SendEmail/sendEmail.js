import mailgun from 'mailgun-js';
const DOMAIN = 'mail.igloaded.com';
import { vars } from '../../secrets.js';

const apiKey = vars.apiMailgun;

const mg = mailgun({
	apiKey: apiKey,
	domain: DOMAIN,
});

export const sendMail = (req, res) => {
	const { email } = req.body;
	const otp = Math.random().toString().slice(-4);
	console.log(otp);
	req.session.otp = otp;
	req.session.otpTimestamp = Date.now();
	const data = {
		from: 'IGLoaded <postmaster@mail.igloaded.com>',
		to: email,
		subject: 'OTP From IGLOADED',
		template: 'OTP Template',
		'h:X-Mailgun-Variables': JSON.stringify({
			OTP: otp,
		}),
	};

	mg.messages().send(data, function (error, body) {
		if (error) {
			return res.status(500).json({
				status: 'error',
				message:
					'Something went wrong in sending mail',
				error,
			});
		}
		res.status(200).json({
			status: 'ok',
			message: 'OTP sent successfully',
			body,
		});
	});
};

export const sendMailTest = (req, res) => {
	const { email } = req.body;
	const otp = Math.random().toString().slice(-4);
	req.session.otp = otp;
	req.session.otpTimestamp = Date.now();
	const data = {
		from: 'IGLoaded <postmaster@mail.igloaded.com>',
		to: email,
		subject: 'OTP From IGLOADED',
		template: 'OTP Template',
		'h:X-Mailgun-Variables': JSON.stringify({
			OTP: otp,
		}),
	};

	mg.messages().send(data, function (error, body) {
		if (error) {
			return res.status(500).json({
				status: 'error',
				message:
					'Something went wrong in sending mail',
				error,
			});
		}
		res.status(200).json({
			status: 'ok',
			message: 'OTP sent successfully',
			body,
		});
	});
};

export const verifyOTP = (req, res) => {
	const { otp } = req.body;
	if (
		!req.session.otp ||
		!req.session.otpTimestamp
	) {
		return res.status(400).json({
			status: 'error',
			message: 'OTP is not saved in session',
		});
	}

	const otpAgeInMinutes =
		(Date.now() - req.session.otpTimestamp) /
		1000 /
		60;
	if (otpAgeInMinutes > 2) {
		req.session.otp = null;
		req.session.otpTimestamp = null;
		return res.status(400).json({
			status: 'error',
			message: 'OTP has expired',
		});
	}

	if (req.session.otp === otp) {
		req.session.otp = null;
		req.session.otpTimestamp = null;
		return res.status(200).json({
			status: 'ok',
			message: 'OTP verified successfully',
		});
	}

	res.status(400).json({
		status: 'error',
		message: 'OTP verification failed',
	});
};

export const sendContactEmail = (req, res) => {
	const { email, subject, message, datetime } =
		req.body;
	if (
		!email ||
		!subject ||
		!message ||
		!datetime
	) {
		return res.status(400).json({
			status: 'error',
			message: 'All fields are required',
		});
	}
	const data = {
		from: 'IGLoaded <postmaster@mail.igloaded.com>',
		to: 'contact@igloaded.com',
		subject: 'New Contact request from IGLOADED',
		template: 'Contact Notification',
		'h:X-Mailgun-Variables': JSON.stringify({
			email: email,
			subject: subject,
			message: message,
			datetime: datetime,
		}),
	};

	mg.messages().send(data, function (error, body) {
		if (error) {
			return res.status(500).json({
				status: 'error',
				message:
					'Something went wrong in sending mail',
				error,
			});
		}
		res.status(200).json({
			status: 'ok',
			message: 'Contact form submitted successfully',
			body,
		});
	});
};

export const sendReelCompleteMail = (
	reelData
) => {
	const {
		email,
		shortcode,
		title,
		spreadSheetLink,
		reelDays,
		reelThumbnail,
	} = reelData;

	const url = `https://www.instagram.com/reel/${shortcode}/`;
	const data = {
		from: 'IGLoaded <postmaster@mail.igloaded.com>',
		to: email,
		subject: 'Reel Tracking Completed',
		template: 'reel completed notification',
		'h:X-Mailgun-Variables': JSON.stringify({
			reelDays: reelDays,
			reelThumbnail: reelThumbnail,
			reelTitle: title,
			reelUrl: url,
			spreadsheetUrl: spreadSheetLink,
		}),
	};
	return new Promise((resolve, reject) => {
		mg
			.messages()
			.send(data, function (error, body) {
				if (error) {
					reject({
						status: 400,
						message:
							'Something went wrong in sending mail',
						error,
					});
				}
				resolve({
					status: 200,
					message:
						'Reel completed mail sent successfully',
					body,
				});
			});
	});
};
