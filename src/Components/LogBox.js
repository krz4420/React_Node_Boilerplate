import React from "react";

class LogBox extends React.Component {
  render() {
    return (
      <div>
        <div
          className={`log ${this.props.text === `Device Ready` ? "ready" : ""}`}
        >
          {this.props.text}
          <br />
          {this.props.confNameExists === 0 && this.props.text === "Device Ready"
            ? "Enter a Conference Name to Call"
            : ""}
        </div>
      </div>
    );
  }
}

export default LogBox;
