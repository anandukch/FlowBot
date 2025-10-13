import { NextFunction, Request, Response } from "express";
import userModel, { IUser } from "../models/user.modesl";


export interface AuthRequest extends Request {
    user: IUser;
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    console.log("Auth middleware called", req.cookies);
    const agentId = req.cookies?.agentId;

    if (!agentId) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await userModel.findOne({ agentId }).exec();
    if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    (req as AuthRequest).user = user;
    next();
};