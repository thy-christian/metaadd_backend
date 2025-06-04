const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const { ExifTool } = require("exiftool-vendored");

const app = express();
const upload = multer({ dest: "uploads/" });
const exiftool = new ExifTool();

app.use(cors()); // allow all cross-origin requests
app.use(express.json());

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Upload endpoint
app.post("/upload", upload.single("file"), async (req, res) => {
  const originalPath = req.file.path;
  const outputPath = `${originalPath}_modified${path.extname(req.file.originalname)}`;

  try {
    // Write metadata
    await exiftool.write(originalPath, {
      Title: "Thy-web",
      Author: "Christian",
    });

    // Rename to final output path
    fs.renameSync(originalPath, outputPath);

    // Send file as a download
    res.download(outputPath, req.file.originalname, (err) => {
      fs.unlink(outputPath, () => {}); // cleanup
    });
  } catch (err) {
    console.error("Error editing metadata:", err);
    fs.unlink(originalPath, () => {}); // cleanup on error
    res.status(500).send("Failed to update metadata.");
  }
});

// Gracefully close exiftool
process.on("exit", () => {
  exiftool.end();
});
process.on("SIGINT", () => {
  exiftool.end().then(() => process.exit());
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
