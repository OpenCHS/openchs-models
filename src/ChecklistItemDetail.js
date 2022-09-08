import _ from "lodash";
import ResourceUtil from "./utility/ResourceUtil";
import General from "./utility/General";
import BaseEntity from "./BaseEntity";
import Form from "./application/Form";
import ChecklistDetail from "./ChecklistDetail";
import Concept from "./Concept";
import ChecklistItemStatus from "./ChecklistItemStatus";
import ProgramEncounter from "./ProgramEncounter";
import Checklist from "./Checklist";

class ChecklistItemDetail extends BaseEntity {
  static schema = {
    name: "ChecklistItemDetail",
    primaryKey: "uuid",
    properties: {
      uuid: "string",
      concept: "Concept",
      stateConfig: { type: "list", objectType: "ChecklistItemStatus" },
      form: { type: "Form", optional: true },
      checklistDetail: "ChecklistDetail",
      voided: { type: "bool", default: false },
      dependentOn: { type: "ChecklistItemDetail", optional: true },
      scheduleOnExpiryOfDependency: { type: "bool", default: false },
      minDaysFromStartDate: { type: "int", optional: true },
      minDaysFromDependent: { type: "int", optional: true },
      expiresAfter: { type: "int", optional: true },
    },
  };

  static parentAssociations = () =>
    new Map([
      [ChecklistDetail, "checklistDetailUUID"],
      [Form, "formUUID"],
      [Concept, "conceptUUID"],
      [ChecklistItemDetail, "leadDetailUUID"],
    ]);

  static fromResource(checklistItemResource, entityService, resourcesInCurrentPage) {
    const checklistDetail = entityService.findEntity(
      "uuid",
      ResourceUtil.getUUIDFor(checklistItemResource, "checklistDetailUUID"),
      ChecklistDetail.schema.name
    );
    const form = entityService.findEntity(
      "uuid",
      ResourceUtil.getUUIDFor(checklistItemResource, "formUUID"),
      Form.schema.name
    );
    const concept = entityService.findEntity(
      "uuid",
      ResourceUtil.getUUIDFor(checklistItemResource, "conceptUUID"),
      Concept.schema.name
    );
    const checklistItemDetail = General.assignFields(
      checklistItemResource,
      new ChecklistItemDetail(),
      [
        "uuid",
        "voided",
        "scheduleOnExpiryOfDependency",
        "minDaysFromStartDate",
        "minDaysFromDependent",
        "expiresAfter",
      ]
    );
    checklistItemDetail.stateConfig = _.get(
      checklistItemResource,
      "checklistItemStatus",
      []
    ).map((itemStatus) => ChecklistItemStatus.fromResource(itemStatus, entityService));
    checklistItemDetail.checklistDetail = checklistDetail;
    checklistItemDetail.form = form;
    checklistItemDetail.concept = concept;
    const leadDetailUUID = ResourceUtil.getUUIDFor(checklistItemResource, "leadDetailUUID");
    if (!_.isNil(leadDetailUUID)) {
      const createdLeadChecklistItemDetail = entityService.findEntity(
        "uuid",
        leadDetailUUID,
        ChecklistItemDetail.schema.name
      );
      if (_.isNil(createdLeadChecklistItemDetail)) {
        let leadDetail = resourcesInCurrentPage.find((entity) => entity.uuid === leadDetailUUID);
        checklistItemDetail.dependentOn = ChecklistItemDetail.fromResource(
          leadDetail,
          entityService,
          resourcesInCurrentPage
        );
      } else {
        checklistItemDetail.dependentOn = createdLeadChecklistItemDetail;
      }
    }
    return checklistItemDetail;
  }

  get isDependent() {
    return !_.isNil(this.dependentOn);
  }
}

export default ChecklistItemDetail;
