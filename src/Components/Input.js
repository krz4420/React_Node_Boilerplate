import React from "react";

class Input extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      term: "",
    };
  }

  onFormSubmit = (event) => {
    event.preventDefault();
    if (this.state.term.length == 0) {
      alert("Please Enter a Conference Name Before Submitting");
      return;
    }
    this.props.onSubmit(this.state.term);
    console.log(this.state.term);
  };

  render() {
    return (
      <div className="ui segment">
        <form onSubmit={this.onFormSubmit} className="ui form">
          <div className="field">
            <label>Enter a Name For Your Conference Call</label>
            <input
              type="text"
              value={this.state.term}
              onChange={(e) => this.setState({ term: e.target.value })}
              placeholder="Conference 123"
            />
          </div>
          <button className="ui button" type="submit">
            Submit
          </button>
        </form>
      </div>
    );
  }
}

export default Input;
