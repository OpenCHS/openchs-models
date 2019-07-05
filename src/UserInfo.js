import _ from "lodash";

class UserInfo {
    static UUID = 'ce9ad8ee-193e-49ee-8626-49802c8b4bd7';
    static DEFAULT_SETTINGS = '{"trackLocation": false, "locale": "en"}';

    static schema = {
        name: "UserInfo",
        primaryKey: 'uuid',
        properties: {
            uuid: 'string',
            username: 'string',
            organisationName: "string",
            settings: "string"
        }
    };

    static fromResource(resource) {
        let userInfo = new UserInfo();
        userInfo.username = resource.username;
        userInfo.uuid = UserInfo.UUID;
        userInfo.organisationName = resource.organisationName;
        userInfo.settings = _.isNil(resource.settings)
            ? UserInfo.DEFAULT_SETTINGS
            : JSON.stringify(resource.settings);
        return userInfo;
    }

    setSettings(settingsObject) {
        this.settings = JSON.stringify(settingsObject);
    }

    getSettings() {
        return JSON.parse(this.settings);
    }

    get toResource() {
        const resource = _.pick(this, ["uuid"]);
        resource.settings = this.getSettings();
        return resource;
    }

    clone() {
        let userInfo = new UserInfo();
        userInfo.username = this.username;
        userInfo.uuid = this.uuid;
        userInfo.organisationName = this.organisationName;
        userInfo.settings = this.settings;
        return userInfo;
    }

    static createEmptyInstance() {
        const userInfo = new UserInfo();
        userInfo.settings = UserInfo.DEFAULT_SETTINGS;
        return userInfo;
    }

}

export default UserInfo;
