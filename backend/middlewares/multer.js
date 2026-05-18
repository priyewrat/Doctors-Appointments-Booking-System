import multer from "multer";
import path from "path";

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, callback) {
    // ✅ Save files in "uploads" folder
    callback(null, "uploads/");
  },
  filename: function (req, file, callback) {
    // ✅ Unique filename: timestamp + original name
    const ext = path.extname(file.originalname);
    const uniqueName = Date.now() + "-" + file.originalname.replace(/\s+/g, "_");
    callback(null, uniqueName);
  },
});

// Optional: restrict uploads to images only
const fileFilter = (req, file, callback) => {
  if (file.mimetype.startsWith("image/")) {
    callback(null, true);
  } else {
    callback(new Error("Only image files are allowed"), false);
  }
};

const upload = multer({ storage, fileFilter });

export default upload;
