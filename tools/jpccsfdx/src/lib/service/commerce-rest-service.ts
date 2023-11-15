import { CommerceClient, CommerceRestContext } from '../interface/rest-context';
import CustomFetchWithAuth from '../rest/fetch-with-auth';

export default class CommerceRESTService {
    public client: CustomFetchWithAuth;
    public context: CommerceRestContext;

    constructor(commerceClient: CommerceClient) {
        this.context = {
            commerceClient,
            oauth: {
                accessToken: commerceClient.accessToken!,
            },
        };
        this.client = new CustomFetchWithAuth(this.context);
    }
}
