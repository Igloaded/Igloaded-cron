import { v2 as cloudinary } from 'cloudinary';
import { vars } from '../../secrets.js';
import { basename, extname } from 'path';

cloudinary.config({
	cloud_name: vars.cloudName,
	api_key: vars.apiKeyCloudinary,
	api_secret: vars.apiSecretCloudinary,
	secure: true,
});

export const RemoveImages = async () => {
	return new Promise(async (resolve, reject) => {
		try {
			return await cloudinary.api.delete_resources_by_prefix(
				'IgloadedImages',
				function (error, result) {
					if (error) {
						console.log(error);
						reject({
							status: 400,
							message: 'Something went wrong',
							error: error,
						});
					}
					console.log(result);
					resolve({
						status: 200,
						message: 'Images removed',
						deleteCount: Object.keys(result.deleted)
							.length,
					});
				}
			);
		} catch (error) {
			console.log(error);
			reject({
				status: 400,
				message: 'Something went wrong',
				error: error,
			});
		}
	});
};

export const deleteSingleImage = async (
	imageUrl
) => {
	return new Promise((resolve, reject) => {
		if (!imageUrl) {
			reject({
				status: 400,
				message: 'Something went wrong',
				error: 'No image url provided',
			});
		}
		const url = new URL(imageUrl);
		const pathname = url.pathname;
		const publicId = basename(
			pathname,
			extname(pathname)
		);
		try {
			cloudinary.uploader
				.destroy(`IgloadedImages/${publicId}`, {
					resource_type: 'image',
				})
				.then((result) => {
					resolve({
						status: 200,
						message: 'Image removed',
						result: result,
					});
				})
				.catch((error) => {
					reject({
						status: 400,
						message: 'Something went wrong',
						error: error,
					});
				});
		} catch (error) {
			reject({
				status: 400,
				message: 'Something went wrong',
				error: error,
			});
		}
	});
};
