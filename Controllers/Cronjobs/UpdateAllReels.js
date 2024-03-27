import TrackReel from '../../Models/trackReelModel.js';
import {
	epochCurrent,
	modifyAddToEpoch,
} from '../../Reusables/getTimestamp.js';
import { removeReel } from '../Track/InstaData.js';
import {
	deleteThumbnail,
	removeExcelFile,
} from '../Cronjobs/RemoveImages.js';
import { sleep } from '../../Reusables/Utils.js';

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
		const dateExpiry = modifyAddToEpoch(
			reel.dateCreated,
			7
		);
		if (dateExpiry < currentEpoch) {
			try {
				deleteThumbnail(reel.thumbnail)
					.then((res) => {
						if (res.status == 200) {
							console.log(
								`${reel.title} Thumbnail Deleted`
							);
						}
					})
					.catch((err) => {
						console.log(
							`${reel.title} - Error deleting this thumbnail`
						);
					});

				removeExcelFile(reel.fileUrl)
					.then((res) => {
						if (res.status == 200) {
							console.log(
								`${reel.title} Excel File Deleted`
							);
						}
					})
					.catch((err) => {
						console.log(
							`${reel.title} - Error deleting this excel file`
						);
						console.log(err);
					});

				removeReel(reel.id, reel.userEmail)
					.then((res) => {
						if (res.status == 200) {
							console.log(`${reel.title} Reel Deleted`);
						}
					})
					.catch((err) => {
						console.log(
							`${reel.title} - Error deleting this reel`
						);
						console.log(err);
					});
			} catch (error) {
				console.log(
					`${reel.title} - Error deleting this reel`
				);
				console.log(error);
			}
			sleep(2000);
		}
	}
};
