import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
    email: string;
    password?: string;
    agentId: string;
    kb: string;
    config: {
        slackBotToken?: string;
        slackBotId?: string;
        slackChannel?: string;
    };
}

const UserSchema: Schema = new Schema(
    {
        email: { type: String, required: true, unique: true },
        password: { type: String },
        agentId: { type: String },
        kb: {
            type: String,
            required: false,
        },
        config: {
            slackBotToken: { type: String },
            slackBotId: { type: String },
            slackChannel: { type: String },
        },
    },
    { timestamps: true }
);
UserSchema.set("toJSON", {
    transform: function (doc, ret) {
        delete ret.password;
        return ret;
    },
});

const userModel = mongoose.model<IUser>("User", UserSchema);
export default userModel;
