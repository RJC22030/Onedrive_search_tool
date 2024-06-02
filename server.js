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

app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname, "index.html"));
});

// API endpoint to trigger OneDrive file upload
app.post("/trigger-onedrive-upload", async (req, res) => {
  const { filePath, destPath } = req.body;
  const accessToken = req.headers.authorization;

  if (!filePath || !destPath || !accessToken) {
    return res.status(400).send("File path, destination path, and access token are required");
  }

  try {
    // Upload the file to OneDrive
    await uploadFileToDrive(filePath, accessToken, destPath);

    // Watch for changes in the folder
    fs.watch(filePath, (eventType, filename) => {
      if (filename && eventType === "change") {
        console.log(`File ${filename} has been modified`);
        uploadFileToDrive(path.join(filePath, filename), accessToken, destPath);
      }
    });

    res.send("Folder monitoring started successfully");
  } catch (error) {
    console.error("Error starting folder monitoring:", error);
    res.status(500).send("Internal server error");
  }
});

// Function to upload file to OneDrive
async function uploadFileToDrive(filePath, accessToken, destPath) {
  try {
    const client = Client.init({
      authProvider: (done) => {
        done(null, accessToken);
      },
    });

    const fileContent = fs.readFileSync(filePath);
    await client
      .api(`/me/drive/root:/${destPath}/${path.basename(filePath)}:/content`)
      .put(fileContent);
    
    console.log("File uploaded successfully");
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error; // Propagate error to caller
  }
}

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
