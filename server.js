const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
const uploadToOneDrive = require("./routes/upload-to-onedrive");

const app = express();
const port = process.env.PORT || 5502;

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

// Serve static files from the public directory
app.use(express.static("public"));

// Serve images from the images directory
app.use("/images", express.static(path.join(__dirname, "images")));

// Use the upload-to-onedrive route
app.use("/upload-to-onedrive", uploadToOneDrive);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
