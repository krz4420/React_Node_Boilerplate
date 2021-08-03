import React from "react";

class LogBox extends React.Component {
  render() {
    return (
      <div>
        <div
          className={`log ${this.props.text === "Device Ready" ? "ready" : ""}`}
        >
          {this.props.text}
        </div>
      </div>
    );
  }
}

export default LogBox;
