import { Router } from "express";
import User from "../models/user.modesl";
import { v4 as uuidv4 } from "uuid";

export function createAuthRoutes(): Router {
    const router = Router();

    // User sign in
    router.post("/signin", async (req, res) => {
        try {
            const { email, password } = req.body;
            console.log("Sign in request:", req.body);
            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    message: "Email and password are required",
                });
            }

            const user = await User.findOne({ email }).exec();
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: "User not found",
                });
            }
            
            if (user.password !== password) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid password",
                });
            }
            
            res.cookie("agentId", user.agentId, {
                httpOnly: false,
                sameSite: "lax",
                maxAge: 24 * 60 * 60 * 1000, // 24 hours
            });
            
            return res.json({
                success: true,
                message: "User signed in successfully",
                user: {
                    id: user._id,
                    email: user.email,
                    agentId: user.agentId,
                },
            });
        } catch (error) {
            console.error("Sign in error:", error);
            return res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    });

    // User sign up
    router.post("/signup", async (req, res) => {
        try {
            const { email, password } = req.body;
            console.log("Sign up request:", req.body);
            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    message: "Email and password are required",
                });
            }

            const existingUser = await User.findOne({ email }).exec();
            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    message: "User already exists",
                });
            }

            const agentId = uuidv4();
            const user = new User({ email, password, agentId });
            await user.save();
            
            res.cookie("agentId", agentId, {
                httpOnly: true,
                sameSite: "strict",
                maxAge: 24 * 60 * 60 * 1000, // 24 hours
            });
            
            return res.json({
                success: true,
                message: "User signed up successfully",
                user: {
                    id: user._id,
                    email: user.email,
                    agentId: user.agentId,
                },
            });
        } catch (error) {
            console.error("Sign up error:", error);
            return res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    });

    // Sign out
    router.post("/signout", (req, res) => {
        res.clearCookie("agentId");
        return res.json({
            success: true,
            message: "User signed out successfully",
        });
    });

    // Check authentication status
    router.get("/me", async (req, res) => {
        try {
            const agentId = req.cookies.agentId;
            
            if (!agentId) {
                return res.status(401).json({
                    success: false,
                    message: "Not authenticated",
                });
            }

            const user = await User.findOne({ agentId }).exec();
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: "User not found",
                });
            }

            return res.json({
                success: true,
                user: {
                    id: user._id,
                    email: user.email,
                    agentId: user.agentId,
                },
            });
        } catch (error) {
            console.error("Auth check error:", error);
            return res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    });

    return router;
}
