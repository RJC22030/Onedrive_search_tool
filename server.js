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
  }
}

// Serve static files
app.use(express.static("public"));
app.use("/images", express.static(path.join(__dirname, "images")));

app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
