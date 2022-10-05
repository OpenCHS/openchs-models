import _ from "lodash";
import Concept from "../Concept";
import moment from "moment";
import General from "../utility/General";

class PrimitiveValue {
  constructor(value, datatype) {
    this.value = value;
    this.datatype = datatype;
    this.answer = this._valueFromString();
  }

  asDisplayDate() {
    const format =
      !General.hoursAndMinutesOfDateAreZero(this.answer) &&
      this.datatype === Concept.dataType.DateTime
        ? "DD-MMM-YYYY HH:mm"
        : "DD-MMM-YYYY";
    return moment(this.answer).format(format);
  }

  asDisplayTime() {
    return General.toDisplayTime(this.answer);
  }

  getValue() {
    return this.answer;
  }

  get toResource() {
    return this.answer;
  }

  cloneForEdit() {
    return new PrimitiveValue(this.value, this.datatype);
  }

  _valueFromString() {
    if (this.datatype === Concept.dataType.Numeric && !/\.$|\.0+$|\.*0$/.test(this.value)) {
      return _.toNumber(this.value);
    } else if (this.datatype === Concept.dataType.DateTime) {
      return new Date(Date.parse(this.value));
    } else if (this.datatype === Concept.dataType.Date) {
      return moment(this.value).startOf("day").toDate();
    }

    return this.value;
  }
}

export default PrimitiveValue;
