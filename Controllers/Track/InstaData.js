import TrackReel from '../../Models/trackReelModel.js';

export const removeReel = async (id, email) => {
	const reel = await TrackReel.find({
		userEmail: email,
		id: id,
	});

	if (!reel) {
		return {
			status: 400,
			message: 'Reel not found',
		};
	}

	return new Promise(async (resolve, reject) => {
		const deleteReel = await TrackReel.deleteOne({
			id: id,
			userEmail: email,
		});

		if (deleteReel) {
			resolve({
				status: 200,
				message: 'Reel deleted successfully',
				id: id,
			});
		} else {
			reject({
				status: 400,
				message: 'Error deleting reel',
			});
		}
	});
};
