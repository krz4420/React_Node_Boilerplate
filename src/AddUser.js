import React from "react";

class AddUser extends React.Component {
  render() {
    return this.props.users > 1 ? (
      <button class="ui basic button" onClick={this.props.handleOnClick}>
        <i class="icon plus"></i>
        Click To Add User "{this.props.users}"
      </button>
    ) : (
      <div></div>
    );
  }
}
export default AddUser;
