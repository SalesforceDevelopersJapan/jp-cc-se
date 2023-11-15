import { Flags } from '@oclif/core';

export const COMMON_FLAGS = {};

export const LIGHTNING_COMMON_FLAGS = {
    org: Flags.string({ char: 'o', description: 'lightning platform username or alias of org', required: true }),
};

export const COMMERCE_COMMON_FLAGS = {
    clientId: Flags.string({ char: 'i', description: 'Account Manager Client Id', required: true }),
    clientSecret: Flags.string({ char: 's', description: 'Account Manager Client Secret', required: true }),
    tenantId: Flags.string({ char: 't', description: 'B2C Commerce Tenant Id', required: true }),
};
