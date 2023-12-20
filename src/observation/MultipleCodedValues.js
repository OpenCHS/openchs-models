import _ from "lodash";
import ah from "../framework/ArrayHelper";
import Observation from "../Observation";

class MultipleCodedValues {
  constructor(answer, answerSource = Observation.AnswerSource.Manual) {
    this.answer = _.isNil(answer) ? [] : answer;
    this.answerSource = answerSource;
  }

  push(answerUUID) {
    this.answer.push(answerUUID);
    return this;
  }

  isAnswerAlreadyPresent(conceptUUID) {
    return _.some(this.answer, (item) => item === conceptUUID);
  }

  hasValue(conceptUUID) {
    return this.isAnswerAlreadyPresent(conceptUUID);
  }

  removeAnswer(conceptUUID) {
    ah.remove(this.answer, (item) => item === conceptUUID);
  }

  toggleAnswer(answerUUID) {
    if (this.isAnswerAlreadyPresent(answerUUID)) {
      this.removeAnswer(answerUUID);
    } else {
      this.push(answerUUID);
    }
  }

  hasAnyAbnormalAnswer(abnormalAnswerUUIDs) {
    return _.some(this.answer, (item) => {
      return _.some(abnormalAnswerUUIDs, _.matches(item));
    });
  }

  getValue() {
    return this.answer;
  }

  get toResource() {
    return this.getValue();
  }

  cloneForEdit() {
    const multipleCodedValues = new MultipleCodedValues();
    multipleCodedValues.answer = this.answer;
    multipleCodedValues.answerSource = this.answerSource;
    return multipleCodedValues;
  }

  get isSingleCoded() {
    return false;
  }

  get isMultipleCoded() {
    return true;
  }

  valueAsString(conceptService, I18n) {
    return _.join(
      this.getValue().map((value) => {
        return I18n.t(conceptService.getConceptByUUID(value).name);
      }),
      ", "
    );
  }

  get numberOfAnswers() {
    return this.answer.length;
  }
}

export default MultipleCodedValues;
