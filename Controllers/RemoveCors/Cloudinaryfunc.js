import { v2 as cloudinary } from 'cloudinary';
import { vars } from '../../secrets.js';

cloudinary.config({
	cloud_name: vars.cloudName,
	api_key: vars.apiKeyCloudinary,
	api_secret: vars.apiSecretCloudinary,
	secure: true,
});

export const RemoveCors = (url) => {
	try {
		return cloudinary.uploader.upload(
			url,
			{
				folder: 'IgloadedImages',
				use_filename: false,
			},
			(error, result) => {
				if (result) {
					return result;
				} else {
					console.log(error);
					return Promise.reject(error);
				}
			}
		);
	} catch (error) {
		console.log(error);
		return Promise.reject(error);
	}
};

export const newThumbnail = (url) => {
	try {
		return cloudinary.uploader.upload(
			url,
			{
				folder: 'ThumbnailImages',
				use_filename: false,
			},
			(error, result) => {
				if (result) {
					return result;
				} else {
					console.log(error);
					return Promise.reject(error);
				}
			}
		);
	} catch (error) {
		console.log(error);
		return Promise.reject(error);
	}
};
