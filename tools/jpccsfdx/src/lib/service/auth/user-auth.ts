import { CommerceClient, CommerceRestContext, SFUser } from '../../interface/rest-context';
import CustomFetchWithBasicAuth from '../../rest/fetch-with-basic-auth';
import Shell from '../../sfdx/shell';

export default class UserAuth {
    static getSFUser(aliasOrUsename: string): SFUser {
        console.log('Getting user info.....');
        const data = Shell.runAsJson(`sfdx org:display:user -o ${aliasOrUsename}`);
        return {
            id: data.result.id,
            organizationId: data.result.orgId,
            username: data.result.username,
            instanceUrl: data.result.instanceUrl,
            accessToken: data.result.accessToken,
        };
    }

    static async getCommerceToken({
        clientId,
        clientSecret,
        tenantId,
        scope,
        apiVersion = 'v1',
        amAuthUrl = 'https://account.demandware.com/dwsso/oauth2/access_token',
        omniTenantGroupId,
        ociUrl,
    }: {
        clientId: string;
        clientSecret: string;
        tenantId: string;
        scope: string;
        apiVersion?: string;
        amAuthUrl?: string;
        omniTenantGroupId?: string;
        ociUrl?: string;
    }): Promise<CommerceClient> {
        console.log('Getting user info.....');
        const context: CommerceRestContext = {
            basicAuth: {
                id: clientId,
                password: clientSecret,
            },
        };
        const client = new CustomFetchWithBasicAuth(context);
        const url = new URL(amAuthUrl);
        const params = new URLSearchParams();
        params.append('grant_type', 'client_credentials');
        params.append('scope', `SALESFORCE_COMMERCE_API:${tenantId} ${scope}`);
        const data = await client.postForm(url, params);
        return {
            clientId,
            clientSecret,
            tenantId,
            scope,
            omniTenantGroupId,
            amAuthUrl,
            accessToken: data['access_token'],
            ociUrl,
            apiVersion,
        };
    }
}
