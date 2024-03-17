import TrackReel from '../../Models/trackReelModel.js';
import {
	addToEpoch,
	epochCurrent,
	modifyAddToEpoch,
} from '../../Reusables/getTimestamp.js';
import {
	UpdateSingleReel,
	removeReel,
} from '../Track/InstaData.js';
import { deleteSingleImage } from '../Cronjobs/RemoveImages.js';
import { sleep } from '../../Reusables/Utils.js';

export const UpdateAllReels = async () => {
	const reelPending = await TrackReel.find({
		status: 'pending',
	});
	console.log(
		'Reels found to be updated: ',
		reelPending.length
	);
	if (reelPending.length != 0) {
		for (const reel of reelPending) {
			try {
				UpdateSingleReel(
					reel.shortcode,
					reel.userEmail
				)
					.then((res) => {
						if (res.status == 200) {
							console.log('Reel updated & Saved');
						}
					})
					.catch((err) => {
						console.log('Error updating reel');
						console.log(err);
					});
			} catch (error) {
				console.log(
					'Error updating reel' + reel.shortcode
				);
				console.log(error);
			}
			await sleep(2000);
		}
	} else {
		console.log('No reels found');
		return;
	}
};

export const deleteCompletedReels = async () => {
	const reelCompleted = await TrackReel.find({
		status: 'completed',
	});

	console.log(
		'Reels found to be deleted: ',
		reelCompleted.length
	);

	if (reelCompleted.length == 0) {
		return;
	}

	for (let reel of reelCompleted) {
		const currentEpoch = epochCurrent('ms');
		const endDate = modifyAddToEpoch(
			reel.endDate,
			2
		);

		if (endDate < currentEpoch) {
			try {
				const deleteThumbnail =
					await deleteSingleImage(reel.thumbnail);
				if (deleteThumbnail.status == 400) {
					console.log(
						`Error deleting thumbnail for ${reel.shortcode}`
					);
				} else {
					console.log(
						`Thumbnail for ${reel.shortcode} deleted`
					);
				}
				removeReel(reel.shortcode, reel.userEmail)
					.then((res) => {
						if (res.status == 200) {
							console.log(
								`${reel.shortcode} Reel Deleted`
							);
						}
					})
					.catch((err) => {
						console.log(
							`${reel.shortcode} - Error deleting this reel`
						);
						console.log(err);
					});
			} catch (error) {
				console.log(
					`${reel.shortcode} - Error deleting this reel`
				);
				console.log(error);
			}
		}
	}
};
