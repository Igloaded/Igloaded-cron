import mongoose from 'mongoose';
const trackReelSchema = new mongoose.Schema(
	{
		id: { type: Number, required: true },
		userEmail: { type: String, required: true },
		uploadDate: { type: Number, required: true },
		uploadedBy: { type: String, required: true },
		endDate: { type: Number, required: true },
		startDate: { type: Number, required: true },
		updatedAt: { type: Number, required: true },
		views: { type: Number, required: true },
		likes: { type: Number, required: true },
		plays: { type: Number, required: true },
		reelUrl: { type: String, required: true },
		title: { type: String, required: true },
		shortcode: { type: String, required: true },
		thumbnail: { type: String, required: true },
		totalIterations: {
			type: Number,
			required: true,
		},
		checkedAt: {
			type: Number,
			required: true,
		},
		iterationsCompleted: {
			type: Number,
			required: true,
		},
		status: {
			type: String,
			required: true,
		},
		spreadsheetUrl: {
			type: String,
			required: true,
		},
		debugLog: {
			type: String,
			required: true,
			default: null,
		},
	},
	{
		timestamps: true,
	}
);

const TrackReel = mongoose.model(
	'TrackReel',
	trackReelSchema
);

export default TrackReel;
