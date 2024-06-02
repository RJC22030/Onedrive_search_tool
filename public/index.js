async function handleInput(inputElement) {
    var inputValue = inputElement.value;
    console.log("Input value: " + inputValue);
}

async function toggleLogin() {
    const loginButton = document.getElementById("loginButton");
    const signOutButton = document.getElementById("signOutButton");
    loginButton.style.display = "none";
    signOutButton.style.display = "inline-block";
}

function logout() {
    const loginButton = document.getElementById("loginButton");
    const signOutButton = document.getElementById("signOutButton");
    loginButton.style.display = "inline-block";
    signOutButton.style.display = "none";
}

// Boolean "AND","OR"
const inputElement = document.getElementById("searchInput");
inputElement.addEventListener("input", (event) => {
    const inputValue = event.target.value;
    const words = inputValue.split(" ");
    words.forEach((word, index) => {
        if (word.toLowerCase() === "or" && words[index + 1] === "") {
            inputElement.value = inputValue.replace(/or /, "OR ");
        } else if (word.toLowerCase() === "and" && words[index + 1] === "") {
            inputElement.value = inputValue.replace(/and /, "AND ");
        }
    });
});

const msalconfig = {
    auth: {
        clientId: "56127de5-9f6a-46e4-a207-a069483e4a18",
        authority: "https://login.microsoftonline.com/common/",
        redirectUri: "https://sairajobs.onrender.com/",
    },
    cache: {
        cacheLocation: "sessionstorage",
        storeAuthStateInCookie: true,
    },
};

const uniqueFileNames = new Set();
var accessToken = null;
let successCount = 0;
var username = "";
var count;
const keywords = [];
const operators = [];
const MSALobj = new msal.PublicClientApplication(msalconfig);

async function signIn() {
    const loginRequest = {
        scopes: [
            "User.Read",
            "Files.Read",
            "Files.Read.All",
            "Files.ReadWrite",
            "Files.ReadWrite.All",
            "Files.ReadWrite.AppFolder",
            "Files.ReadWrite.Selected",
        ],
    };

    MSALobj.loginRedirect(loginRequest)
        .then(() => {
            toggleLogin();
        })
        .catch((error) => {
            console.error("Sign-in error: ", error);
        });
}

function signOut() {
    const logoutReq = {
        account: MSALobj.getAccountByUsername(username),
    };
    MSALobj.logoutPopup(logoutReq)
        .then(logout)
        .catch((error) => {
            console.error("Logout error: ", error);
        });
}

MSALobj.handleRedirectPromise()
    .then((response) => {
        console.log(response);
        username = response.account.username;
        accessToken = response.accessToken;
        toggleLogin();
    })
    .catch((error) => {
        console.log(error);
    });

function Preview(url) {
    const fileContentFrame = document.getElementById("Content");
    fileContentFrame.src = url;
}

function Inputsplit() {
    successCount = 0;
    const keywords = [];
    const operators = [];
    const resultsList = document.getElementById("fileList");
    uniqueFileNames.clear();
    resultsList.innerHTML = "";

    const Input = document.getElementById("searchInput").value;
    const terms = Input.split(" ");

    for (const term of terms) {
        if (term.toLowerCase() === "or" || term.toLowerCase() === "and") {
            operators.push(term.toLowerCase());
        } else {
            keywords.push(term);
        }
    }
    if (keywords.length == 0 || (keywords.length == 1 && keywords[0] == "")) {
        // resultsList.innerHTML = "No Search results";
    }
    searchfunc(keywords, operators);
}

async function searchfunc(keywords, operators) {
    const resultsList = document.getElementById("fileList");
    const searchResults = [];
    console.log(operators.length);

    for (let i = 0; i < keywords.length; i++) {
        if (operators[i] === "and") {
            key1 = keywords[i];
            key2 = keywords[i + 1];
            const result = await search(key1 + " " + key2);
            i++;
        } else {
            key = keywords[i];
            const result = await search(key);
        }
    }
    if (uniqueFileNames.size === 0) {
        resultsList.innerHTML = "";
        const noProfilesImage = document.getElementById("noProfilesImage");
        noProfilesImage.style.display = "block";
    } else {
        const noProfilesImage = document.getElementById("noProfilesImage");
        noProfilesImage.style.display = "none";
    }
}

async function search(parameter) {
    successCount++;
    if (accessToken == null) {
        alert("Sign in");
        return;
    }

    const resultsList = document.getElementById("fileList");
    const apiUrl = `https://graph.microsoft.com/v1.0/me/drive/search(q='${parameter}')?select=name,webUrl`;
    try {
        const response = await fetch(apiUrl, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (response.ok) {
            const data = await response.json();
            if (data && data.value) {
                data.value.forEach((file) => {
                    if (!uniqueFileNames.has(file.name)) {
                        const fileLink = document.createElement("a");
                        fileLink.href = file.webUrl;
                        fileLink.textContent = file.name;
                        fileLink.target = "_blank";
                        const listItem = document.createElement("li");
                        listItem.appendChild(fileLink);
                        resultsList.appendChild(listItem);
                        uniqueFileNames.add(file.name);
                    }
                });
            }
        } else {
            throw new Error("Error searching for files: " + response.statusText);
        }
    } catch (error) {
        console.error("Error: " + error);
    }
}

function checkAuthentication() {
    const accounts = MSALobj.getAllAccounts();
    if (accounts.length > 0) {
        const loginButton = document.getElementById("loginButton");
        const signOutButton = document.getElementById("signOutButton");
        loginButton.style.display = "none";
        signOutButton.style.display = "inline-block";
    }
}

window.addEventListener("load", checkAuthentication);
window.onload = function () {
    document.getElementById("searchInput").focus();
    document.addEventListener("click", function () {
        var userInputField = document.getElementById("searchInput");
        userInputField.focus();
    });
};

function focusInput() {
    document.getElementById("searchInput").focus();
}
focusInput();

document.addEventListener("click", function (event) {
    if (event.target !== searchInput) {
        focusInput();
    }
});

document.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        Inputsplit();
    }
});

// Initialize Graph client with access token
const graphClient = null;

async function syncFunction() {
  const filePath = prompt("Enter file path: ");
  const destPath = prompt("Destination folder name: ");

  try {
    // Wait for the initialization of the access token
    await MSALobj.handleRedirectPromise();

    // Check if
    if (!accessToken) {
console.error("Access token is not available.");
return;
}
      const response = await fetch("/upload-to-onedrive", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ filePath, accessToken, destPath }),
});

if (response.ok) {
  console.log("Folder monitoring started successfully");
} else {
  const errorText = await response.text();
  console.error("Failed to start folder monitoring:", errorText);
}
      } catch (error) {
console.error("Error:", error);
}
}

document.getElementById("syncButton").addEventListener("click", syncFunction);
      
      
