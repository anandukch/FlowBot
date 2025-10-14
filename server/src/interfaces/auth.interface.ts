import { Request } from "express";

export interface DataStoredInToken {
    userId: string;
    email: string;
    agentId: string;
    login: boolean;
}

export interface RequestWithInfo extends Request {
    user?: DataStoredInToken;
}
