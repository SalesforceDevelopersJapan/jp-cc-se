import { LightningRestContext } from '../interface/rest-context';
import CustomFetchWithAuth from '../rest/fetch-with-auth';
import UserAuth from './auth/user-auth';

export default class LightningRESTService {
    public client: CustomFetchWithAuth;
    public context: LightningRestContext;

    constructor(aliasOrUsename: string, apiVersion: string = 'v57.0') {
        const sfUser = UserAuth.getSFUser(aliasOrUsename);
        sfUser.apiVersion = apiVersion;
        this.context = {
            sfUser,
            oauth: {
                accessToken: sfUser.accessToken,
            },
        };
        this.client = new CustomFetchWithAuth(this.context);
    }
}
