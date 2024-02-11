import mongoose from 'mongoose';

const backgroundSchema = new mongoose.Schema({
	public_id: {
		type: String,
		default: ''
	},
	url: {
		type: String,
		default: ''
	},
	user: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User'
	},
	current: {
		type: Boolean,
		default: false
	},
	createdAt: {
		type: Date,
		default: Date.now()
	}
});

export default mongoose.model('Background', backgroundSchema);
