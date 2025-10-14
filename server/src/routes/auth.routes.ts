import { Router } from "express";
import User from "../models/user.modesl";
import AuthService from "../services/auth.service";
import { CookieOptions } from "express";
import jwt from "jsonwebtoken";

export function createAuthRoutes(): Router {
    const router = Router();
    const authService = new AuthService();

    // Cookie options for secure authentication
    const cookieOptions: CookieOptions = {
        httpOnly: process.env.NODE_ENV === "production",
        expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // 30 days
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
    };


    // Sign out
    router.post("/signout", (req, res) => {
        res.clearCookie("accessToken", { expires: new Date(0) });
        return res.json({
            message: "User signed out successfully",
        });
    });

    // Check authentication status
    router.get("/me", async (req, res) => {
        try {
            const accessToken = req.cookies.accessToken;
            
            if (!accessToken) {
                return res.status(401).json({
                    success: false,
                    message: "Not authenticated",
                });
            }

            // Verify JWT token
            const decoded = jwt.verify(accessToken, process.env.JWT_SECRET || 'your-secret-key') as any;
            
            const user = await User.findById(decoded.userId).exec();
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
                    name: user.name,
                    picture: user.picture,
                },
            });
        } catch (error) {
            console.error("Auth check error:", error);
            return res.status(401).json({
                success: false,
                message: "Invalid token",
            });
        }
    });

    // Google OAuth - Redirect to Google
    router.get("/google", async (req, res) => {
        try {
            const url = authService.getUrl();
            res.redirect(url);
        } catch (error) {
            console.error("Google OAuth redirect error:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to redirect to Google OAuth",
            });
        }
    });

    // Google OAuth - Callback handler
    router.get("/google/callback", async (req, res) => {
        try {
            const { code } = req.query;
            
            if (!code) {
                return res.status(400).json({
                    success: false,
                    message: "Authorization code not provided",
                });
            }

            // Get Google user data from code
            const googleUser = await authService.getGoogleAccountFromCode(code as string);
            
            if (!googleUser) {
                throw new Error("Failed to get user data from Google");
            }

            // Create or update user
            const user = await authService.createGoogleUser(googleUser);
            
            if (!user) {
                throw new Error("Failed to create or update user");
            }

            // Generate JWT access token
            const accessToken = await authService.generateAccessToken(user.email);

            // Set authentication cookie with JWT token
            res.cookie("accessToken", accessToken, cookieOptions);
            
            // Redirect to client dashboard
            const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
            res.redirect(`${clientUrl}/knowledge`);
            
        } catch (error) {
            console.error("Google OAuth callback error:", error);
            const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
            res.redirect(`${clientUrl}/auth?error=oauth_failed`);
        }
    });

    // Get access token for authenticated users
    router.get("/tokens", async (req, res) => {
        try {
            const accessToken = req.cookies.accessToken;
            
            if (!accessToken) {
                return res.status(401).json({
                    success: false,
                    message: "Not authenticated",
                });
            }

            // Verify JWT token
            const decoded = jwt.verify(accessToken, process.env.JWT_SECRET || 'your-secret-key') as any;
            
            const user = await User.findById(decoded.userId).exec();
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: "User not found",
                });
            }

            return res.json({
                success: true,
                data: {
                    accessToken,
                    user: {
                        id: user._id,
                        email: user.email,
                        agentId: user.agentId,
                        name: user.name,
                        picture: user.picture,
                    },
                },
                message: "Access token retrieved",
            });
        } catch (error) {
            console.error("Token retrieval error:", error);
            return res.status(401).json({
                success: false,
                message: "Invalid token",
            });
        }
    });

    return router;
}
