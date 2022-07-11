import moment from "moment";
import ResourceUtil from "./utility/ResourceUtil";
import AddressLevel from "./AddressLevel";
import Gender from "./Gender";
import General from "./utility/General";
import BaseEntity from "./BaseEntity";
import ProgramEnrolment from "./ProgramEnrolment";
import IndividualRelationship from "./relationship/IndividualRelationship";
import Encounter from "./Encounter";
import Duration from "./Duration";
import _ from "lodash";
import ValidationResult from "./application/ValidationResult";
import ObservationsHolder from "./ObservationsHolder";
import {findMediaObservations} from "./Media";
import Point from "./geo/Point";
import SubjectType from "./SubjectType";
import Observation from "./Observation";
import GroupSubject from "./GroupSubject";
import EntityApprovalStatus from "./EntityApprovalStatus";
import Comment from "./Comment";

class Individual extends BaseEntity {
  static schema = {
    name: "Individual",
    primaryKey: "uuid",
    properties: {
      uuid: "string",
      subjectType: "SubjectType",
      name: "string",
      firstName: "string",
      middleName: {type: "string", optional: true},
      lastName: {type: "string", optional: true},
      profilePicture: {type: "string", optional: true},
      dateOfBirth: {type: "date", optional: true},
      dateOfBirthVerified: {type: "bool", optional: true},
      gender: {type: "Gender", optional: true},
      registrationDate: "date",
      lowestAddressLevel: "AddressLevel",
      voided: {type: "bool", default: false},
      enrolments: {type: "list", objectType: "ProgramEnrolment"},
      encounters: {type: "list", objectType: "Encounter"},
      observations: {type: "list", objectType: "Observation"},
      relationships: {type: "list", objectType: "IndividualRelationship"},
      groupSubjects: {type: "list", objectType: "GroupSubject"},
      registrationLocation: {type: "Point", optional: true},
      latestEntityApprovalStatus: {type: "EntityApprovalStatus", optional: true},
      comments: {type: "list", objectType: "Comment"},
      groups: {type: "list", objectType: "GroupSubject"},
    },
  };

  static validationKeys = {
    DOB: "DOB",
    GENDER: "GENDER",
    FIRST_NAME: "FIRST_NAME",
    MIDDLE_NAME: "MIDDLE_NAME",
    LAST_NAME: "LAST_NAME",
    PROFILE_PICTURE: "PROFILE_PICTURE",
    REGISTRATION_DATE: "REGISTRATION_DATE",
    LOWEST_ADDRESS_LEVEL: "LOWEST_ADDRESS_LEVEL",
    REGISTRATION_LOCATION: "REGISTRATION_LOCATION",
    NAME: "NAME",
  };

  static nonIndividualValidationKeys = {
    FIRST_NAME: "FIRST_NAME",
    REGISTRATION_DATE: "REGISTRATION_DATE",
    LOWEST_ADDRESS_LEVEL: "LOWEST_ADDRESS_LEVEL",
    REGISTRATION_LOCATION: "REGISTRATION_LOCATION",
    NAME: "NAME",
  };

  subjectType: SubjectType;
  uuid: string;
  name: string;
  registrationDate: Date;
  gender: Gender;
  encounters: Encounter[];
  observations: Observation[];
  enrolments: ProgramEnrolment[];
  relationships: IndividualRelationship[];
  groupSubjects: GroupSubject[];
  groups: GroupSubject[];
  affiliatedGroups: GroupSubject[];
  lowestAddressLevel: AddressLevel;
  voided: boolean;
  dateOfBirth: Date;
  registrationLocation: Point;
  firstName: any;
  middleName: any;
  lastName: any;
  profilePicture: any;
  dateOfBirthVerified: any;
  latestEntityApprovalStatus: EntityApprovalStatus;
  comments: Comment[];

  static createEmptyInstance() {
    const individual = new Individual();
    individual.uuid = General.randomUUID();
    individual.subjectType = SubjectType.create("");
    individual.registrationDate = new Date();
    individual.gender = Gender.create("");
    individual.observations = [];
    individual.encounters = [];
    individual.enrolments = [];
    individual.relationships = [];
    individual.groupSubjects = [];
    individual.groups = [];
    individual.lowestAddressLevel = AddressLevel.create({
      uuid: "",
      title: "",
      level: 0,
      typeString: "",
      titleLineage: "",
      voided: false,
      parentUuid: "",
      typeUuid: "",
      locationProperties: []
    });
    individual.voided = false;
    individual.comments = [];
    return individual;
  }

  static createEmptySubjectInstance() {
    const individual = Individual.createEmptyInstance();
    individual.gender = null;
    return individual;
  }

  get toResource() {
    const resource = _.pick(this, [
      "uuid",
      "firstName",
      "middleName",
      "lastName",
      "profilePicture",
      "dateOfBirthVerified",
      "voided",
    ]);
    resource.dateOfBirth = this.dateOfBirth ? moment(this.dateOfBirth).format("YYYY-MM-DD") : null;
    resource.registrationDate = moment(this.registrationDate).format("YYYY-MM-DD");
    resource["genderUUID"] = this.gender ? this.gender.uuid : null;
    resource["addressLevelUUID"] = this.lowestAddressLevel.uuid;
    resource["subjectTypeUUID"] = this.subjectType.uuid;

    if (!_.isNil(this.registrationLocation)) {
      resource["registrationLocation"] = this.registrationLocation.toResource;
    }

    resource["observations"] = [];
    this.observations.forEach((obs) => {
      resource["observations"].push(obs.toResource);
    });

    return resource;
  }

  findObservationAcrossAllEnrolments(conceptNameOrUuid) {
    return this.nonVoidedEnrolments().find(
      (enrolment) => enrolment.findLatestObservationInEntireEnrolment(conceptNameOrUuid) !== undefined
    );
  }

  observationExistsAcrossAllEnrolments(conceptNameOrUuid) {
    return this.nonVoidedEnrolments().find(
      (enrolment) => enrolment.findLatestObservationInEntireEnrolment(conceptNameOrUuid) !== undefined
    );
  }

  static newInstance(
    uuid,
    firstName,
    lastName,
    dateOfBirth,
    dateOfBirthVerified,
    gender,
    lowestAddressLevel,
    subjectType,
    profilePicture
  ) {
    const individual = new Individual();
    individual.uuid = uuid;
    individual.firstName = firstName;
    individual.lastName = lastName;
    individual.profilePicture = profilePicture;
    individual.subjectType = subjectType;
    individual.name = individual.nameString;
    individual.dateOfBirth = dateOfBirth;
    individual.dateOfBirthVerified = dateOfBirthVerified;
    individual.gender = gender;
    individual.lowestAddressLevel = lowestAddressLevel;
    return individual;
  }

  static fromResource(individualResource, entityService) {
    const addressLevel = entityService.findByKey(
      "uuid",
      ResourceUtil.getUUIDFor(individualResource, "addressUUID"),
      AddressLevel.schema.name
    );
    const gender = entityService.findByKey(
      "uuid",
      ResourceUtil.getUUIDFor(individualResource, "genderUUID"),
      Gender.schema.name
    );
    const subjectType = entityService.findByKey(
      "uuid",
      ResourceUtil.getUUIDFor(individualResource, "subjectTypeUUID"),
      SubjectType.schema.name
    );
    const individual = General.assignFields(
      individualResource,
      new Individual(),
      ["uuid", "firstName", "middleName", "lastName", "profilePicture", "dateOfBirthVerified", "voided"],
      ["dateOfBirth", "registrationDate"],
      ["observations"],
      entityService
    );
    individual.gender = gender;
    individual.lowestAddressLevel = addressLevel;
    individual.name = `${individual.firstName} ${individual.lastName}`;
    if (!_.isNil(individualResource.registrationLocation))
      individual.registrationLocation = Point.fromResource(individualResource.registrationLocation);
    individual.subjectType = subjectType;
    return individual;
  }

  isMale() {
    return this.gender.isMale();
  }

  isFemale() {
    return this.gender.isFemale();
  }

  static merge = (childEntityClass) =>
    BaseEntity.mergeOn(
      new Map<any, any>([
        [ProgramEnrolment, "enrolments"],
        [Encounter, "encounters"],
        [IndividualRelationship, "relationships"],
        [Comment, "comments"],
      ]).get(childEntityClass)
    );

  static mergeMultipleParents = (childEntityClass, entities) => {
    if (childEntityClass === GroupSubject) {
      const individual = _.head(entities);
      const key = individual.subjectType.group ? 'groupSubjects' : 'groups';
      return BaseEntity.mergeOn(key)(entities);
    }
  };

  static associateRelationship(child, childEntityClass, childResource, entityService) {
    var individual = BaseEntity.getParentEntity(
      entityService,
      childEntityClass,
      childResource,
      "individualAUUID",
      Individual.schema.name
    );
    individual = General.pick(
      individual,
      ["uuid"],
      ["enrolments", "encounters", "relationships", "groupSubjects", "comments", "groups"]
    );
    BaseEntity.addNewChild(child, individual.relationships);
    return individual;
  }

  static associateGroupSubject(child, childEntityClass, childResource, entityService) {
    const getParentByUUID = (parentUUIDField) => BaseEntity.getParentEntity(entityService, childEntityClass, childResource, parentUUIDField, Individual.schema.name);
    const copyFieldsForSubject = (subject) => General.pick(subject, ["uuid", "subjectType"], ["enrolments", "encounters", "relationships", "groupSubjects", "comments", "groups"]);
    var groupSubject = getParentByUUID("groupSubjectUUID");
    groupSubject = copyFieldsForSubject(groupSubject);
    BaseEntity.addNewChild(child, groupSubject.groupSubjects);
    //Don't associate voided member subjects if not found in the catchment
    try {
      var memberSubject = getParentByUUID("memberSubjectUUID");
      memberSubject = copyFieldsForSubject(memberSubject);
      BaseEntity.addNewChild(child, memberSubject.groups);
      return [groupSubject, memberSubject];
    } catch (e) {
      if (!childResource.voided) {
        throw e
      } else {
        return [groupSubject];
      }
    }
  }

  static childAssociations = () =>
    new Map<any, any>([
      [IndividualRelationship, "relationships"],
      [ProgramEnrolment, "enrolments"],
      [Encounter, "encounters"],
      [GroupSubject, "groupSubjects"],
      [Comment, "comments"],
    ]);

  static associateChildToMultipleParents(child, childEntityClass, childResource, entityService) {
    if (childEntityClass === GroupSubject) {
      return Individual.associateGroupSubject(
          child,
          childEntityClass,
          childResource,
          entityService
      );
    }
  }

  static associateChild(child, childEntityClass, childResource, entityService) {
    if (childEntityClass === IndividualRelationship) {
      return Individual.associateRelationship(
        child,
        childEntityClass,
        childResource,
        entityService
      );
    }
    var individual = BaseEntity.getParentEntity(
      entityService,
      childEntityClass,
      childResource,
      "individualUUID",
      Individual.schema.name
    );
    individual = General.pick(
      individual,
      ["uuid"],
      ["enrolments", "encounters", "relationships", "groupSubjects", "comments", "groups"]
    );

    if (childEntityClass === ProgramEnrolment) BaseEntity.addNewChild(child, individual.enrolments);
    else if (childEntityClass === Encounter) BaseEntity.addNewChild(child, individual.encounters);
    else if (childEntityClass === Comment) BaseEntity.addNewChild(child, individual.comments);
    else throw `${childEntityClass.name} not support by ${individual.nameString}`;

    return individual;
  }

  setFirstName(firstName) {
    this.firstName = firstName;
    this.name = this.nameString;
  }

  setLastName(lastName) {
    this.lastName = lastName;
    this.name = this.nameString;
  }

  getDisplayAge(i18n) {
    //Keeping date of birth to be always entered and displayed as per the current date. It would be perhaps more error prone for users to put themselves in the past and enter age as of that date
    const ageInYears = this.getAgeInYears();
    if (ageInYears < 1) {
      let ageInWeeks = moment().diff(this.dateOfBirth, "weeks");
      return ageInWeeks === 0
        ? Duration.inDay(moment().diff(this.dateOfBirth, "days")).toString(i18n)
        : Duration.inWeek(ageInWeeks).toString(i18n);
    } else if (ageInYears < 2) {
      return Duration.inMonth(moment().diff(this.dateOfBirth, "months")).toString(i18n);
    } else {
      return Duration.inYear(ageInYears).toString(i18n);
    }
  }

  getAgeAndDateOfBirthDisplay(i18n) {
    if (this.dateOfBirthVerified)
      return `${this.getDisplayAge(i18n)} (${General.toDisplayDate(this.dateOfBirth)})`;
    return this.getDisplayAge(i18n);
  }

  getAge(asOnDate = moment()) {
    if (this.getAgeInYears(asOnDate) > 0) return Duration.inYear(this.getAgeInYears());
    if (this.getAgeInMonths(asOnDate) > 0)
      return Duration.inMonth(asOnDate.diff(this.dateOfBirth, "months"));
    return Duration.inYear(0);
  }

  get nameString() {
    return this.isPerson() ? `${this.firstName} ${this.lastName}` : this.firstName;
  }

  //TODO: this will be fixed later where we specify the option to create a template to display another unique field along with the name
  get nameStringWithUniqueAttribute() {
    if (this.subjectType.name === 'Farmer') {
      const mobileNumber = this.getObservationReadableValue('Mobile Number', null);
      const numberToDisplay = mobileNumber ? `(${mobileNumber})` : '';
      return `${this.nameString} ${numberToDisplay}`
    } else {
      return this.nameString;
    }
  }

  getAgeIn(unit) {
    return (asOnDate = moment(), precise = false) =>
      moment(asOnDate).diff(this.dateOfBirth, unit, precise);
  }

  getAgeInMonths(asOnDate = moment(), precise = false) {
    return this.getAgeIn("months")(asOnDate, precise);
  }

  getAgeInWeeks(asOnDate, precise) {
    return this.getAgeIn("weeks")(asOnDate, precise);
  }

  getAgeInYears(asOnDate = moment(), precise = false) {
    return this.getAgeIn("years")(asOnDate, precise);
  }

  toSummaryString() {
    return `${this.name}, Age: ${this.getAge().toString()}, ${this.gender.name}`;
  }

  setDateOfBirth(date) {
    this.dateOfBirth = date;
    this.dateOfBirthVerified = true;
  }

  setAge(age, isInYears) {
    this.dateOfBirth = moment()
      .subtract(age, isInYears ? "years" : "months")
      .toDate();
    this.dateOfBirthVerified = false;
  }

  validateDateOfBirth() {
    if (_.isNil(this.dateOfBirth)) {
      return ValidationResult.failure(Individual.validationKeys.DOB, "emptyValidationMessage");
    } else if (!moment(this.dateOfBirth).isValid()) {
      return ValidationResult.failure(Individual.validationKeys.DOB, "invalidDateFormat");
    } else if (this.getAgeInYears() > 120) {
      return ValidationResult.failure(Individual.validationKeys.DOB, "ageTooHigh");
    } else if (this.isRegistrationBeforeDateOfBirth) {
      return ValidationResult.failure(
        Individual.validationKeys.DOB,
        "registrationBeforeDateOfBirth"
      );
    } else if (General.dateIsAfterToday(this.dateOfBirth)) {
      return ValidationResult.failure(Individual.validationKeys.DOB, "birthDateInFuture");
    } else {
      return ValidationResult.successful(Individual.validationKeys.DOB);
    }
  }

  get isRegistrationBeforeDateOfBirth() {
    if (_.isNil(this.dateOfBirth) || _.isNil(this.registrationDate)) return false;
    return General.dateAIsAfterB(this.dateOfBirth, this.registrationDate);
  }

  validateRegistrationDate() {
    const validationResult = this.validateFieldForEmpty(
      this.registrationDate,
      Individual.validationKeys.REGISTRATION_DATE
    );
    if (validationResult.success && !moment(this.registrationDate).isValid()) {
      return ValidationResult.failure(
        Individual.validationKeys.REGISTRATION_DATE,
        "invalidDateFormat"
      );
    }
    if (validationResult.success && this.isRegistrationBeforeDateOfBirth) {
      return ValidationResult.failure(
        Individual.validationKeys.REGISTRATION_DATE,
        "registrationBeforeDateOfBirth"
      );
    }
    if (validationResult.success && General.dateIsAfterToday(this.registrationDate)) {
      return ValidationResult.failure(
        Individual.validationKeys.REGISTRATION_DATE,
        "registrationDateInFuture"
      );
    }
    return validationResult;
  }

  validateName(value, validationKey, validFormat) {
    const failure = new ValidationResult(false, validationKey);
    if (_.isEmpty(value)) {
      failure.messageKey = "emptyValidationMessage";
    } else if (!_.isEmpty(validFormat) && !validFormat.valid(value)) {
      failure.messageKey = validFormat.descriptionKey;
    } else {
      return new ValidationResult(true, validationKey, null);
    }
    return failure;
  }

  validateFirstName() {
    return this.validateName(this.firstName, Individual.validationKeys.FIRST_NAME, this.subjectType.validFirstNameFormat);
  }

  validateMiddleName() {
    return this.validateName(this.middleName, Individual.validationKeys.MIDDLE_NAME, this.subjectType.validMiddleNameFormat);
  }

  validateLastName() {
    return this.validateName(this.lastName, Individual.validationKeys.LAST_NAME, this.subjectType.validLastNameFormat);
  }

  validateRegistrationLocation() {
    return this.validateFieldForNull(
      this.registrationLocation,
      Individual.validationKeys.REGISTRATION_LOCATION
    );
  }

  validate() {
    const validationResults = [];
    if (!this.subjectType.allowEmptyLocation) {
      validationResults.push(this.validateAddress());
    }
    validationResults.push(this.validateRegistrationDate());
    //validationResults.push(this.validateRegistrationLocation());
    validationResults.push(this.validateFirstName());

    if (this.subjectType.isPerson()) {
      validationResults.push(this.validateLastName());
      validationResults.push(this.validateDateOfBirth());
      validationResults.push(this.validateGender());
    }
    return validationResults;
  }

  validateAddress() {
    let validateAddressFieldForEmpty = this.validateFieldForEmpty(
      _.isEmpty(this.lowestAddressLevel) ? undefined : this.lowestAddressLevel.name,
      Individual.validationKeys.LOWEST_ADDRESS_LEVEL
    );
    return validateAddressFieldForEmpty;
  }

  validateGender() {
    return this.validateFieldForEmpty(
      _.isEmpty(this.gender) ? undefined : this.gender.name,
      Individual.validationKeys.GENDER
    );
  }

  isGender(gender) {
    return this.gender === gender;
  }

  eligiblePrograms(allPrograms) {
    const eligiblePrograms = _.slice(allPrograms);

    _.remove(eligiblePrograms, (program) => {
      const find = _.find(this.nonVoidedEnrolments(), (enrolment) => {
        return enrolment.program.uuid === program.uuid && enrolment.isActive;
      });
      return find !== undefined;
    });

    return eligiblePrograms;
  }

  addEncounter(encounter) {
    if (!_.some(this.encounters, (it) => it.uuid === encounter.uuid)) {
      this.encounters = this.encounters || [];
      this.encounters.push(encounter);
    }
  }

  nonVoidedEncounters() {
    return _.reject(this.encounters, "voided");
  }

  nonVoidedEnrolments() {
    return this.enrolments.filter((x) => !x.voided);
  }

  cloneForEdit() {
    const individual = new Individual();
    individual.uuid = this.uuid;
    individual.subjectType = this.subjectType.clone();
    individual.name = this.name;
    individual.firstName = this.firstName;
    individual.middleName = this.middleName;
    individual.lastName = this.lastName;
    individual.profilePicture = this.profilePicture;
    individual.dateOfBirth = this.dateOfBirth;
    individual.registrationDate = this.registrationDate;
    individual.dateOfBirthVerified = this.dateOfBirthVerified;
    individual.voided = this.voided;
    individual.gender = _.isNil(this.gender) ? null : this.gender.clone();
    individual.lowestAddressLevel = _.isNil(this.lowestAddressLevel)
      ? null
      : _.assignIn({}, this.lowestAddressLevel);
    individual.observations = ObservationsHolder.clone(this.observations);
    individual.registrationLocation = _.isNil(this.registrationLocation)
      ? null
      : this.registrationLocation.clone();
    individual.relationships = this.relationships;
    individual.groupSubjects = this.groupSubjects;
    individual.groups = this.groups;
    individual.affiliatedGroups = this.affiliatedGroups;
    individual.encounters = this.encounters;
    individual.enrolments = this.enrolments;
    individual.latestEntityApprovalStatus = this.latestEntityApprovalStatus;
    individual.comments = this.comments;
    return individual;
  }

  cloneForReference() {
    const individual = new Individual();
    individual.uuid = this.uuid;
    individual.name = this.name;
    individual.firstName = this.firstName;
    individual.middleName = this.middleName;
    individual.lastName = this.lastName;
    individual.profilePicture = this.profilePicture;
    individual.dateOfBirth = this.dateOfBirth;
    individual.gender = _.isNil(this.gender) ? null : this.gender.clone();
    return individual;
  }

  get hasActiveEnrolment() {
    return _.some(this.nonVoidedEnrolments(), (enrolment) => enrolment.isActive);
  }

  get firstActiveOrRecentEnrolment() {
    return _(this.nonVoidedEnrolments()).sortBy(["isActive", "enrolmentDateTime"]).last();
  }

  get hasEnrolments() {
    return this.nonVoidedEnrolments().length;
  }

  findEnrolment(enrolmentUUID) {
    return _.find(this.nonVoidedEnrolments(), (enrolment) => enrolment.uuid === enrolmentUUID);
  }

  addEnrolment(programEnrolment) {
    if (!_.some(this.enrolments, (x) => x.uuid === programEnrolment.uuid)) {
      this.enrolments.push(programEnrolment);
    }
  }

  addRelationship(relationship) {
    if (!_.some(this.relationships, (x) => x.uuid === relationship.uuid)) {
      this.relationships = _.isEmpty(this.relationships) ? [] : this.relationships;
      this.relationships.push(relationship);
    }
  }

  addGroupSubject(groupSubject) {
    if (!_.some(this.groupSubjects, (x) => x.uuid === groupSubject.uuid)) {
      this.groupSubjects = _.isEmpty(this.groupSubjects) ? [] : this.groupSubjects;
      this.groupSubjects.push(groupSubject);
    }
  }

  addGroup(groupSubject) {
    if (!_.some(this.groups, (x) => x.uuid === groupSubject.uuid)) {
      this.groups = _.isEmpty(this.groups) ? [] : this.groups;
      this.groups.push(groupSubject);
    }
  }

  addAffiliatedGroups(groupSubjects = []) {
    this.affiliatedGroups = groupSubjects;
  }

  addComment(comment) {
    if (!_.some(this.comments, (x) => x.uuid === comment.uuid)) {
      this.comments = _.isEmpty(this.comments) ? [] : this.comments;
      this.comments.push(comment);
    }
  }

  findObservation(conceptNameOrUuid, parentConceptNameOrUuid) {
    const observations = _.isNil(parentConceptNameOrUuid) ? this.observations : this.findGroupedObservation(parentConceptNameOrUuid);
    return _.find(observations, (observation) => {
      return (observation.concept.name === conceptNameOrUuid) || (observation.concept.uuid === conceptNameOrUuid);
    });
  }

  findGroupedObservation(parentConceptNameOrUuid) {
    const groupedObservations =_.find(this.observations, (observation) =>
      (observation.concept.name === parentConceptNameOrUuid) || (observation.concept.uuid === parentConceptNameOrUuid));
    return _.isEmpty(groupedObservations) ? [] : groupedObservations.getValue();
  }

  getObservationValue(conceptNameOrUuid, parentConceptNameOrUuid) {
    const observationForConcept = this.findObservation(conceptNameOrUuid, parentConceptNameOrUuid);
    return _.isEmpty(observationForConcept)
      ? observationForConcept
      : observationForConcept.getValue();
  }

  getRelationships() {
    return _.filter(this.relationships, (v) => !v.voided);
  }

  getGroupSubjects() {
    return _.filter(this.groupSubjects, (g) => !g.voided);
  }

  getGroups() {
    return _.filter(this.groups, (g) => !g.voided);
  }

  getRelative(relationName, inverse = false) {
    return _.head(this.getRelatives(relationName, inverse));
  }

  getRelatives(relationName, inverse = false) {
    return _.filter(this.getRelationships(), (relation) => {
      return inverse
        ? relation.relationship.individualAIsToBRelation.name === relationName
        : relation.relationship.individualBIsToARelation.name === relationName;
    }).map((relation) => relation.individualB);
  }

  getPreviousEnrolment(programName, enrolmentUUID) {
    const chronologicalEnrolments = this.chronologicalEnrolments;
    let index = _.findIndex(
      chronologicalEnrolments,
      (enrolment) => enrolment.uuid === enrolmentUUID
    );
    while (index > 0) {
      if (chronologicalEnrolments[--index].program.name === programName)
        return chronologicalEnrolments[index];
    }
    return null;
  }

  get chronologicalEnrolments() {
    return _.sortBy(this.nonVoidedEnrolments(), (enrolment) => enrolment.encounterDateTime);
  }

  getProfilePicture() {
    return this.profilePicture;
  }

  updateProfilePicture(newValue) {
    this.profilePicture = newValue;
  }

  findMediaObservations() {
    return findMediaObservations(this.observations);
  }

  replaceMediaObservation(originalValue, newValue, conceptUUID) {
    new ObservationsHolder(this.observations).replaceMediaObservation(originalValue, newValue, conceptUUID);
  }

  replaceObservation(originalValue, newValue) {
    new ObservationsHolder(this.observations).updateObservationBasedOnValue(
      originalValue,
      newValue
    );
  }

  //TODO use polymorphism to avoid if checks based on this
  isPerson() {
    //TODO this nil check is not required when migration works properly
    return _.isNil(this.subjectType) || this.subjectType.isPerson();
  }

  isHousehold() {
    return this.subjectType.isHousehold();
  }

  isGroup() {
    return this.subjectType.isGroup();
  }

  isUniqueName() {
    return !!this.subjectType.uniqueName;
  }

  get subjectTypeName() {
    return this.subjectType.name;
  }

  getHeadOfHouseholdGroupSubject() {
    return _.find(
      this.groupSubjects.filter(({voided}) => !voided),
      ({groupRole}) => groupRole.isHeadOfHousehold
    );
  }

  userProfileSubtext1(i18n) {
    return this.isPerson() ? i18n.t(this.gender.name) : "";
  }

  userProfileSubtext2(i18n) {
    return this.isPerson() ? this.getDisplayAge(i18n) : "";
  }

  //TODO these methods are slightly differece because of differece in UI on search result and my dashboard listing. Not taking the hit right now.
  detail1(i18n) {
    return this.isPerson() ? {label: "Age", value: this.getDisplayAge(i18n)} : {};
  }

  detail2(i18n) {
    return this.isPerson() ? {label: "Gender", value: i18n.t(this.gender.name)} : {};
  }

  address(i18n) {
    return {label: "Address", value: i18n.t(this.lowestAddressLevel.name)};
  }

  _getEncounters(removeCancelledEncounters) {
    return _.chain(this.nonVoidedEncounters())
      .filter((encounter) => (removeCancelledEncounters ? _.isNil(encounter.cancelDateTime) : true))
      .sortBy((encounter) => moment().diff(encounter.encounterDateTime));
  }

  getEncounters(removeCancelledEncounters) {
    return this._getEncounters(removeCancelledEncounters).value();
  }

  scheduledEncounters() {
    return _.filter(
      this.getEncounters(true),
      (encounter) => !encounter.encounterDateTime && _.isNil(encounter.cancelDateTime)
    );
  }

  findObservationInLastEncounter(conceptNameOrUuid, currentEncounter) {
    const lastEncounter = this.findLastEncounterOfType(currentEncounter, _.get(currentEncounter, 'encounterType'));
    return lastEncounter ? lastEncounter.findObservation(conceptNameOrUuid) : null;
  }

  findLastEncounterOfType(currentEncounter, encounterTypes = []) {
    return this.findNthLastEncounterOfType(currentEncounter, encounterTypes, 0);
  }

  findNthLastEncounterOfType(currentEncounter, encounterTypes = [], n = 0) {
    return _.chain(this.getEncounters(false))
      .filter((enc) => enc.encounterDateTime)
      .filter((enc) => enc.encounterDateTime < currentEncounter.encounterDateTime)
      .filter((enc) =>
        encounterTypes.some((encounterType) => encounterType === enc.encounterType.name)
      )
      .nth(n)
      .value();
  }

  _findObservationWithDateFromAllEncounters(conceptNameOrUuid, encounters) {
    let observation;
    let encounter;
    for (let i = 0; i < encounters.length; i++) {
      encounter = encounters[i];
      observation = encounters[i].findObservation(conceptNameOrUuid);
      if (!_.isNil(observation))
        return {observation: observation, date: encounter.encounterDateTime};
    }
    return {};
  }

  _findObservationFromAllEncounters(conceptNameOrUuid, encounters) {
    return this._findObservationWithDateFromAllEncounters(
        conceptNameOrUuid,
      encounters
    ).observation;
  }

  findLatestObservationFromPreviousEncounters(conceptNameOrUuid, currentEncounter) {
    const encounters = _.chain(this.getEncounters(false))
      .filter((enc) => enc.encounterDateTime)
      .filter((enc) => enc.encounterDateTime < currentEncounter.encounterDateTime)
      .value();
    return this._findObservationFromAllEncounters(conceptNameOrUuid, encounters);
  }

  findLatestObservationFromEncounters(conceptNameOrUuid, currentEncounter) {
    const previousEncounters = _.chain(this.getEncounters(false))
      .filter((enc) => enc.encounterDateTime)
      .filter((enc) =>
        currentEncounter ? enc.encounterDateTime < currentEncounter.encounterDateTime : true
      )
      .value();
    const encounters = _.chain(currentEncounter).concat(previousEncounters).compact().value();
    return this._findObservationFromAllEncounters(conceptNameOrUuid, encounters);
  }

  scheduledEncountersOfType(encounterTypeName) {
    return this.scheduledEncounters().filter(
      (scheduledEncounter) => scheduledEncounter.encounterType.name === encounterTypeName
    );
  }

  getAllScheduledVisits(currentEncounter) {
    return _.defaults(this.scheduledEncounters(), [])
      .filter((encounter) => encounter.uuid !== currentEncounter.uuid)
      .map(_.identity)
      .map(({uuid, name, encounterType, earliestVisitDateTime, maxVisitDateTime}) => ({
        name: name,
        encounterType: encounterType.name,
        earliestDate: earliestVisitDateTime,
        maxDate: maxVisitDateTime,
        uuid: uuid,
      }));
  }

  getMobileNo() {
    for (let i = 0; i < this.observations.length; i++) {
      const observation = this.observations[i];
      const mobileNo = observation.getMobileNo();
      if (mobileNo) {
        return mobileNo;
      }
    }
  }

  getObservationReadableValue(conceptNameOrUuid, parentConceptNameOrUuid) {
    const observationForConcept = this.findObservation(conceptNameOrUuid, parentConceptNameOrUuid);
    return _.isEmpty(observationForConcept)
      ? observationForConcept
      : observationForConcept.getReadableValue();
  }

  get individual() {
    return this;
  }

  getEntityTypeName() {
    return this.subjectTypeName;
  }

    getName() {
        return 'Registration';
    }

    isRejectedEntity() {
        return this.latestEntityApprovalStatus && this.latestEntityApprovalStatus.isRejected;
    }

  toJSON() {
    return {
      uuid: this.uuid,
      firstName: this.firstName,
      middleName: this.middleName,
      lastName: this.lastName,
      profilePicture: this.profilePicture,
      enrolments: this.enrolments,
      dateOfBirth: this.dateOfBirth,
      gender: this.gender,
      registrationDate: this.registrationDate,
      lowestAddressLevel: this.lowestAddressLevel,
      encounters: this.encounters,
      observations: this.observations,
      relationships: this.relationships,
      groupSubjects: this.groupSubjects,
      groups: this.groups,
      voided: this.voided,
      registrationLocation: this.registrationLocation,
      subjectType: this.subjectType,
      latestEntityApprovalStatus: this.latestEntityApprovalStatus,
      comments: this.comments,
    };
  }
}

export default Individual;
