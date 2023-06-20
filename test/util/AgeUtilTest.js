import {assert} from "chai";
import _ from "lodash";
import AgeUtil from "../../src/utility/AgeUtil";

describe('AgeUtilTest', () => {
  beforeEach(() => {
    Date.now = jest.fn(() => new Date("2023-06-13T12:33:37.000Z"));
  });

  it('should display age in years and months when age is between 2 and 6 years', () => {
    const i18n = {t: _.identity};
    const dateOfBirth = '2021-04-15';
    assert.equal(AgeUtil.getDisplayAge(dateOfBirth, i18n), "2 years 1 month");
  });

  it('should display age in years when age is exactly say 3 years', () => {
    const i18n = {t: _.identity};
    const dateOfBirth = '2020-06-13';
    assert.equal(AgeUtil.getDisplayAge(dateOfBirth, i18n), "3 years");
  });

  it('should display age in months when age is less than 2 years', () => {
    const i18n = {t: _.identity};
    const dateOfBirth = '2021-07-10';
    assert.equal(AgeUtil.getDisplayAge(dateOfBirth, i18n), "23 months");
  });

  it('should display age in years when age is more than 6 years', () => {
    const i18n = {t: _.identity};
    const dateOfBirth = '2015-07-10';
    assert.equal(AgeUtil.getDisplayAge(dateOfBirth, i18n), "7 years");
  });
});
