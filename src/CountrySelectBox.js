import React from "react";

class CountrySelectBox extends React.Component {
  render() {
    var self = this;

    var CountryOptions = self.props.countries.map(function (country) {
      var flagClass = "flag flag-" + country.code;

      return (
        <li>
          <a href="#" onClick={() => self.props.handleOnChange(country.cc)}>
            <div className={flagClass}></div>
            <span>
              {" "}
              {country.name} (+{country.cc})
            </span>
          </a>
        </li>
      );
    });

    return (
      <div className="input-group-btn">
        <button
          type="button"
          className="btn btn-default dropdown-toggle"
          data-toggle="dropdown"
          aria-haspopup="true"
          aria-expanded="false"
        >
          +<span className="country-code">{self.props.countryCode}</span>
          <i className="fa fa-caret-down"></i>
        </button>
        <ul className="dropdown-menu">{CountryOptions}</ul>
      </div>
    );
  }
}

export default CountrySelectBox;
