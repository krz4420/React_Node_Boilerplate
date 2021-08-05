("use strict");

const http = require("http");
const express = require("express");
const twilio = require("twilio");
const url = require("url");
const path = require("path");
const socket = require("socket.io");

const { urlencoded } = require("body-parser");
require("dotenv").config();

const ClientCapability = twilio.jwt.ClientCapability;
const VoiceResponse = twilio.twiml.VoiceResponse;
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
let conferenceSid;
let users = [];

let app = express();
const server = http.createServer(app);
const port = process.env.PORT || 3000;

server.listen(port, () => {
  console.log(`Express Server listening on *:${port}`);
  console.log(`Exposed to ${process.env.MY_URL}`);
});

const io = socket(server);

// Function used to find the index of a user depending on socketID or confName
const index = (userProperty, val) =>
  users.findIndex((connection) => connection[userProperty] === val);

io.on("connection", (socket) => {
  console.log("USER CONNECTED");
  if (!users.includes(socket.id)) {
    users.push({ socketID: socket.id, confName: "" });
  }
  socket.on("conferenceName", (data) => {
    users[index("socketID", socket.id)].confName = data.confName;
    console.log("______");
    console.log(users);
  });
  console.log(users);
  socket.on("disconnect", () => {
    users = users.filter((user) => user.socketID != socket.id);
    console.log("USER DQ");
  });
});

// Generate a Twilio Client capability token
app.get("/token", (request, response) => {
  const capability = new ClientCapability({
    accountSid,
    authToken,
  });

  capability.addScope(
    new ClientCapability.OutgoingClientScope({
      applicationSid: process.env.TWILIO_TWIML_APP_SID,
    })
  );
  const token = capability.toJwt();
  // Include token in a JSON response
  response.send({
    token: token,
  });
});

app.use(express.static(path.join(__dirname, "..", "build")));
app.use(express.static("public"));
app.use(urlencoded({ extended: false }));

// Every time .connect() is called this will run
app.post("/voice", (req, res) => {
  const client = new twilio(accountSid, authToken);

  console.log(`## Making a call to ${req.body.number} ##`);
  console.log(req.body);
  console.log("************************************");

  // Creates outbound call to callee and adds to conference call
  client.calls.create({
    label: req.body.number,
    url: `${process.env.MY_URL}/join?FriendlyName=${req.body.confName}`,
    from: process.env.TWILIO_NUMBER,
    to: req.body.number,
  });

  // Adds the client/caller/from into the conference call
  const twiml = new VoiceResponse();
  const dial = twiml.dial();
  dial.conference(
    {
      participantLabel: process.env.TWILIO_NUMBER,
      statusCallback: `${process.env.MY_URL}/fetchUsers`,
      statusCallbackEvent: "join leave mute speaker",
    },
    req.body.confName
  );
  res.type("text/xml");
  res.send(twiml.toString());
});

// Adds callee to the conference if they accept the outbound call
app.post("/join", (req, res) => {
  console.log("In join conf");
  console.log(req.body);
  const { FriendlyName } = url.parse(req.url, true).query; // Conference Name is passed as a query

  const twiml = new VoiceResponse();
  const dial = twiml.dial();

  dial.conference({ participantLabel: req.body.To }, FriendlyName);
  res.type("text/xml");
  res.send(twiml.toString());
});

// Endpoint to add additional users to conference
app.post("/addUser", (req, res) => {
  console.log("In add user");
  const phoneNumber = req.body.To;
  const client = new twilio(accountSid, authToken);

  client.conferences(req.body.confName).participants.create({
    label: phoneNumber,
    from: process.env.TWILIO_NUMBER,
    to: phoneNumber,
  });
});

// Endpoint to remove a participant from the conference
app.post("/removeUser", (req) => {
  const client = new twilio(accountSid, authToken);
  client.conferences(conferenceSid).participants(req.body.label).remove();
});

// Endpoint to mute/unmute a participant
app.post("/muteUser", (req) => {
  const client = new twilio(accountSid, authToken);
  const inverted = req.body.isMuted === "false" ? true : false; // not passed as a boolean so have to convert
  client
    .conferences(conferenceSid)
    .participants(req.body.label)
    .update({ muted: inverted });
});

// status callback endpoint where socket.io passes list to frontend
app.post("/fetchUsers", (req) => {
  console.log("_____FETCHING USER_____");
  console.log(req.body);
  console.log("_______");

  // Grab the index of which socket this event is associated with
  outputSocket = users[index("confName", req.body.FriendlyName)].socketID;

  let re = /participant-speech-.*/;

  // Testing to see if SCBE pertains to speaking
  if (re.test(req.body.StatusCallbackEvent)) {
    io.to(outputSocket).emit("speech", {
      label: req.body.ParticipantLabel,
      isSpeaking: req.body.StatusCallbackEvent.includes("start") ? true : false,
    });
  }
  // If it doesn't then it's either a join/leave so refetch list of active users
  else {
    conferenceSid = req.body.ConferenceSid;
    const client = new twilio(accountSid, authToken);
    client
      .conferences(conferenceSid)
      .participants.list()
      .then((participants) =>
        io.to(outputSocket).emit("fetchUserList", participants)
      );
  }
});

module.exports = app;
