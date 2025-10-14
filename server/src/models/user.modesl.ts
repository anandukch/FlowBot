import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
    email: string;
    password?: string;
    agentId: string;
    googleId?: string;
    name?: string;
    picture?: string;
    kb?: string;
    config?: any;
    widgetConfig?: any;
}
const UserSchema: Schema = new Schema(
    {
        email: { type: String, required: true, unique: true },
        password: { type: String },
        agentId: { type: String },
        googleId: { type: String },
        name: { type: String },
        picture: { type: String },
        kb: { type: String },
        config: {
            type: Schema.Types.Mixed,
            default: {},
        },
        widgetConfig: {
            type: Schema.Types.Mixed,
            default: {},
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
