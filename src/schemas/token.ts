import mongoose, { Schema, Document } from "mongoose";

export interface tokenVerificationInterface extends Document {
    userId: Schema.Types.ObjectId;
    otp: string;
    token: string;
    type:string;
    isActive?: boolean;
    createdAt?: Date;
    updatedAt?:Date
}

const tokenVerificationSchema: Schema<tokenVerificationInterface> = new Schema<tokenVerificationInterface>({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    otp: {
        type: String,
        required: true,
    },
    type : {
        type : String
    },
    token: {
        type: String,
        required: true
    },
    isActive: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt:{
        type : Date
    }
})

const tokenModel = mongoose.model<tokenVerificationInterface>("token", tokenVerificationSchema);

export default tokenModel;