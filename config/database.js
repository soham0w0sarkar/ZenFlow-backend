import mongoose from 'mongoose';

export const connectDB = async () => {
	try {
		await mongoose.connect(process.env.MONGO_URI, {
			dbName: 'ZenFlow'
		});
		console.log('MongoDB connected');
	} catch (error) {
		console.log(error);
	}
};
