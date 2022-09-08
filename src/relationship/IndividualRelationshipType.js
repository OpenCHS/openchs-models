import ResourceUtil from "../utility/ResourceUtil";
import General from "../utility/General";
import IndividualRelation from "./IndividualRelation";
import ReferenceEntity from "../ReferenceEntity";

class IndividualRelationshipType extends ReferenceEntity {
  static schema = {
    name: "IndividualRelationshipType",
    primaryKey: "uuid",
    properties: {
      uuid: "string",
      name: "string",
      individualAIsToBRelation: "IndividualRelation",
      individualBIsToARelation: "IndividualRelation",
      voided: { type: "bool", default: false },
    },
  };

  mapNonPrimitives(realmObject, entityMapper) {
    this.individualAIsToBRelation = entityMapper.toEntity(realmObject.individualAIsToBRelation, IndividualRelation);
    this.individualBIsToBRelation = entityMapper.toEntity(realmObject.individualBIsToBRelation, IndividualRelation);
  }

  static createEmptyInstance() {
    const individualRelationshipType = new IndividualRelationshipType();
    individualRelationshipType.individualAIsToBRelation = IndividualRelation.createEmptyInstance();
    individualRelationshipType.individualBIsToARelation = IndividualRelation.createEmptyInstance();
    return individualRelationshipType;
  }

  clone() {
    const individualRelationshipType = new IndividualRelationshipType();
    individualRelationshipType.uuid = this.uuid;
    individualRelationshipType.individualAIsToBRelation = this.individualAIsToBRelation;
    individualRelationshipType.individualBIsToARelation = this.individualBIsToARelation;
    individualRelationshipType.voided = this.voided;
    return individualRelationshipType;
  }

  static fromResource(resource, entityService) {
    const individualAIsToBRelation = entityService.findEntity(
      "uuid",
      ResourceUtil.getUUIDFor(resource, "individualAIsToBRelationUUID"),
      IndividualRelation.schema.name
    );
    const individualBIsToBRelation = entityService.findEntity(
      "uuid",
      ResourceUtil.getUUIDFor(resource, "individualBIsToBRelationUUID"),
      IndividualRelation.schema.name
    );

    const individualRelationshipType = General.assignFields(
      resource,
      new IndividualRelationshipType(),
      ["uuid", "name", "voided"]
    );
    individualRelationshipType.individualAIsToBRelation = individualAIsToBRelation;
    individualRelationshipType.individualBIsToARelation = individualBIsToBRelation;

    return individualRelationshipType;
  }

  static parentAssociations = () =>
    new Map([
      [IndividualRelation, "individualAIsToBRelationUUID"],
      [IndividualRelation, "individualBIsToBRelationUUID"],
    ]);
}

export default IndividualRelationshipType;
