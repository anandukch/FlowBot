import { Router } from "express";
import User from "../models/user.modesl";
import { v4 as uuidv4 } from "uuid";
import { authMiddleware, AuthRequest } from "../middlewares/authMiddleware";

export function createRoutes(): Router {
    const router = Router();

    router.post("/signin", async (req, res) => {
        const { email, password } = req.body;
        const user = await User.findOne({ email }).exec();
        if (!user) {
            return res.json({
                success: false,
                message: "User not found",
            });
        }
        if (user.password !== password) {
            return res.json({
                success: false,
                message: "Invalid password",
            });
        }
        res.cookie("agentId", user.agentId, {
            httpOnly: true,
            sameSite: "strict",
            maxAge: 24 * 60 * 60 * 1000,
        });
        return res.json({
            success: true,
            message: "User signed in successfully",
            user,
        });
    });

    router.post("/signup", async (req, res) => {
        const { email, password } = req.body;
        const user = await User.findOne({ email }).exec();
        if (user) {
            res.json({
                success: false,
                message: "User already exists",
            });
        } else {
            const agentId = uuidv4();
            const user = new User({ email, password, agentId });
            await user.save();
            res.cookie("agentId", agentId, {
                httpOnly: true,
                sameSite: "strict",
                maxAge: 24 * 60 * 60 * 1000,
            });
            res.json({
                success: true,
                message: "User signed up successfully",
                user,
            });
        }
    });

    router.get("/slack-config", authMiddleware, async (req, res) => {
        const user = (req as AuthRequest).user;
        res.json({ success: true, user });
    });

    router.post("/slack-config", authMiddleware, async (req, res) => {
        const user = (req as AuthRequest).user;
        const { slackBotToken, slackBotId, slackChannel } = req.body;
        user.config = { slackBotToken, slackBotId, slackChannel };
        await user.save();
        res.json({ success: true, message: "Slack configuration saved" });
    });

    router.get("/kb", authMiddleware, async (req, res) => {
        const user = (req as AuthRequest).user;
        res.json({ success: true, kb: user.kb });
    });

    router.post("/add-kb", authMiddleware, async (req, res) => {
        const user = (req as AuthRequest).user;
        const { kb } = req.body;
        user.kb = kb;
        await user.save();
        res.json({
            success: true,
            message: "KB added successfully",
            user,
        });
    });

    return router;
}
