import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
	{
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},

		email: {
			type: String,
			required: true,
		},

		id: {
			type: String,
			required: true,
		},

		date: {
			type: Number,
			required: true,
		},

		title: {
			type: String,
			required: true,
		},

		description: {
			type: String,
			required: true,
		},

		amount: {
			type: Number,

			required: true,
		},

		type: {
			type: String,
			required: true,
		},

		status: {
			type: String,
			required: true,
		},
	},
	{
		timestamps: true,
	}
);

const Transaction = mongoose.model(
	'Transaction',
	transactionSchema
);

export default Transaction;
