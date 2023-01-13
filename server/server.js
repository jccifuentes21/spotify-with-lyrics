require("dotenv").config();
const express = require("express");
const spotifyWebApi = require("spotify-web-api-node");
const cors = require("cors");
const request = require("request");
const querystring = require("querystring");
const bodyParser = require("body-parser");
const lyricsFinder = require("lyrics-finder")

const port = 3001;
const app = express();

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const credentials = {
  redirectUri: process.env.REDIRECT_URI,
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
};

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

app.post("/login", (req, res) => {
  const code = req.body.code;
  const state = req.body.state;

  if (state !== null) {
    let authOptions = {
      url: "https://accounts.spotify.com/api/token",
      form: {
        grant_type: "authorization_code",
        code: code,
        redirect_uri: credentials.redirectUri,
      },
      headers: {
        Authorization:
          "Basic " +
          new Buffer.from(
            credentials.clientId + ":" + credentials.clientSecret
          ).toString("base64"),
      },
      json: true,
    };

    request.post(authOptions, (error, response, body) => {
      if (!error && response.statusCode === 200) {
        let access_token = body.access_token;
        let refresh_token = body.refresh_token;

        res.json({
          access_token: access_token,
          refresh_token: refresh_token,
          expires_in: body.expires_in,
        });
      } else {
        res.status(400).send("error");
        console.log("error: " + error);
        console.log("response statusCode: " + response.statusCode);
      }
    });
  }
});

app.post("/refresh", (req, res) => {
  const refreshToken = req.body.refreshToken;
  const spotifyApi = new spotifyWebApi({
    redirectUri: credentials.redirectUri,
    clientId: credentials.clientId,
    clientSecret: credentials.clientSecret,
    refreshToken,
  });

  spotifyApi
    .refreshAccessToken()
    .then((data) => {
      console.log("The access token has been refreshed!");
    })
    .catch((err) => {
      res.sendStatus(400);
      console.log("Could not refresh access token", err);
    });
});

app.get("/lyrics", async (req, res) =>{
  const lyrics = await lyricsFinder(req.query.artist, req.query.track) || "No Lyrics Found"
  res.json({lyrics})
})
