export interface SFUser {
    id: string;
    organizationId: string;
    username: string;
    instanceUrl: string;
    accessToken: string;
    apiVersion?: string;
}

export interface CommerceClient {
    clientId: string;
    clientSecret: string;
    tenantId: string;
    scope: string;
    ociUrl?: string;
    amAuthUrl: string;
    apiVersion?: string;
    accessToken?: string;
    omniTenantGroupId?: string;
}

export interface OAuth {
    accessToken: string;
}

export interface BasicAuth {
    id: string;
    password: string;
}

export interface RestContext {
    oauth?: OAuth;
    basicAuth?: BasicAuth;
}

export interface LightningRestContext extends RestContext {
    sfUser?: SFUser;
}

export interface CommerceRestContext extends RestContext {
    commerceClient?: CommerceClient;
}
