import React from "react";
import NumberInputText from "./Components/NumberInputText";
import LogBox from "./Components/LogBox";
import CountrySelectBox from "./Components/CountrySelectBox";
import AddUser from "./Components/AddUser";
import CallButton from "./Components/CallButton";
import UserList from "./Components/UserList";
import Input from "./Components/Input";

import $ from "jquery";
import { io } from "socket.io-client";

const { Device } = require("twilio-client");
const socket = io(process.env.MY_URL);

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      log: "Connecting...",
      onPhone: false,
      participants: [],
      countryCode: "1",
      currentNumber: "",
      isValidNumber: false,
      confName: "",
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

    socket.on("speech", (data) => {
      console.log("Speech socketio");
      console.log(data);

      // Finding the index of participant speaking in the array
      const index = this.state.participants.findIndex(
        (user) => user.label === data.label
      );

      this.setState(({ participants }) => ({
        participants: [
          ...participants.slice(0, index),
          {
            ...participants[index],
            isSpeaking: data.isSpeaking,
          },
          ...participants.slice(index + 1),
        ],
      }));
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

  // Check to see if confName is already in use by passing a callback and set state to confName if not
  handleOnSearchSubmit = (term) => {
    socket.emit("conferenceName", { confName: term }, (response) => {
      if (response.status == "ok") {
        this.setState({ confName: term });
      } else {
        // Using basic alert can make this look better later but functions as I want it too
        alert(
          "This conference name has already been taken. Please Select a new one"
        );
      }
    });
  };

  handleChangeCountryCode = (countryCode) => {
    this.setState({ countryCode: countryCode });
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

  handleChangeNumber = (e) => {
    this.setState({
      currentNumber: e.target.value,
      isValidNumber: /^([0-9]|#|\*)+$/.test(
        e.target.value.replace(/[-()\s]/g, "")
      ),
    });
  };

  handleAddUser = () => {
    if (!this.isValidNumber) {
      alert("Please Enter a Valid Number to add");
      return;
    }

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
        ConfName: this.state.confName,
      },
    });
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

  handleToggleCall = () => {
    if (!this.state.onPhone) {
      if (!this.state.confName) {
        alert("Please Enter Conference Name");
        return;
      }

      var n =
        "+" +
        this.state.countryCode +
        this.state.currentNumber.replace(/\D/g, "");

      console.log("about to make conenction");

      if (!this.state.isValidNumber) {
        alert("Please Enter a Valid Number");
        return;
      }
      this.setState({
        onPhone: true,
      });
      let connection = Device.connect({
        number: n,
        confName: this.state.confName,
      });
      this.setState({ log: "Calling " + n, status: connection.status() });
      console.log(this.state.participants);

      console.log(connection.status());
      connection.on("error", function () {
        console.log("error");
      });
    } else {
      // hang up call in progress
      Device.disconnectAll(); // may cause number to disconnect from all conferences?
    }
  };

  render() {
    return (
      <div id="dialer">
        {this.state.confName ? null : (
          <Input onSubmit={this.handleOnSearchSubmit} />
        )}

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
