import multer from "multer";

const storage = multer.memoryStorage();

const singleStorage = multer({ storage }).single("file");

export default singleStorage;
