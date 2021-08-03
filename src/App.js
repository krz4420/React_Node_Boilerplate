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
      data.forEach((participant) =>
        this.setState((prevState) => ({
          participants: [...prevState.participants, participant.label],
        }))
      );
    });

    // Fetch Twilio capability token from our Node.js server
    $.getJSON("/token")
      .done((data) => {
        console.log("Setting up token");
        Device.setup(data.token);
        console.log("Done with twilio setup");
        this.setState({ log: "Connected" });
      })
      .fail(console.log("Did not work"));

    Device.ready(() => {
      console.log("Ready");
      this.setState({ log: "Connected" });
    });

    // Configure event handlers for Twilio Device
    Device.disconnect(() => {
      this.setState({
        onPhone: false,
        log: "Call ended.",
        participants: [],
      });
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
    })
      .done(function (data) {
        // The JSON sent back from the server will contain a success message
        alert(data.message);
      })
      .fail(function (error) {
        alert(JSON.stringify(error));
      });
  };

  fetchUsers = () => {
    $.getJSON("/fetchUsers").done((data) => {
      console.log(data);
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

  render() {
    return (
      <div id="dialer">
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
        <div className="controls">
          <CallButton
            handleOnClick={this.handleToggleCall}
            disabled={!this.state.isValidNumber}
            onPhone={this.state.onPhone}
          />
          <LogBox
            participans={this.state.paticipants}
            class={this.state.log}
            text={this.state.log}
          />
        </div>
        <div>
          <label>Active Users</label>
          <AddUser
            users={this.state.participants.length}
            handleOnClick={this.handleAddUser}
          />
          <UserList users={this.state.participants} />
        </div>
      </div>
    );
  }
}

export default App;
