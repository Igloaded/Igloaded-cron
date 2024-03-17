import axios from 'axios';
import { vars } from '../../secrets.js';
import {
	RemoveCors,
	newThumbnail,
} from '../RemoveCors/Cloudinaryfunc.js';
import { InstaScript } from './InstaScraper.js';
import TrackReel from '../../Models/trackReelModel.js';
import User from '../../Models/userModel.js';
import { ValidateToken } from '../../Middlewares/Users.js';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import {
	addToEpoch,
	epochCurrent,
	epochToDate,
} from '../../Reusables/getTimestamp.js';
import { google } from 'googleapis';
import {
	createSpreadSheet,
	deleteSpreadSheet,
} from './Commonfile.js';
import { sendReelCompleteMail } from '../SendEmail/sendEmail.js';

const googleAuthFile = JSON.parse(vars.authFile);

export const getReelMetadata = async (
	shortcode
) => {
	const options = {
		method: 'GET',
		url: `https://apiprofi.com/api/post_info/?shortcode=${shortcode}`,
		headers: {
			Authorization: `Bearer ${vars.apiProfiToken}`,
		},
	};
	return new Promise(async (resolve, reject) => {
		try {
			const response = await axios.request(options);
			return resolve(response.data);
		} catch (error) {
			if (
				error.message ==
					'This object was not found' ||
				error.message == 'Page not found'
			) {
				reject({
					status: 400,
					message: 'No reel found',
				});
			} else {
				reject({
					status: 400,
					message:
						error?.message ||
						'Something went wrong in fetching reel data (getReelMetadata)',
				});
			}
		}
	});
};

const getStoryData = async (username) => {
	const url = `https://www.instagram.com/stories/${username}/`;
	const data = await InstaScript(url);
	if (!data.error) {
		return data;
	} else {
		return {
			status: 'error',
			message: data.error,
		};
	}
};

const getProfileMetadata = async (shortcode) => {
	const options = {
		method: 'GET',
		url: `https://apiprofi.com/api/info_username/?user=${shortcode}`,
		headers: {
			Authorization: `Bearer ${vars.apiProfiToken}`,
		},
	};

	try {
		const response = await axios.request(options);
		return response.data.user;
	} catch (error) {
		console.error(error);
		return error;
	}
};

export const getReelData = async (req, res) => {
	const { shortcode } = req.query;
	const queryurl = `https://www.instagram.com/p/${shortcode}`;
	try {
		const urlData = [];
		const reelData =
			await getReelMetadata(shortcode);
		if (reelData.status == 400) {
			return res.status(400).json({
				status: 400,
				message: 'No reel found',
			});
		}
		const urls = await InstaScript(queryurl);
		urlData.push(urls);
		let flag = false;
		var {
			taken_at_timestamp,
			__typename,
			edge_media_to_caption,
			edge_media_preview_comment,
			owner,
			edge_media_preview_like,
		} = reelData.data.graphql.shortcode_media;
		var like_count = edge_media_preview_like.count;
		var comment_count =
			edge_media_preview_comment.count;
		var captionText =
			edge_media_to_caption?.edges[0]?.node?.text;
		var { full_name, username, profile_pic_url } =
			owner;

		let profilePic;
		await RemoveCors(profile_pic_url)
			.then(
				(result) => (profilePic = result.secure_url)
			)
			.catch((error) => console.error(error));
		let PostData = [];
		let info = {
			type: '',
			shortcode: '',
			video: '',
			thumbnail: '',
			isVideo: false,
			video_play_count: 0,
			video_view_count: 0,
			tagged_users: [],
		};

		if (
			reelData.data.graphql.shortcode_media
				.__typename != 'GraphSidecar'
		) {
			var {
				video_view_count,
				video_play_count,
				taken_at_timestamp,
				edge_media_preview_like,
				edge_media_preview_comment,
				__typename,
				edge_media_to_caption,
				owner,
				edge_media_to_tagged_user,
			} = reelData.data.graphql.shortcode_media;

			var captionText =
				edge_media_to_caption?.edges[0]?.node?.text;
			var { full_name, username, is_verified } =
				owner;

			let taggedUser = [];

			if (
				edge_media_to_tagged_user.edges.length > 0
			) {
				taggedUser =
					edge_media_to_tagged_user.edges.map(
						(item) => {
							return item.node.user.username;
						}
					);
			}

			if (__typename == 'GraphImage') {
				info.type = 'GraphImage';
				info.isVideo = false;
				info.video = null;
				info.thumbnail = urlData[0][0].thumbnail;
				info.shortcode = shortcode;
				info.video_play_count = null;
				info.video_view_count = null;
				info.tagged_users = taggedUser;
			}

			if (__typename == 'GraphVideo') {
				info.type = 'GraphVideo';
				info.isVideo = true;
				info.video = urlData[0][0].video;
				info.thumbnail = urlData[0][0].thumbnail;
				info.shortcode = shortcode;
				info.video_play_count = video_play_count;
				info.video_view_count = video_view_count;
				info.tagged_users = taggedUser;
			}
			PostData.push(info);
		} else {
			flag = true;
			// for (
			// 	let i = 0;
			// 	i <
			// 	reelData.data.graphql.shortcode_media
			// 		.edge_sidecar_to_children.edges.length;
			// 	i++
			// ) {
			// 	var {
			// 		video_view_count,
			// 		video_play_count,
			// 		__typename,
			// 		shortcode,
			// 		is_video,
			// 	} =
			// 		reelData.data.graphql.shortcode_media
			// 			.edge_sidecar_to_children.edges[i].node;

			// 	if (__typename == 'GraphVideo') {
			// 		info.type = 'GraphVideo';
			// 		info.isVideo = is_video;
			// 		info.video = urlData[i].download_link;
			// 		info.thumbnail = urlData[i].thumbnail_link;
			// 		info.shortcode = shortcode;
			// 		info.video_play_count = video_play_count;
			// 		info.video_view_count = video_view_count;
			// 	} else {
			// 		info.type = 'GraphImage';
			// 		info.isVideo = is_video;
			// 		info.video = null;
			// 		info.thumbnail = urlData[i].thumbnail_link;
			// 		info.shortcode = shortcode;
			// 		info.video_play_count = null;
			// 		info.video_view_count = null;
			// 	}
			// 	PostData.push(info);
			// }
		}
		if (flag) {
			return res.status(200).json({
				status: 200,
				success: false,
				message:
					"Couldn't fetch data of Carousel Post",
				data: {},
			});
		}
		res.status(200).json({
			status: 200,
			success: true,
			message: 'Data fetched successfully',
			data: {
				profilePic,
				taken_at: taken_at_timestamp,
				code: shortcode,
				type: __typename,
				like_count,
				comment_count,
				full_name,
				is_verified,
				username,
				captionText,
				PostData,
			},
		});
	} catch (error) {
		res.status(400).json({
			status: 400,
			error: error.toString(),
		});
		console.log(error);
	}
};

export const getProfileData = async (
	req,
	res
) => {
	const { username } = req.query;
	if (!username) {
		res.status(400).json({
			status: 400,
			message: 'No username provided',
		});
	}
	const response =
		await getProfileMetadata(username);
	if (
		response.error_code ==
		'IgExactUserNotFoundError'
	) {
		return res.status(400).json({
			status: 400,
			message: 'No user found',
		});
	}

	if (response.error_code == 'ERR_BAD_RESPONSE') {
		return res.status(400).json({
			status: 400,
			message: 'No user found',
		});
	}

	let {
		biography,
		full_name,
		pk,
		is_verified,
		is_private,
		edge_followed_by,
		edge_follow,
		edge_owner_to_timeline_media,
		bio_links,
		profile_pic_url_hd,
		is_business_account,
	} = await response;

	let follower_count = edge_followed_by.count;
	let following_count = edge_follow.count;
	let media_count =
		edge_owner_to_timeline_media.count;

	let profile_pic;
	for (let i = 0; i < bio_links.length; i++) {
		bio_links[i].id = i;
	}

	await RemoveCors(profile_pic_url_hd)
		.then(
			(result) => (profile_pic = result.secure_url)
		)
		.catch((error) => console.error(error));

	res.status(200).json({
		status: 200,
		data: {
			full_name,
			username,
			pk,
			biography,
			is_verified,
			is_private,
			follower_count,
			following_count,
			media_count,
			bio_links,
			profile_pic,
			is_business_account,
		},
	});
};

export const getStory = async (req, res) => {
	const { username } = req.query;
	if (!username) {
		return res.status(400).json({
			status: 400,
			message: 'No username provided',
		});
	}
	const response =
		await getProfileMetadata(username);
	if (
		response.error_code ==
		'IgExactUserNotFoundError'
	) {
		return res.status(400).json({
			status: 400,
			message: 'No user found',
		});
	}

	const {
		full_name,
		is_verified,
		profile_pic_url,
	} = response;

	if (response.is_private) {
		return res.status(400).json({
			status: 400,
			message: 'User is private',
		});
	}
	const storyData = await getStoryData(username);

	if (storyData.error) {
		return res.status(400).json({
			status: 400,
			message: storyData.error,
		});
	}

	let dataArray = [];
	let dataObject = {};

	let profile_pic;

	await RemoveCors(profile_pic_url)
		.then(
			(result) => (profile_pic = result.secure_url)
		)
		.catch((error) => console.error(error));

	for (let i = 0; i < storyData.length; i++) {
		dataObject = {
			id: i,
			thumbnail: storyData[i].thumbnail,
			video: storyData[i].video,
		};
		dataArray.push(dataObject);
	}

	res.status(200).json({
		data: {
			username,
			profile_pic,
			full_name,
			is_verified,
			story: dataArray,
		},
	});
};

export const scheduleNewReel = async (
	req,
	res
) => {
	const {
		shortcode,
		totalIterations,
		title,
		email,
		reelData,
	} = req.body;

	const {
		username,
		thumbnail,
		uploadDate,
		views,
		likes,
		plays,
	} = reelData;

	if (
		!shortcode ||
		!totalIterations ||
		!title ||
		!email
	) {
		return res.status(400).json({
			status: 400,
			message: 'Please recheck request body fields',
		});
	}
	const token = req.userId;
	let userData = await User.findById(token);

	if (userData && userData.email != email) {
		return res.status(400).json({
			status: 400,
			message:
				'Invalid email - Impersonification attempt detected',
		});
	} else {
		if (
			userData.limits.isReelTrackingEnabled == false
		) {
			return res.status(400).json({
				status: 400,
				message: 'Feature not available',
				data: {
					success: false,
					message:
						'This feature is not available for everyone',
				},
			});
		} else if (
			userData.limits.maxReelsPerMonth <=
			userData.activity.reels
		) {
			return res.status(400).json({
				status: 400,
				message: 'Tracking limit reached',
				data: {
					success: false,
					message:
						'You have reached your reel tracking limit',
				},
			});
		}
	}

	const isReelAvailable = await TrackReel.findOne({
		shortcode: shortcode,
		userEmail: email,
	});

	if (isReelAvailable) {
		return res.status(400).json({
			status: 400,
			message: 'Reel already Exist',
			data: {
				success: false,
				message: 'Reel already exist in your account',
			},
		});
	}

	const currentDate = epochCurrent('ms');
	const endDateInEpoch = addToEpoch(
		totalIterations
	);

	const thumbnailNew =
		await newThumbnail(thumbnail);

	const fileName = `${email}/${shortcode}`;

	const dataSpreadSheet =
		await createSpreadSheet(fileName);

	console.log(dataSpreadSheet);

	if (dataSpreadSheet.status == 400) {
		return res.status(400).json({
			status: 400,
			message: 'Error creating spreadsheet',
			data: {
				success: false,
				message: 'Error creating spreadsheet',
			},
		});
	}

	const spreadsheetUrl =
		dataSpreadSheet.spreadsheetUrl;

	const data = {
		id: endDateInEpoch,
		shortcode: shortcode,
		uploadDate: uploadDate,
		uploadedBy: username,
		startDate: currentDate,
		endDate: endDateInEpoch,
		views: views,
		likes: likes,
		thumbnail: thumbnailNew.secure_url,
		plays: plays,
		reelUrl: `https://www.instagram.com/p/${shortcode}`,
		title: title,
		userEmail: email,
		totalIterations: totalIterations,
		checkedAt: currentDate,
		updatedAt: currentDate,
		iterationsCompleted: 0,
		status: 'pending',
		spreadsheetUrl: spreadsheetUrl,
		debugLog: 'null',
	};

	const newReel = await TrackReel.create(data);
	const user = await User.findOneAndUpdate(
		{
			email: email,
		},
		{
			$inc: {
				'activity.reels': 1,
				'limits.dailyReelCount': 1,
			},
		},
		{
			new: true,
		}
	);

	if (newReel && user) {
		return res.status(200).json({
			status: 200,
			message: 'Reel Scheduled',
			data: {
				success: true,
				message: 'Reel scheduled successfully',
			},
		});
	} else {
		return res.status(400).json({
			status: 400,
			message: 'Error Occured',
			data: {
				success: false,
				message:
					'Error scheduling reel, please try again',
			},
		});
	}
};

export const UpdateSingleReel = async (
	shortcode,
	email
) => {
	let spreadsheetUrl;
	let reelId;
	let response = {
		status: 0,
		message: '',
	};
	try {
		response = await getReelMetadata(shortcode);
	} catch (error) {
		response.status = 400;
		response.message = 'No reel found';
	}
	const dateInEpoch = epochCurrent('ms');
	return new Promise(async (resolve, reject) => {
		try {
			const reel = await TrackReel.findOne({
				shortcode: shortcode,
				userEmail: email,
			});
			if (reel) {
				reelId = reel.id;
				reel.views = response?.video_view_count || 0;
				reel.likes =
					response?.edge_media_preview_like?.count ||
					0;
				reel.plays = response?.video_play_count || 0;
				reel.checkedAt = dateInEpoch;
				reel.iterationsCompleted =
					reel.iterationsCompleted + 1;
				reel.status =
					reel.iterationsCompleted >=
					reel.totalIterations
						? 'completed'
						: 'pending';
				reel.updatedAt = dateInEpoch;
				await reel.save();

				const spreadsheetId = reel.spreadsheetUrl
					.split('/d/')[1]
					.split('/')[0];

				// Spreadsheet sheet updation (Starts)

				const serviceAccountAuth =
					new google.auth.GoogleAuth({
						credentials: googleAuthFile,
						scopes: [
							'https://www.googleapis.com/auth/spreadsheets',
						],
					});

				const doc = new GoogleSpreadsheet(
					spreadsheetId,
					serviceAccountAuth
				);
				await doc.loadInfo();

				let sheet =
					doc.sheetsByTitle[`${reel.shortcode}`];
				if (!sheet) {
					sheet = await doc.addSheet({
						title: `${reel.shortcode}`,
						headerValues: [
							'Check Count',
							'Username',
							'Post Url',
							'Plays',
							'Views',
							'Likes',
							'Checked At',
						],
					});
				}

				const sheetRes = await sheet.addRow({
					'Check Count': reel.iterationsCompleted,
					Username: reel.uploadedBy,
					'Post Url': reel.reelUrl,
					Plays: reel.plays,
					Views: reel.views,
					Likes: reel.likes,
					'Checked At': epochToDate(
						reel.checkedAt,
						'ms'
					),
				});

				if (reel.status == 'completed') {
					const sendMail = await sendReelCompleteMail({
						email: email,
						shortcode: shortcode,
						title: reel.title,
						spreadSheetLink: reel.spreadsheetUrl,
						reelDays: reel.totalIterations,
						reelThumbnail: reel.thumbnail,
					});

					if (sendMail.status == 400) {
						console.log(
							'Error sending mail',
							sendMail.message
						);
					} else if (sendMail.status == 200) {
						console.log(
							'Reel Completed Mail sent successfully'
						);
					}
				}

				if (sheetRes) {
					resolve({
						status: 200,
						message: 'Reel updated successfully',
						spreadsheetUrl: spreadsheetUrl,
					});
				} else {
					reject({
						status: 400,
						message: 'Error updating reel',
					});
				}
			} else {
				reject({
					status: 400,
					message: 'Reel not found',
				});
			}
		} catch (error) {
			console.log(error);
			reject({
				status: 400,
				message: error.toString(),
			});
		}
	});
};

export const removeReel = async (
	shortcode,
	email
) => {
	const reel = await TrackReel.find({
		userEmail: email,
		shortcode: shortcode,
	});

	return new Promise(async (resolve, reject) => {
		if (reel[0].spreadsheetUrl != 'null') {
			let spreadsheetId = reel[0].spreadsheetUrl
				.split('/d/')[1]
				.split('/')[0];
			const resp = await deleteSpreadSheet(
				spreadsheetId
			);
			if (resp.status == 200) {
				const deleteReel = await TrackReel.deleteOne({
					shortcode: shortcode,
					userEmail: email,
				});

				if (deleteReel) {
					resolve({
						status: 200,
						message: 'Reel deleted successfully',
						shortcode: shortcode,
					});
				}
			} else {
				reject({
					status: 400,
					message: 'Error deleting reel',
					spreadsheetMessage: resp.message,
				});
			}
		} else {
			const deleteReel = await TrackReel.deleteOne({
				shortcode: shortcode,
				userEmail: email,
			});

			if (deleteReel) {
				resolve({
					status: 200,
					message: 'Reel deleted successfully',
					shortcode: shortcode,
				});
			}
		}
	});
};
