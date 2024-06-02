const express = require("express");
const morgan = require("morgan");
const path = require("path");
const fs = require("fs");
const { Client } = require("@microsoft/microsoft-graph-client");

const app = express();
const port = process.env.PORT || 5502; // Use PORT environment variable or default to 5502

app.use(morgan("dev"));
app.use(express.json()); // Middleware to parse JSON request bodies

// Serve static files
app.use(express.static("app"));
app.use("/images", express.static(path.join(__dirname, "images")));

// Load environment variables
require('dotenv').config();

// Define OneDrive client
const client = Client.init({
  authProvider: (done) => {
    done(null, process.env.ONEDRIVE_ACCESS_TOKEN);
  },
});

// Define the static folder path
const folderPath = "C:\\test";

// Watch for changes in the specified folder and upload files to OneDrive
fs.watch(folderPath, (eventType, filename) => {
  if (filename && eventType === "change") {
    console.log(`File ${filename} has been modified`);
    uploadFileToDrive(path.join(folderPath, filename), "destinationFolderName");
  }
});

async function uploadFileToDrive(filePath, destPath) {
  try {
    const fileContent = fs.readFileSync(filePath);
    await client
      .api(`/me/drive/root:/${destPath}/${path.basename(filePath)}:/content`)
      .put(fileContent);
    console.log("File uploaded successfully");
  } catch (error) {
    console.error("Error uploading file:", error);
  }
}

app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
