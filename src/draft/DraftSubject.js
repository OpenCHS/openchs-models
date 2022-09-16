import ObservationsHolder from "../ObservationsHolder";
import Individual from "../Individual";
import BaseEntity from "../BaseEntity";
import SubjectType from "../SubjectType";
import Gender from "../Gender";
import AddressLevel from "../AddressLevel";
import ProgramEnrolment from "../ProgramEnrolment";
import Encounter from "../Encounter";
import Observation from "../Observation";
import IndividualRelationship from "../relationship/IndividualRelationship";
import GroupSubject from "../GroupSubject";
import Point from "../geo/Point";
import EntityApprovalStatus from "../EntityApprovalStatus";
import Comment from "../Comment";

class DraftSubject extends BaseEntity {
    static schema = {
        name: "DraftSubject",
        primaryKey: "uuid",
        properties: {
            uuid: "string",
            subjectType: "SubjectType",
            firstName: "string",
            lastName: {type: "string", optional: true},
            profilePicture: {type: "string", optional: true},
            dateOfBirth: {type: "date", optional: true},
            dateOfBirthVerified: {type: "bool", optional: true},
            gender: {type: "Gender", optional: true},
            registrationDate: "date",
            lowestAddressLevel: "AddressLevel",
            observations: {type: "list", objectType: "Observation"},
            registrationLocation: {type: "Point", optional: true},
            updatedOn: "date",
            totalMembers: {type: "string", optional: true}
        },
    };

   constructor(that = null) {
    super(that);
  }

  get subjectType() {
    return this.toEntity("subjectType", SubjectType);
  }

  set subjectType(x) {
    this.that.subjectType = x && x.that;
  }

  get firstName() {
    return this.that.firstName;
  }

  set firstName(x) {
    this.that.firstName = x;
  }

  get middleName() {
    return this.that.middleName;
  }

  set middleName(x) {
    this.that.middleName = x;
  }

  get lastName() {
    return this.that.lastName;
  }

  set lastName(x) {
    this.that.lastName = x;
  }

  get profilePicture() {
    return this.that.profilePicture;
  }

  set profilePicture(x) {
    this.that.profilePicture = x;
  }

  get dateOfBirth() {
    return this.that.dateOfBirth;
  }

  set dateOfBirth(x) {
    this.that.dateOfBirth = x;
  }

  get dateOfBirthVerified() {
    return this.that.dateOfBirthVerified;
  }

  set dateOfBirthVerified(x) {
    this.that.dateOfBirthVerified = x;
  }

  get gender() {
    return this.toEntity("gender", Gender);
  }

  set gender(x) {
    this.that.gender = x && x.that;
  }

  get registrationDate() {
    return this.that.registrationDate;
  }

  set registrationDate(x) {
    this.that.registrationDate = x;
  }

  get lowestAddressLevel() {
    return this.toEntity("lowestAddressLevel", AddressLevel);
  }

  set lowestAddressLevel(x) {
    this.that.lowestAddressLevel = x && x.that;
  }

  get enrolments() {
    return this.toList("enrolments", ProgramEnrolment);
  }

  set enrolments(x) {
    this.that.enrolments = this.fromList(x);
  }

  get encounters() {
    return this.toList("encounters", Encounter);
  }

  set encounters(x) {
    this.that.encounters = this.fromList(x);
  }

  get observations() {
    return this.toList("observations", Observation);
  }

  set observations(x) {
    this.that.observations = this.fromList(x);
  }

  get relationships() {
    return this.toList("relationships", IndividualRelationship);
  }

  set relationships(x) {
    this.that.relationships = this.fromList(x);
  }

  get groupSubjects() {
    return this.toList("groupSubjects", GroupSubject);
  }

  set groupSubjects(x) {
    this.that.groupSubjects = this.fromList(x);
  }

  get registrationLocation() {
    return this.toEntity("registrationLocation", Point);
  }

  set registrationLocation(x) {
    this.that.registrationLocation = x && x.that;
  }

  get latestEntityApprovalStatus() {
    return this.toEntity("latestEntityApprovalStatus", EntityApprovalStatus);
  }

  set latestEntityApprovalStatus(x) {
    this.that.latestEntityApprovalStatus = x && x.that;
  }

  get comments() {
    return this.toList("comments", Comment);
  }

  set comments(x) {
    this.that.comments = this.fromList(x);
  }

  get groups() {
    return this.toList("groups", GroupSubject);
  }

  set groups(x) {
    this.that.groups = this.fromList(x);
  }

    static create(subject, totalMembers) {
        const draftSubject = new DraftSubject();
        draftSubject.uuid = subject.uuid;
        draftSubject.subjectType = subject.subjectType;
        draftSubject.firstName = subject.firstName;
        draftSubject.lastName = subject.lastName;
        draftSubject.profilePicture = subject.profilePicture;
        draftSubject.dateOfBirth = subject.dateOfBirth;
        draftSubject.registrationDate = subject.registrationDate;
        draftSubject.dateOfBirthVerified = subject.dateOfBirthVerified;
        draftSubject.gender = subject.gender;
        draftSubject.lowestAddressLevel = subject.lowestAddressLevel;
        draftSubject.observations = subject.observations;
        draftSubject.registrationLocation = subject.registrationLocation;
        draftSubject.totalMembers = _.isEmpty(totalMembers) ? null : totalMembers;
        draftSubject.updatedOn = new Date();
        return draftSubject;
    }

    constructIndividual() {
        const individual = new Individual();
        individual.uuid = this.uuid;
        individual.subjectType = this.subjectType.clone();
        individual.firstName = this.firstName;
        individual.lastName = this.lastName;
        individual.profilePicture = this.profilePicture;
        individual.dateOfBirth = this.dateOfBirth;
        individual.registrationDate = this.registrationDate;
        individual.dateOfBirthVerified = this.dateOfBirthVerified;
        individual.gender = _.isNil(this.gender) ? null : this.gender.clone();
        individual.lowestAddressLevel = _.isNil(this.lowestAddressLevel)
            ? null
            : _.assignIn({}, this.lowestAddressLevel);
        individual.observations = ObservationsHolder.clone(this.observations);
        individual.registrationLocation = _.isNil(this.registrationLocation)
            ? null
            : this.registrationLocation.clone();
        individual.voided = false;
        individual.encounters = [];
        individual.enrolments = [];
        individual.relationships = [];
        individual.groupSubjects = [];
        return individual;
    }
}


export default DraftSubject;
