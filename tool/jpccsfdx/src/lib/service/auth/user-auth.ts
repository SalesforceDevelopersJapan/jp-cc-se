import Shell from '../../sfdx/shell';

export interface User {
    id: string;
    organizationId: string;
    username: string;
    instanceUrl: string;
    accessToken: string;
}

export default class UserAuth {
    static getUser(aliasOrUsename:string): User {
        const data = Shell.runAsJson(`sfdx org:display:user -o ${aliasOrUsename}`);
        return {
            id: data.result.id,
            organizationId: data.result.orgId,
            username: data.result.username,
            instanceUrl: data.result.instanceUrl,
            accessToken: data.result.accessToken,
        };
    }
}
