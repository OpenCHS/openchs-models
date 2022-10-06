// Extends only methods that mutate the array, others methods needn't be extended as the behavior can be
class RealmListProxy extends Array {
  constructor(realmList) {
    super();
    this.realmList = realmList;
  }

  /*
  Not to be used by external callers. Cannot be done in the constructor as somehow array doesn't take this via super()
   */
  pushAll(listItemClass) {
    this.realmList.forEach((x) => super.push(new listItemClass(x)));
  }

  pop() {
    this.realmList.pop();
    return super.pop();
  }

  push(...values) {
    super.push(...values);
    values.forEach((x) => this.realmList.push(x.that));
  }

  shift() {
    this.realmList.shift();
    return super.shift();
  }

  splice(index, count, ...values) {
    this.realmList.splice(index, count, ...values);
    return super.splice(index, count, ...values);
  }

  unshift(...values) {
    super.unshift(...values);
    return this.realmList.unshift(...values);
  }
}

export default RealmListProxy;
