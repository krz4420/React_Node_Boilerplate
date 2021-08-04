("use strict");
require("dotenv").config();
const http = require("http");
const express = require("express");
const { urlencoded } = require("body-parser");
const twilio = require("twilio");
const ClientCapability = twilio.jwt.ClientCapability;
const VoiceResponse = twilio.twiml.VoiceResponse;
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

const socket = require("socket.io");
let app = express();
let conferenceSid;
const server = http.createServer(app);
const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Express Server listening on *:${port}`);
});

const io = socket(server);
io.on("connection", (socket) => {
  socket.on("disconnect", () => {
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

const path = require("path");

app.use(express.static(path.join(__dirname, "..", "build")));
app.use(express.static("public"));
app.use(urlencoded({ extended: false }));

// Every time .connect() is called this will run
app.post("/voice", (request, response) => {
  const client = new twilio(accountSid, authToken);

  console.log(`## Making a call to ${request.body.number} ##`);
  console.log(request.body);
  console.log("************************************");

  // Creates outbound call to user and adds to conference call
  client.calls.create({
    label: request.body.number,
    url: `${process.env.MY_URL}/join`,
    from: process.env.TWILIO_NUMBER,
    to: request.body.number,
  });

  const twiml = new VoiceResponse();
  const dial = twiml.dial();
  dial.conference(
    {
      participantLabel: "You",
      statusCallback: `${process.env.MY_URL}/fetchUsers`,
      statusCallbackEvent: "join leave mute speaker",
    },
    "conference"
  );
  response.type("text/xml");
  response.send(twiml.toString());
});

// adds callee to the conference if they accept the outbound call
app.post("/join", (req, res) => {
  console.log("In join conf");
  const twiml = new VoiceResponse();
  const dial = twiml.dial();
  dial.conference({ participantLabel: req.body.To }, "conference");
  res.type("text/xml");
  res.send(twiml.toString());
});

// Endpoint to add additional users to conference
app.post("/addUser", (req, res) => {
  console.log("In add user");
  const phoneNumber = req.body.To;
  const client = new twilio(accountSid, authToken);

  client.conferences("conference").participants.create({
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
  console.log(req.body);
  if (req.body.StatusCallbackEvent === "participant-speech-start") {
    io.emit("speech", { label: req.body.ParticipantLabel, isSpeaking: true });
    console.log("Speaking Starts");
    console.log(req.body.label, req.body.isSpeaking);
    console.log("___________");
  } else if (req.body.StatusCallbackEvent === "participant-speech-stop") {
    io.emit("speech", { label: req.body.ParticipantLabel, isSpeaking: false });
    console.log("Speaking ends");
    console.log(req.body.label, req.body.isSpeaking);
    console.log("___________");
  } else {
    conferenceSid = req.body.ConferenceSid;
    const client = new twilio(accountSid, authToken);
    client
      .conferences(conferenceSid)
      .participants.list()
      .then((participants) => io.emit("fetchUserList", participants));
  }
});

module.exports = app;
