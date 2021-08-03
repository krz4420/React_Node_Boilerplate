import React from "react";

class UserList extends React.Component {
  renderList() {
    const users = this.props.users;
    console.log(users);
    return users.length !== 0
      ? users.map((user) => {
          return (
            <div className="item">
              <div className="right floated content">
                <button className="negative ui button">Remove</button>
              </div>
              <div className="right floated content">
                <button className="ui icon button">
                  <i className="microphone icon"></i>
                </button>
              </div>
              <i className="ui middle aligned large icon user" />
              <div className="content">
                <div className="description">{user}</div>
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
