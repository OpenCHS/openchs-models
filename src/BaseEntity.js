import _ from "lodash";
import ValidationResult from "./application/ValidationResult";
import ResourceUtil from "./utility/ResourceUtil";
import SyncError from "./error/SyncError";
import {ErrorCodes} from "./error/ErrorCodes";
import PersistedObject from "./PersistedObject";
import ah from "./framework/ArrayHelper";

class BaseEntity extends PersistedObject {
  static fieldKeys = {
    EXTERNAL_RULE: "EXTERNAL_RULE",
  };

  constructor(that) {
    super(that);
  }

  get voided() {
    return this.that.voided;
  }

  set voided(x) {
    this.that.voided = x;
  }

  set uuid(x) {
    this.that.uuid = x;
  }

  get uuid() {
    return this.that.uuid;
  }

  static mergeOn(key) {
    return (entities) => {
      return entities.reduce((acc, entity) => {
        const existingChildren = acc[key];
        entity[key].forEach((child) => BaseEntity.addNewChild(child, existingChildren));
        entity[key] = existingChildren;
        return entity;
      });
    };
  }

  /*
  to be used only during sync where entities are handled generically and not via model classes
   */
  static addNewChild(newChild, existingChildren) {
    if (!BaseEntity.collectionHasEntity(existingChildren, newChild)) {
      const child = _.isNil(newChild.that) ? newChild : newChild.that;
      existingChildren.push(child);
    }
  }

  static collectionHasEntity(collection, entity) {
    return _.some(collection, (item) => item.uuid === entity.uuid);
  }

  static removeFromCollection(collection, entity) {
    ah.remove(collection, (item) => item.uuid === entity.uuid);
  }

  equals(other) {
    return !_.isNil(other) && other.uuid === this.uuid;
  }

  validateFieldForEmpty(value, key) {
    if (value instanceof Date) {
      return _.isNil(value)
        ? ValidationResult.failure(key, "emptyValidationMessage")
        : ValidationResult.successful(key);
    }
    return _.isEmpty(value)
      ? ValidationResult.failure(key, "emptyValidationMessage")
      : ValidationResult.successful(key);
  }

  validateFieldForNull(value, key) {
    return _.isNil(value)
      ? ValidationResult.failure(key, "emptyValidationMessage")
      : ValidationResult.successful(key);
  }

  print() {
    return this.toString();
  }

  static getParentEntity(
    entityService,
    childEntityClass,
    childResource,
    parentUUIDField,
    parentSchema
  ) {
    const childUuid = childResource.uuid;
    const parentUuid = ResourceUtil.getUUIDFor(childResource, parentUUIDField);
    const childSchema = childEntityClass.schema.name;
    const parent = entityService.findByKey("uuid", parentUuid, parentSchema);
    if (!_.isNil(parent)) {
      return parent;
    }
    const errorCodeKey = `${childSchema}-${parentSchema}-Association`;
    throw new SyncError(ErrorCodes[errorCodeKey], `${childSchema}{uuid='${childUuid}'} is unable to find ${parentSchema}{uuid='${parentUuid}'}`);
  }
}
export default BaseEntity;
