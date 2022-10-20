import _ from "lodash";
import RealmListProxy from "./framework/RealmListProxy";
import RealmObjectSchema from "./framework/RealmObjectSchema";

class PersistedObject {
  constructor(that) {
    this.that = _.isNil(that) ? {} : that;
  }

  toEntityList(property, listItemClass) {
    const realmList = this.that[property];
    if (realmList) {
      const realmListProxy = new RealmListProxy(realmList);
      realmListProxy.pushAll(listItemClass);
      return realmListProxy;
    }
    return null;
  }

  fromEntityList(list) {
    let realmList = null;
    if (!_.isNil(list)) {
      realmList = [];
      list.forEach((x) => realmList.push(x.that));
    }
    return realmList;
  }

  toEntity(property, entityClass) {
    const propertyValue = this.that[property];
    if (_.isNil(propertyValue)) return null;

    return new entityClass(propertyValue);
  }

  fromObject(x) {
    if (_.isNil(x) || _.isNil(x.that)) return x;
    return x.that;
  }

  toJSON() {
    const json = {};
    if (!_.isNil(this.that) && !_.isNil(this.that.objectSchema)) {
      const realmObjectSchema = new RealmObjectSchema(this.that.objectSchema());
      realmObjectSchema.getAllProperties().forEach(p => json[p] = this.that[p]);
    }
    return json;
  }

  /**
   * This is a helper method to be used to fetch property values from an entity instead of using the array-accessor approach.
   * Ex: Use entity.getValueFor(objectKey) instead of entity[objectKey]
   * Regex to use, to find instances where this method should be replaced, is as follows: \(.*[A-Za-z].*\[.*[A-Za-z].*\]\)
   * From results of above regex search, only a small sub-set would need to be replaced with below method invocation.
   * @param field
   * @returns {null|*}
   */
  getValueFor(field) {
    if (!_.isNil(this.that)) {
      return this.that[field];
    }
    return null;
  }
}

export default PersistedObject;
