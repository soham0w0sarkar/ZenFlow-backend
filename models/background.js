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
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

export default mongoose.model("Background", backgroundSchema);
