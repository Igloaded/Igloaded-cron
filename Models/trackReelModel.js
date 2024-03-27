import mongoose from 'mongoose';
const trackReelSchema = new mongoose.Schema(
	{
		id: { type: Number, required: true },
		userEmail: { type: String, required: true },
		title: { type: String, required: true },
		thumbnail: { type: String, required: true },
		dateCreated: {
			type: Number,
			required: true,
		},
		totalIterations: {
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
		fileUrl: {
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
