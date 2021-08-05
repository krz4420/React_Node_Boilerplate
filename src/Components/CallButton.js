import React from "react";

class CallButton extends React.Component {
  render() {
    return (
      <button
        className={
          "btn btn-circle btn-success " +
          (this.props.onPhone ? "btn-danger" : "btn-success")
        }
        onClick={this.props.handleOnClick}
      >
        <i
          className={
            "fa fa-fw fa-phone " +
            (this.props.onPhone ? "fa-close" : "fa-phone")
          }
        ></i>
      </button>
    );
  }
}

export default CallButton;
