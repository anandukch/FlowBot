import { OAuth2Client, TokenPayload } from "google-auth-library";
import User from "../models/user.modesl";
import { v4 as uuidv4 } from "uuid";
import jwt, { SignOptions } from "jsonwebtoken";

export default class AuthService {
    private oauth2Client: OAuth2Client;

    constructor() {
        this.oauth2Client = new OAuth2Client(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI
        );
    }

    /**
     * Generate Google OAuth URL for authentication
     * @returns Google OAuth URL
     */
    public getUrl = (): string => {
        const url = this.oauth2Client.generateAuthUrl({
            access_type: "offline",
            scope: ["profile", "email"],
            prompt: "consent"
        });
        return url;
    };

    /**
     * Get Google user data from authorization code
     * @param code Authorization code from Google
     * @returns Google user payload
     */
    public getGoogleAccountFromCode = async (code: string): Promise<TokenPayload | undefined> => {
        try {
            const { tokens } = await this.oauth2Client.getToken(code);
            
            this.oauth2Client.setCredentials(tokens);
            
            if (!tokens.id_token) {
                throw new Error("No ID token found");
            }
            
            const googleUser = await this.oauth2Client.verifyIdToken({
                idToken: tokens.id_token,
                audience: process.env.GOOGLE_CLIENT_ID,
            });

            return googleUser.getPayload();
        } catch (error) {
            console.error("Error getting Google account from code:", error);
            throw new Error("Failed to authenticate with Google");
        }
    };

    /**
     * Create or update user with Google OAuth data
     * @param userPayload Google user payload
     * @returns User document
     */
    public createGoogleUser = async (userPayload?: TokenPayload) => {
        if (!userPayload || !userPayload.email) {
            throw new Error("Invalid user payload");
        }

        try {
            // Check if user exists
            let user = await User.findOne({ email: userPayload.email }).exec();
            
            if (!user) {
                // Create new user with Google data
                const agentId = uuidv4();
                user = new User({
                    email: userPayload.email,
                    password: null, // No password for OAuth users
                    agentId,
                    googleId: userPayload.sub,
                    name: userPayload.name,
                    picture: userPayload.picture,
                });
                await user.save();
                console.log(`Created new Google user: ${userPayload.email}`);
            } else if (!user.googleId) {
                // Link existing user with Google account
                user.googleId = userPayload.sub;
                user.name = userPayload.name;
                user.picture = userPayload.picture;
                await user.save();
                console.log(`Linked existing user with Google: ${userPayload.email}`);
            }

            return user;
        } catch (error) {
            console.error("Error creating/updating Google user:", error);
            throw new Error("Failed to create or update user");
        }
    };

    /**
     * Generate JWT access token for authenticated user
     * @param email User email
     * @returns JWT access token
     */
    public generateAccessToken = async (email: string): Promise<string> => {
        try {
            const user = await User.findOne({ email }).exec();
            if (!user) {
                throw new Error("User not found");
            }

            // JWT payload
            const payload = {
                userId: (user._id as string).toString(),
                email: user.email,
                agentId: user.agentId,
                login: true
            };

            // Generate JWT access token
            const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
            const options: SignOptions = {
                expiresIn: '24h',
                issuer: 'lyzr-agent'
            };
            
            const accessToken = jwt.sign(payload, jwtSecret, options);

            return accessToken;
        } catch (error) {
            console.error("Error generating access token:", error);
            throw new Error("Failed to generate access token");
        }
    };

    /**
     * Find user by email
     * @param email User email
     * @returns User document or null
     */
    public getUserByEmail = async (email: string) => {
        try {
            return await User.findOne({ email }).exec();
        } catch (error) {
            console.error("Error finding user by email:", error);
            throw new Error("Failed to find user");
        }
    };

    /**
     * Find user by agent ID
     * @param agentId User agent ID
     * @returns User document or null
     */
    public getUserByAgentId = async (agentId: string) => {
        try {
            return await User.findOne({ agentId }).exec();
        } catch (error) {
            console.error("Error finding user by agent ID:", error);
            throw new Error("Failed to find user");
        }
    };
}
