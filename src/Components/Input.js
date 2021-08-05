import React from "react";

class Input extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      name: "",
    };
  }

  onFormSubmit = (event) => {
    event.preventDefault();
    this.props.onSubmit(this.state.term);
    console.log(this.state.term);
  };

  render() {
    return (
      <div className="ui segment">
        <form onSubmit={this.onFormSubmit} className="ui form">
          <div class="field">
            <label>Enter a Name For Your Conference Call</label>
            <input
              type="text"
              value={this.state.term}
              onChange={(e) => this.setState({ term: e.target.value })}
              placeholder="Conference 123"
            />
          </div>
          <button class="ui button" type="submit">
            Submit
          </button>
        </form>
      </div>
    );
  }
}

export default Input;
