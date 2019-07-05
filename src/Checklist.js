import _ from "lodash";
import ResourceUtil from "./utility/ResourceUtil";
import General from "./utility/General";
import ProgramEnrolment from './ProgramEnrolment';
import BaseEntity from "./BaseEntity";
import ChecklistItem from "./ChecklistItem";
import ChecklistDetail from "./ChecklistDetail";

class Checklist extends BaseEntity {
    static schema = {
        name: 'Checklist',
        primaryKey: 'uuid',
        properties: {
            uuid: 'string',
            detail: 'ChecklistDetail',
            baseDate: 'date',
            items: {type: 'list', objectType: 'ChecklistItem'},
            programEnrolment: 'ProgramEnrolment'
        }
    };

    static create() {
        const checklist = new Checklist();
        checklist.uuid = General.randomUUID();
        checklist.items = [];
        return checklist;
    }

    static fromResource(checklistResource, entityService) {
        const programEnrolment = entityService.findByKey("uuid", ResourceUtil.getUUIDFor(checklistResource, "programEnrolmentUUID"), ProgramEnrolment.schema.name);
        const checklist = General.assignFields(checklistResource, new Checklist(), ["uuid"], ["baseDate"]);
        const checklistDetail = entityService.findByKey("uuid", ResourceUtil.getUUIDFor(checklistResource, "checklistDetailUUID"), ChecklistDetail.schema.name);
        checklist.programEnrolment = programEnrolment;
        checklist.detail = checklistDetail;
        return checklist;
    }

    get toResource() {
        const resource = _.pick(this, ["uuid"]);
        resource["baseDate"] = General.isoFormat(this.baseDate);
        resource["programEnrolmentUUID"] = this.programEnrolment.uuid;
        resource["checklistDetailUUID"] = this.detail.uuid;
        return resource;
    }

    static merge = () => BaseEntity.mergeOn('items');

    static associateChild(child, childEntityClass, childResource, entityService) {
        var checklist = entityService.findByKey("uuid", ResourceUtil.getUUIDFor(childResource, "checklistUUID"), Checklist.schema.name);
        checklist = General.pick(checklist, ["uuid"], ["items"]);

        if (childEntityClass === ChecklistItem)
            BaseEntity.addNewChild(child, checklist.items);
        else
            throw `${childEntityClass.name} not support by ${Checklist.name}`;

        return checklist;
    }

    clone() {
        const checklist = new Checklist();
        checklist.uuid = this.uuid;
        checklist.programEnrolment = this.programEnrolment;
        checklist.baseDate = this.baseDate;
        checklist.detail = this.detail;
        checklist.items = _.map(this.items, item => item.clone());
        return checklist;
    }

    setCompletionDate(checklistItemName, value) {
        const checklistItem = this.getChecklistItem(checklistItemName);
        checklistItem.completionDate = value;
    }

    addItem(item) {
        this.items.push(item);
    }

    print() {
        return `Checklist{
        uuid=${this.uuid},
        detail=${this.detail.print()},
        baseDate=${General.isoFormat(this.baseDate)},
        items=[${_.map(this.items, i=>i.print())}],
        programEnrolment=${this.programEnrolment.print()}
        }`;
    }
}

export default Checklist;
