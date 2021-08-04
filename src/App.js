import React from "react";
import NumberInputText from "./NumberInputText";
import LogBox from "./LogBox";
import CountrySelectBox from "./CountrySelectBox";
import AddUser from "./AddUser";
import CallButton from "./CallButton";
import UserList from "./UserList";
import $ from "jquery";
import { io } from "socket.io-client";

const { Device } = require("twilio-client");
const socket = io("https://55eec8196410.ngrok.io");

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      muted: false,
      log: "Connecting...",
      onPhone: false,
      participants: [],
      countryCode: "1",
      currentNumber: "",
      isValidNumber: false,
      countries: [
        { name: "United States", cc: "1", code: "us" },
        { name: "Great Britain", cc: "44", code: "gb" },
        { name: "Colombia", cc: "57", code: "co" },
        { name: "Ecuador", cc: "593", code: "ec" },
        { name: "Estonia", cc: "372", code: "ee" },
        { name: "Germany", cc: "49", code: "de" },
        { name: "Hong Kong", cc: "852", code: "hk" },
        { name: "Ireland", cc: "353", code: "ie" },
        { name: "Singapore", cc: "65", code: "sg" },
        { name: "Spain", cc: "34", code: "es" },
        { name: "Brazil", cc: "55", code: "br" },
      ],
    };
  }

  // Initialize after component creation
  componentDidMount = () => {
    console.log("Componenet Did mount");

    socket.on("fetchUserList", (data) => {
      this.setState({ participants: [] });
      data.forEach((participant) => {
        this.setState((prevState) => ({
          participants: [
            ...prevState.participants,
            {
              label: participant.label,
              isMuted: participant.muted,
              isSpeaking: false,
            },
          ],
        }));
      });
    });

    // need to fix this... this only just copies to state
    socket.on("speech", (data) => {
      console.log("Getting in speech socketio");
      console.log(data);
      const index = this.state.participants.findIndex(
        (user) => user.label === data.label
      );
      console.log(index);

      let participantList = [...this.state.participants];
      let mutatedParticipant = { ...participantList[index] };
      mutatedParticipant.isSpeaking = data.isSpeaking;
      participantList[index] = mutatedParticipant;
      this.setState({ participants: participantList });

      console.log(this.state.participants);
    });

    // Fetch Twilio capability token from our Node.js server
    $.getJSON("/token").done((data) => {
      Device.setup(data.token);
    });

    Device.ready(() => {
      this.setState({ log: "Device Ready" });
    });

    Device.on("connect", () => {
      console.log("in on connection");
      this.setState({ log: "Device Ready" });
    });

    // Configure event handlers for Twilio Device
    Device.disconnect(() => {
      console.log("in this disconnect function");
      this.setState({
        onPhone: false,
        log: "Call ended.",
      });
      setTimeout(() => this.setState({ log: "Device Ready" }), 3000);
    });
  };
  // ****** End of Component Did Mount

  // Handle country code selection
  handleChangeCountryCode = (countryCode) => {
    this.setState({ countryCode: countryCode });
  };

  // Handle number input
  handleChangeNumber = (e) => {
    this.setState({
      currentNumber: e.target.value,
      isValidNumber: /^([0-9]|#|\*)+$/.test(
        e.target.value.replace(/[-()\s]/g, "")
      ),
    });
  };

  handleAddUser = () => {
    var n =
      "+" +
      this.state.countryCode +
      this.state.currentNumber.replace(/\D/g, "");
    $.ajax({
      url: "/addUser",
      method: "POST",
      dataType: "json",
      data: {
        To: n,
      },
    });
  };

  // Make an outbound call with the current number,
  // or hang up the current call
  handleToggleCall = () => {
    if (!this.state.onPhone) {
      this.setState({
        muted: false,
        onPhone: true,
      });
      // make outbound call with current number
      var n =
        "+" +
        this.state.countryCode +
        this.state.currentNumber.replace(/\D/g, "");
      console.log(n);

      console.log("about to make conenction");
      let connection = Device.connect({ number: n });
      this.setState({ log: "Calling " + n, status: connection.status() });
      console.log(this.state.participants);

      console.log(connection.status());
      connection.on("error", function () {
        console.log("error");
      });
    } else {
      // hang up call in progress
      Device.disconnectAll();
    }
  };

  handleMuteUser = (label, isMuted) => {
    $.ajax({
      url: "/muteUser",
      method: "POST",
      dataType: "json",
      data: {
        label,
        isMuted,
      },
    });
  };

  handleDeleteUser = (label) => {
    console.log(label);
    $.ajax({
      url: "/removeUser",
      method: "POST",
      dataType: "json",
      data: {
        label,
      },
    });
  };

  render() {
    return (
      <div id="dialer">
        <div className="controls">
          <LogBox participants={this.state.paticipants} text={this.state.log} />
        </div>
        <div className="float-container">
          <div id="dial-form" className="input-group input-group-sm">
            <CountrySelectBox
              countries={this.state.countries}
              countryCode={this.state.countryCode}
              handleOnChange={this.handleChangeCountryCode}
            />
            <NumberInputText
              currentNumber={this.state.currentNumber}
              handleOnChange={this.handleChangeNumber}
            />
          </div>
          <div className="call-button">
            <CallButton
              handleOnClick={this.handleToggleCall}
              disabled={!this.state.isValidNumber}
              onPhone={this.state.onPhone}
            />
          </div>
        </div>

        <div class="participantList">
          <label>Active Users</label>
          <UserList
            handleOnMute={this.handleMuteUser}
            handleOnRemove={this.handleDeleteUser}
            users={this.state.participants}
          />
          <AddUser
            users={this.state.participants.length}
            handleOnClick={this.handleAddUser}
          />
        </div>
      </div>
    );
  }
}

export default App;
