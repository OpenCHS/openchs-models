import General from "../utility/General";
import BaseEntity from "../BaseEntity";
import FormElementGroup from "./FormElementGroup";
import _ from "lodash";
import FormMapping from "./FormMapping";
import DraftSubject from "../draft/DraftSubject";
import EntitySyncStatus from "../EntitySyncStatus";
import moment from "moment";
import QuestionGroup from "../observation/QuestionGroup";
import RepeatableQuestionGroup from "../observation/RepeatableQuestionGroup";

class Form {
  static schema = {
    name: "Form",
    primaryKey: "uuid",
    properties: {
      uuid: "string",
      formType: "string",
      name: "string",
      formElementGroups: { type: "list", objectType: "FormElementGroup" },
      decisionRule: { type: "string", optional: true },
      visitScheduleRule: { type: "string", optional: true },
      validationRule: { type: "string", optional: true },
      checklistsRule: { type: "string", optional: true },
      taskScheduleRule: { type: "string", optional: true }
    },
  };

  static safeInstance() {
    const form = new Form();
    form.formElementGroups = [];
    return form;
  }

  removeFormElement(formElementName) {
    this.formElementGroups = _.map(this.formElementGroups, (formElementGroup) => {
      return formElementGroup.removeFormElement(formElementName);
    });
    return this;
  }

  static fromResource(resource, entityService) {
    const formSyncStatus = entityService.findByCriteria(`entityName = 'Form'`, EntitySyncStatus.schema.name);
    if (resource.formType === this.formTypes.IndividualProfile && formSyncStatus
        && moment(formSyncStatus.loadedSince).isBefore(moment(resource.lastModifiedDateTime))) {
      this.deleteOutOfSyncDrafts(entityService, resource.uuid);
    }
    return General.assignFields(resource, new Form(), [
      "uuid",
      "name",
      "formType",
      "decisionRule",
      "visitScheduleRule",
      "taskScheduleRule",
      "validationRule",
      "checklistsRule",
      "taskScheduleRule"
    ]);
  }

  static deleteOutOfSyncDrafts(entityService, formUUID) {
    const formMappings = entityService.findAllByCriteria(`form.uuid = '${formUUID}'`, FormMapping.schema.name);
    _.forEach(formMappings, ({subjectType}) => {
      const outOfSyncDrafts = entityService.findAll(DraftSubject.schema.name)
          .filtered(`subjectType = $0`, subjectType);
      entityService.clearDataIn(outOfSyncDrafts);
    })
  }

  static childAssociations = () => new Map([[FormElementGroup, "formElementGroups"]]);

  static merge = () => BaseEntity.mergeOn("formElementGroups");

  static associateChild(child, childEntityClass, childResource, entityService) {
    let form = BaseEntity.getParentEntity(
      entityService,
      childEntityClass,
      childResource,
      "formUUID",
      Form.schema.name
    );
    form = General.pick(form, ["uuid"], ["formElementGroups"]);
    if (childEntityClass === FormElementGroup) {
      BaseEntity.addNewChild(child, form.formElementGroups);
    } else throw `${childEntityClass.name} not support by Form`;
    return form;
  }

  addFormElementGroup(formElementGroup) {
    formElementGroup.form = this;
    this.formElementGroups.push(formElementGroup);
  }

  formElementGroupAt(displayOrder) {
    return _.find(
      this.formElementGroups,
      (formElementGroup) => formElementGroup.displayOrder === displayOrder
    );
  }

  getNextFormElement(displayOrder) {
    const currentIndex = _.findIndex(
      this.getFormElementGroups(),
      (feg) => feg.displayOrder === displayOrder
    );
    return this.getFormElementGroups()[currentIndex + 1];
  }

  getFormElementsOfType(type) {
    return _.reduce(
      this.formElementGroups,
      (idElements, feg) => _.concat(idElements, feg.getFormElementsOfType(type)),
      []
    );
  }

  getPrevFormElement(displayOrder) {
    const currentIndex = _.findIndex(
      this.getFormElementGroups(),
      (feg) => feg.displayOrder === displayOrder
    );
    return this.getFormElementGroups()[currentIndex - 1];
  }

  nonVoidedFormElementGroups() {
    return _.filter(this.formElementGroups, (formElementGroup) => !formElementGroup.voided);
  }

  getFormElementGroups() {
    return _.sortBy(this.nonVoidedFormElementGroups(), (feg) => feg.displayOrder);
  }

  getLastFormElementElementGroup() {
    return _.last(this.getFormElementGroups());
  }

  get numberOfPages() {
    return this.nonVoidedFormElementGroups().length;
  }

  get firstFormElementGroup() {
    return _.first(this.getFormElementGroups());
  }

  findFormElement(formElementName) {
    var formElement;
    _.forEach(this.nonVoidedFormElementGroups(), (formElementGroup) => {
      const foundFormElement = _.find(
        formElementGroup.getFormElements(),
        (formElement) => formElement.name === formElementName
      );
      if (!_.isNil(foundFormElement)) formElement = foundFormElement;
    });
    return formElement;
  }

  getSelectedAnswer(concept, nullReplacement) {
    const observation = this.props.observationHolder.findObservation(concept);
    return _.isNil(observation) ? nullReplacement : observation.getValueWrapper();
  }


  orderObservations(observations) {
    const orderedObservations = [];
    const formElementOrdering = _.sortBy(this.formElementGroups, (feg) => feg.displayOrder).map((feg) =>
        _.sortBy(feg.getFormElements(), (fe) => fe.displayOrder));
    _.flatten(formElementOrdering).map((formElement) => {
      this.addSortedObservations(formElement, observations, orderedObservations);
    });
    const extraObs = observations.filter((obs) =>
        _.isNil(orderedObservations.find((oobs) => oobs.concept.uuid === obs.concept.uuid))
    );
    return orderedObservations.concat(extraObs);
  }

  sectionWiseOrderedObservations(observations) {
    const sections = [];
    const allObservations = [];
    const orderedFEG = _.sortBy(this.formElementGroups, ({displayOrder}) => displayOrder);
    _.forEach(orderedFEG, feg => {
      const formElementOrdering = _.sortBy(feg.getFormElements(), (fe) => fe.displayOrder);
      const fegObs = [];
      _.forEach(formElementOrdering, formElement => {
        this.addSortedObservations(formElement, observations, fegObs);
      });
      if (!_.isEmpty(fegObs)) {
        sections.push({groupName: feg.name, groupUUID: feg.uuid, observations: fegObs, groupStyles: feg.styles});
        allObservations.push(...fegObs);
      }
    });
    const decisionObs = observations.filter((obs) =>
        _.isNil(allObservations.find((oobs) => oobs.concept.uuid === obs.concept.uuid))
    );
    if(!_.isEmpty(decisionObs))
      sections.push({groupName: 'decisions', groupUUID: null, observations: decisionObs, groupStyles: {}});
    return sections;
  }

  orderQuestionGroupObservations(observations, groupUuid) {
    const childFormElements = [];
    const orderedChildObs = [];
    _.forEach(this.formElementGroups, feg => _.forEach(feg.getFormElements(), fe => {
          if (fe.groupUuid === groupUuid) {
            childFormElements.push(fe)
          }
        })
    );
    const orderedFormElements = _.sortBy(childFormElements, fe => fe.displayOrder);
    _.forEach(orderedFormElements, (formElement) => this.addSortedObservations(formElement, observations, orderedChildObs));
    return orderedChildObs;
  }

  addSortedObservations(formElement, observations, orderedObservations) {
    const concept = formElement.concept;
    const foundObs = observations.find((obs) => obs.concept.uuid === concept.uuid);
    if (!_.isNil(foundObs) && concept.isQuestionGroup()) {
      const clonedObs = foundObs.cloneForEdit();
      const valueWrapper = clonedObs.getValueWrapper();
      const isRepeatable = valueWrapper.isRepeatable();
      const sortedChildObs = isRepeatable ? _.flatMap(valueWrapper.getValue(), questionGroup => new QuestionGroup(this.orderQuestionGroupObservations(questionGroup.getValue(), formElement.uuid))) :
          this.orderQuestionGroupObservations(valueWrapper.getValue(), formElement.uuid);
      clonedObs.valueJSON = JSON.stringify(isRepeatable ? new RepeatableQuestionGroup(sortedChildObs) : new QuestionGroup(sortedChildObs));
      if (!_.isEmpty(sortedChildObs)) {
          clonedObs.styles = formElement.styles;
          orderedObservations.push(clonedObs);
      }
    } else {
      if (!_.isNil(foundObs)) {
          foundObs.styles = formElement.styles;
          orderedObservations.push(foundObs);
      }
    }
  }

  getFormElementGroupOrder(groupUUID) {
    const orderedFEG = _.sortBy(this.nonVoidedFormElementGroups(), ({displayOrder}) => displayOrder);
    return _.findIndex(orderedFEG, ({uuid}) => uuid === groupUUID) + 1;
  }

  getMandatoryConcepts() {
    const mandatoryConcepts = [];
    _.forEach(this.nonVoidedFormElementGroups(), feg => {
      _.forEach(feg.nonVoidedFormElements(), fe => {
        if(fe.mandatory) {
          mandatoryConcepts.push(fe.concept);
        }
      })
    });
    return mandatoryConcepts;
  }

  static formTypes = {
    IndividualProfile: "IndividualProfile",
    Encounter: "Encounter",
    ProgramEncounter: "ProgramEncounter",
    ProgramEnrolment: "ProgramEnrolment",
    ProgramExit: "ProgramExit",
    ProgramEncounterCancellation: "ProgramEncounterCancellation",
    ChecklistItem: "ChecklistItem",
    IndividualEncounterCancellation: "IndividualEncounterCancellation",
    Task: "Task",
    SubjectEnrolmentEligibility : "SubjectEnrolmentEligibility",
    ManualProgramEnrolmentEligibility : "ManualProgramEnrolmentEligibility",
  };
}

export default Form;
