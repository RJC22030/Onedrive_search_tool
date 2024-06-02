const express = require("express");
const cors = require("cors"); // Import CORS middleware
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
    throw error; // Throw the error to handle it in the route
  }
}
router.use(cors());
// Route to handle file uploads to OneDrive
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
