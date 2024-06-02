const express = require("express");
const morgan = require("morgan");
const path = require("path");
const fs = require("fs");
const { Client } = require("@microsoft/microsoft-graph-client");

const app = express();
const port = process.env.PORT || 5502;
app.use(cors()); // Enable CORS
app.use(morgan("dev"));
app.use(express.json());

async function uploadFileToDrive(filePath, client, folderPath) {
  try {
    const fileContent = fs.readFileSync(filePath);
    await client
      .api(`/me/drive/root:/${folderPath}/${path.basename(filePath)}:/content`)
      .put(fileContent);
    console.log("File uploaded successfully");
  } catch (error) {
    console.error("Error uploading file:", error);
  }
}

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

  const files = fs.readdirSync(filePath);
  files.forEach((filename) => {
    const fullPath = path.join(filePath, filename);
    uploadFileToDrive(fullPath, client, destPath);
  });

  fs.watch(filePath, (eventType, filename) => {
    if (filename && eventType === "change") {
      console.log(`File ${filename} has been modified`);
      uploadFileToDrive(path.join(filePath, filename), client, destPath);
    }
  });

  res.send("Folder monitoring started successfully");
});

app.use(express.static("public"));
app.use("/images", express.static(path.join(__dirname, "images")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
