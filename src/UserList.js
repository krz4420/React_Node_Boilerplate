import React from "react";

class UserList extends React.Component {
  renderList() {
    const users = this.props.users;
    console.log(users);
    return users.length !== 0
      ? users.map((user) => {
          return (
            <div className="item">
              <i className="large middle aligned icon user" />
              <div className="content">
                <div className="description">
                  <p>{user}</p>
                </div>
              </div>
            </div>
          );
        })
      : "No Active Users";
  }

  render() {
    return <div className="ui relaxed divided list">{this.renderList()}</div>;
  }
}

export default UserList;
