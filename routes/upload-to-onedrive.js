const express = require("express");
const fs = require("fs");
const path = require("path");
const { Client } = require("@microsoft/microsoft-graph-client");

const router = express.Router();

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

router.post("/", async (req, res) => {
  const { filePath, accessToken, destPath } = req.body;

  try {
    if (!filePath || !accessToken || !destPath) {
      throw new Error("File path, access token, and folder path are required");
    }

    await uploadFileToDrive(filePath, accessToken, destPath);
    res.send("File uploaded to OneDrive successfully");
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).send("Internal Server Error");
  }
});

module.exports = router;
