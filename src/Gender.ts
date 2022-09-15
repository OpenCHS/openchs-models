import ReferenceEntity from "./ReferenceEntity";
import General from "./utility/General";

class Gender extends ReferenceEntity {
  static schema = {
    name: "Gender",
    primaryKey: "uuid",
    properties: {
      uuid: "string",
      name: "string",
    },
  };

  constructor(that) {
    super(that);
  }

  get name() {
      return this.that.name;
  }

  set name(x) {
      this.that.name = x;
  }

  isMale() {
    return this.name === "Male";
  }

  isFemale() {
    return this.name === "Female";
  }

  static create(name) {
    let gender = new Gender();
    gender.uuid = General.randomUUID();
    gender.name = name;
    return gender;
  }

  static fromResource(resource) {
    return ReferenceEntity.fromResource(resource, new Gender());
  }

  clone() {
    return super.clone(new Gender());
  }
}

export default Gender;
