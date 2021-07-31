import React from "react";

class AddUser extends React.Component {
  render() {
    return (
      <button onClick={this.props.handleOnClick}>Click To Add User</button>
    );
  }
}
export default AddUser;
