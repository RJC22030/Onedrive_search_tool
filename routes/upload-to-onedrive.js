const express = require("express");
const cors = require("cors");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const { Client } = require("@microsoft/microsoft-graph-client");

// Function to upload file to OneDrive
async function uploadFileToDrive(filePath, accessToken, destPath) {
  try {
    const fileContent = fs.readFileSync(filePath);
    const client = Client.init({
      authProvider: (done) => {
        done(null, accessToken);
      },
    });

    await client
      .api(`/me/drive/root:/${destPath}/${path.basename(filePath)}:/content`)
      .put(fileContent);

    console.log("File uploaded successfully");
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
}

router.use(cors());

router.post("/", async (req, res) => {
  const { filePath, accessToken, destPath } = req.body;

  try {
    if (!filePath || !accessToken || !destPath) {
      throw new Error("File path, access token, and folder path are required");
    }

    if (!fs.existsSync(filePath)) {
      throw new Error(`File path ${filePath} does not exist`);
    }

    const files = fs.readdirSync(filePath);
    if (files.length === 0) {
      throw new Error(`No files found in the directory ${filePath}`);
    }

    for (const filename of files) {
      const fullPath = path.join(filePath, filename);
      await uploadFileToDrive(fullPath, accessToken, destPath);
    }

    fs.watch(filePath, (eventType, filename) => {
      if (filename && eventType === "change") {
        console.log(`File ${filename} has been modified`);
        const fullPath = path.join(filePath, filename);
        uploadFileToDrive(fullPath, accessToken, destPath).catch(err =>
          console.error("Error uploading modified file:", err)
        );
      }
    });

    res.send("Folder monitoring started successfully");
  } catch (error) {
    console.error("Error in /upload-to-onedrive route:", error.message);
    res.status(500).send("Internal Server Error: " + error.message);
  }
});

module.exports = router;
