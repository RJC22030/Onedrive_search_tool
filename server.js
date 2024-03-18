const express = require("express");
const morgan = require("morgan");
const path = require("path");
const fs = require("fs");
const { Client } = require("@microsoft/microsoft-graph-client");

const app = express();
const port = process.env.PORT || 5502; // Use PORT environment variable or default to 5502

app.use(morgan("dev"));
app.use(express.json()); // Middleware to parse JSON request bodies

async function uploadFileToDrive(filePath, client, folderPath) {
  try {
    const fileContent = fs.readFileSync(filePath);
    await client
      .api(`/me/drive/root:/${folderPath}/${path.basename(filePath)}:/content`)
      .put(fileContent);
    console.log("File uploaded successfully");
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error; // Add this line to propagate the error to the caller
  }
}

// API endpoint to trigger OneDrive file upload
app.post("/upload-to-onedrive", (req, res) => {
  const { filePath, accessToken, destPath } = req.body;
  if (!filePath || !accessToken || !destPath) {
    return res
      .status(400)
      .send("File path, access token, and folder path are required");
  }

  const client = Client.init({
    authProvider: (done) => {
      done(null, accessToken);
    },
  });

  // Upload all existing files in the folder
  const files = fs.readdirSync(filePath);
  files.forEach((filename) => {
    const fullPath = path.join(filePath, filename);
    uploadFileToDrive(fullPath, client, destPath).catch((error) => {
      console.error("Error uploading file:", error);
      res.status(500).send("Internal Server Error");
    });
  });

  // Watch for changes in the folder
  fs.watch(filePath, (eventType, filename) => {
    if (filename && eventType === "change") {
      console.log(`File ${filename} has been modified`);
      uploadFileToDrive(path.join(filePath, filename), client, destPath).catch((error) => {
        console.error("Error uploading file:", error);
        res.status(500).send("Internal Server Error");
      });
    }
  });

  res.send("Folder monitoring started successfully");
});

// Serve static files
app.use(express.static("app"));
app.use("/images", express.static(path.join(__dirname, "images")));

app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
