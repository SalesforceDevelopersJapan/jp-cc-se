import { User } from "../service/auth/user-auth";

export interface RestContext {
    user: User;
    apiVersion: string;
}
