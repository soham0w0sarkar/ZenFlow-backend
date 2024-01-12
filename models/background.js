import mongoose from "mongoose";

const backgroundSchema = new mongoose.Schema({
  name: {
    type: String,
    default: "background",
  },
  public_id: {
    type: String,
    default: "",
  },
  url: {
    type: String,
    default: "",
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Background", backgroundSchema);
