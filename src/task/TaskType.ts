import General from "../utility/General";
import Concept from "../Concept";
import {isNil, map} from 'lodash';
import BaseEntity from "../BaseEntity";

class TaskType extends BaseEntity {
    static schema = {
        name: "TaskType",
        primaryKey: "uuid",
        properties: {
            uuid: "string",
            name: "string",
            type: "string",
            metadataSearchFields: {type: "list", objectType: "Concept"},
            voided: {type: 'bool', default: false},
        },
    };

    static TaskTypeName = {
        Call: 'Call',
        OpenSubject: 'OpenSubject'
    };

    uuid: string;
    name: string;
    type: string;
    metadataSearchFields: Concept[];
    voided: boolean;

    static fromResource(resource, entityService) {
        const taskType = General.assignFields(resource, new TaskType(), ['uuid', 'name', 'type', 'voided']);
        taskType.metadataSearchFields = map(resource.metadataSearchFields,
            name => entityService.findByKey("name", name, Concept.schema.name)
        ).filter(concept => !isNil(concept));
        return taskType;
    }

    clone() {
        const taskType = new TaskType();
        taskType.uuid = this.uuid;
        taskType.name = this.name;
        taskType.type = this.type;
        taskType.metadataSearchFields = this.metadataSearchFields;
        taskType.voided = this.voided;
        return taskType;
    }

}


export default TaskType;
