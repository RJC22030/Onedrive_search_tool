const express = require("express");
const morgan = require("morgan");
const path = require("path");
const fs = require("fs");
const { Client } = require("@microsoft/microsoft-graph-client");

const app = express();
const port = process.env.PORT || 5502;

app.use(morgan("dev"));
app.use(express.json());

async function uploadFileToDrive(filePath, client, folderPath) {
  try {
    const fileContent = fs.readFileSync(filePath);
    await client
      .api(`/me/drive/root:/${folderPath}/${path.basename(filePath)}:/content`)
      .put(fileContent);
    console.log("File uploaded successfully:", filePath);
  } catch (error) {
    console.error("Error uploading file:", filePath, error);
    throw error;
  }
}

app.post("/upload-to-onedrive", async (req, res) => {
  const { filePath, accessToken, destPath } = req.body;
  console.log("Received request to upload file:", { filePath, destPath });

  if (!filePath || !accessToken || !destPath) {
    console.error("Missing required fields:", { filePath, accessToken, destPath });
    return res.status(400).send("File path, access token, and folder path are required");
  }

  if (!fs.existsSync(filePath)) {
    console.error("File path does not exist:", filePath);
    return res.status(400).send("File path does not exist");
  }

  const client = Client.init({
    authProvider: (done) => {
      done(null, accessToken);
    },
  });

  try {
    const files = fs.readdirSync(filePath);
    for (const filename of files) {
      const fullPath = path.join(filePath, filename);
      await uploadFileToDrive(fullPath, client, destPath);
    }

    fs.watch(filePath, async (eventType, filename) => {
      if (filename && eventType === "change") {
        console.log(`File ${filename} has been modified`);
        await uploadFileToDrive(path.join(filePath, filename), client, destPath);
      }
    });

    res.send("Folder monitoring started successfully");
  } catch (error) {
    console.error("Error in /upload-to-onedrive endpoint:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.use(express.static("app"));
app.use("/images", express.static(path.join(__dirname, "images")));

app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
