import mongoose, { Schema, Document } from "mongoose";

export interface otpVerificationInterface extends Document {
    userId: Schema.Types.ObjectId;
    phone: string;
    otp: string;
    used?: boolean;
    createdAt?: Date
}

const otpVerificationSchema: Schema<otpVerificationInterface> = new Schema<otpVerificationInterface>({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    phone: {
        type: String,
        required: true,
    },
    otp: {
        type: String,
        required: true
    },
    used: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
})

const otpModel = mongoose.model<otpVerificationInterface>("otp", otpVerificationSchema);

export default otpModel;