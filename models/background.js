import mongoose from "mongoose";

const backgroundSchema = new mongoose.Schema({
    public_id: {
    type: String,
    default: "",
  },
  url: {
    type: String,
    default: "",
  },
});

export default mongoose.model("Background", backgroundSchema);
