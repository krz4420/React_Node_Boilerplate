import React from "react";

class UserList extends React.Component {
  handleRemoveClick = (label) => {
    this.props.handleOnRemove(label);
  };
  handleMuteClick = (label, isMuted) => {
    this.props.handleOnMute(label, isMuted);
  };

  renderList() {
    const users = this.props.users;
    return users.length !== 0
      ? users.map((user) => {
          return (
            <div className="item">
              <div className="right floated content">
                <button
                  onClick={() => this.handleRemoveClick(user.label)}
                  className="negative ui button"
                >
                  Remove
                </button>
              </div>
              <div className="right floated content">
                <button
                  onClick={() => this.handleMuteClick(user.label, user.isMuted)}
                  className="ui icon button"
                >
                  <i
                    className={
                      "microphone " +
                      (user.isMuted ? "slash " : "") +
                      "icon" +
                      (user.isSpeaking ? " green" : "")
                    }
                  ></i>
                </button>
              </div>
              <i className="ui middle aligned large icon user" />
              <div className="content">
                <div className="description">{user.label}</div>
              </div>
            </div>
          );
        })
      : "No Active Users";
  }

  render() {
    return (
      <div className="ui middle aligned divided list">{this.renderList()}</div>
    );
  }
}

export default UserList;
