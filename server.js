const express = require("express");
const morgan = require("morgan");
const path = require("path");
const msal = require("@azure/msal-node"); // Import MSAL Node.js library
const fs = require("fs");

const DEFAULT_PORT = 5502;
const app = express();
let port = DEFAULT_PORT;

// MSAL configuration
const msalConfig = {
  auth: {
    clientId: "your_client_id",
    authority: "https://login.microsoftonline.com/your_tenant_id",
    clientSecret: "your_client_secret", // Include your client secret here
  },
};

// Create MSAL application instance
const pca = new msal.ConfidentialClientApplication(msalConfig);

app.use(morgan("dev"));
app.use(
  "/lib",
  express.static(path.join(__dirname, "../../lib/msal-browser/lib"))
);
app.use(express.static("app"));
app.use("/images", express.static(path.join(__dirname, "images")));

// Route to handle the authentication flow
app.get("/auth", async (req, res) => {
  try {
    // Get authorization URL
    const authCodeUrlParameters = {
      scopes: ["user.read"], // Add your required scopes here
      redirectUri: "http://localhost:5502/auth/callback",
    };

    // Get the URL for sign-in
    const response = await pca.getAuthCodeUrl(authCodeUrlParameters);
    res.redirect(response);
  } catch (error) {
    console.log(error);
    res.status(500).send("Error initiating authentication");
  }
});

// Route to handle the callback after authentication
app.get("/auth/callback", async (req, res) => {
  try {
    const tokenResponse = await pca.acquireTokenByCode({
      code: req.query.code,
      scopes: ["user.read"],
    });

    // Handle token response as needed
    res.send("Authentication successful!");
  } catch (error) {
    console.log(error);
    res.status(500).send("Error acquiring token");
  }
});

app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Listening on port ${port}.....`);
});
