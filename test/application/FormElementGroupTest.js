import {assert} from "chai";
import EntityFactory from "../EntityFactory";
import Concept from '../../src/Concept';
import FormElement from "openchs-models/src/application/FormElement";
import FormElementStatus from "../../src/application/FormElementStatus";
import FormElementGroup from "../../src/application/FormElementGroup";
import ObservationsHolder from "../../src/ObservationsHolder";
import _ from 'lodash';

describe('FormElementGroupTest', () => {
    it('previous and next', () => {
        const form = EntityFactory.createForm('form1');
        const first = EntityFactory.createFormElementGroup('foo', 1, form);
        const second = EntityFactory.createFormElementGroup('bar', 2, form);
        const third = EntityFactory.createFormElementGroup('baz', 3, form);

        assert.notEqual(first.next(), undefined);
        assert.notEqual(second.next(), undefined);
        assert.equal(third.next(), undefined);

        assert.equal(first.previous(), undefined);
        assert.notEqual(third.previous(), undefined);
        assert.notEqual(second.previous(), undefined);

        assert.equal(first.isFirst, true);
        assert.equal(second.isFirst, false);
    });

    it('getFormElements', () => {
        const form = EntityFactory.createForm('form1');
        const formElementGroup = EntityFactory.createFormElementGroup('foo', 1, form);
        formElementGroup.addFormElement(EntityFactory.createFormElement("bar", false, EntityFactory.createConcept("bar", Concept.dataType.Text), 2));
        formElementGroup.addFormElement(EntityFactory.createFormElement("baz", false, EntityFactory.createConcept("bar", Concept.dataType.Text), 1));
        assert.equal(formElementGroup.getFormElements().length, 2);
    });

    it('filterElements', () => {
        let formElements = [createFormElement('ABCD'), createFormElement('EFGH'), createFormElement('IJKL')];
        let formElementStatuses = [new FormElementStatus('ABCD', true, 1), new FormElementStatus('EFGH', false, 1), new FormElementStatus('IJKL', true, 1)];
        let formElementGroup = new FormElementGroup();
        formElementGroup.formElements = formElements;
        let filteredElements = formElementGroup.filterElements(formElementStatuses);
        assert.equal(filteredElements.length, 2);
    });

    it('filterElementAnswers', () => {
        let formElements = [createFormElement('ABCD', ["Answer 1", "Answer 2"]), createFormElement('EFGH'), createFormElement('IJKL', ["Answer 3", "Answer 4"])];
        let formElementStatuses = [new FormElementStatus('ABCD', true, 1, ["Answer 1"]), new FormElementStatus('EFGH', false, 1), new FormElementStatus('IJKL', true, 1, ["Answer 3", "Answer 4"])];
        let formElementGroup = new FormElementGroup();
        formElementGroup.formElements = formElements;
        let filteredElements = formElementGroup.filterElements(formElementStatuses);
        assert.equal(filteredElements[0].answersToExclude.length, 1);
        assert.equal(filteredElements[1].answersToExclude.length, 2);
    });

    it('returnFalseIfAllFormElementsAreNotEmpty', () => {
        let observations, concepts, allFormElements;
        concepts = [EntityFactory.createConcept("Concept 1", Concept.dataType.Coded, "concept-1"),
          EntityFactory.createConcept("Concept 2", Concept.dataType.Coded, "concept-2")];
        observations = [EntityFactory.createObservation(concepts[0], "Yao")];
        const observationsHolder = new ObservationsHolder(observations);
        allFormElements = [
          EntityFactory.createFormElement("Form Element 1", true, concepts[0], 1, "SingleSelect"),
          EntityFactory.createFormElement("Form Element 2", true, concepts[1], 2, "SingleSelect")
        ];
        const form = EntityFactory.createForm('form1');
        const formElementGroup = EntityFactory.createFormElementGroup('foo', 1, form);
        formElementGroup.addFormElement(allFormElements[0]);
        formElementGroup.addFormElement(allFormElements[1]);

        const isEmpty = formElementGroup.areAllFormElementsEmpty(allFormElements, observationsHolder);

        assert.isFalse(isEmpty);
    });

    it('returnTrueIfAllFormElementsAreEmpty', () => {
        let observations, concepts, allFormElements;
        concepts = [EntityFactory.createConcept("Concept 1", Concept.dataType.Coded, "concept-1"),
          EntityFactory.createConcept("Concept 2", Concept.dataType.Coded, "concept-2")];
        observations = [];
        const observationsHolder = new ObservationsHolder(observations);
        allFormElements = [
          EntityFactory.createFormElement("Form Element 1", true, concepts[0], 1, "SingleSelect"),
          EntityFactory.createFormElement("Form Element 2", true, concepts[1], 2, "SingleSelect")
        ];
        const form = EntityFactory.createForm('form1');
        const formElementGroup = EntityFactory.createFormElementGroup('foo', 1, form);
        formElementGroup.addFormElement(allFormElements[0]);
        formElementGroup.addFormElement(allFormElements[1]);

        const isEmpty = formElementGroup.areAllFormElementsEmpty(allFormElements, observationsHolder);

        assert.isTrue(isEmpty);
    });

    it('findNonVoidedFormElements', () => {
        let formElements = _.range(10000).map(idx => createFormElement('ABC'+idx, [],
          idx % 10===0, idx % 5 === 0 && idx - 5 > 0 ? idx - 5 : null ));
        let formElementGroup = new FormElementGroup();
        formElementGroup.formElements = formElements;
        let startTime = performance.now()
        let nonVoidedFormElements = formElementGroup.nonVoidedFormElements();
        let endTime = performance.now()
        assert.equal(nonVoidedFormElements.length, 9000);
        assert.isTrue(endTime - startTime < 200, 'Test should have completed within 200 milliseconds');
    });

  function createFormElement(uuid, answers = [], isVoided = false, parentGroupUuid = null) {
        let x = new FormElement();
        x.uuid = uuid;
        x.getRawAnswers = function () {
            return answers;
        }
        x.voided = isVoided;
        x.groupUuid = parentGroupUuid;
        return x;
    }
});
