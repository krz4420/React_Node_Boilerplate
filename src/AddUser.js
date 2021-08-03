import React from "react";

class AddUser extends React.Component {
  // Only render button if there are two or more users in conference
  render() {
    return this.props.users > 1 ? (
      <button class="ui basic button" onClick={this.props.handleOnClick}>
        <i class="icon plus"></i>
        Click To Add User
      </button>
    ) : (
      <div></div>
    );
  }
}
export default AddUser;
