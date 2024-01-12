import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    maxLength: 32,
  },
  email: {
    type: String,
    required: true,
  },
});

export default mongoose.model("User", userSchema);
