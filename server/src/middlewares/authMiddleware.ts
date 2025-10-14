import { NextFunction, Response } from "express";
import { verify } from "jsonwebtoken";
import { DataStoredInToken, RequestWithInfo } from "../interfaces/auth.interface";
import User from "../models/user.modesl";

export interface AuthRequest extends RequestWithInfo {
    user?: any;
}

const authMiddleware = () => {
    return async (req: RequestWithInfo, res: Response, next: NextFunction) => {
        try {
            // Get access token from cookies
            const accessToken = req.cookies["accessToken"];

            if (accessToken) {
                const verificationResponse = verify(
                    accessToken,
                    process.env.JWT_SECRET || 'your-secret-key'
                ) as unknown as DataStoredInToken;

                const findUser = await User.findById(verificationResponse.userId);

                if (findUser) {
                    req.user = verificationResponse;
                    next();
                } else {
                    return res.status(401).json({
                        success: false,
                        message: "Wrong authentication token",
                    });
                }
            } else {
                return res.status(401).json({
                    success: false,
                    message: "Authentication token missing",
                });
            }
        } catch (error) {
            console.error("Auth middleware error:", error);
            return res.status(401).json({
                success: false,
                message: "Wrong authentication token",
            });
        }
    };
};

export default authMiddleware;