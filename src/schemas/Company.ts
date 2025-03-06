import mongoose, { Schema, Document } from "mongoose";

export interface UserCompanyInterface extends Document {
    type: "customer" | "vendor";
    company_ids?: Schema.Types.ObjectId[];
    company_details?: {
        name: string;
        address: [
            {
                street: string;
                city: string;
                state: string;
                pincode: string;
                country: string;
            }
        ],
        billingAddress: [
            {
                street: string;
                city: string;
                state: string;
                pincode: string;
                country: string;
            }
        ],
        phone: string;
        email: string;
        gstin?: string;
        pan: string;
        primaryContact: {
            name: string;
            phone: string;
        },
        secondaryContact: {
            name: string;
            phone: string;
        },
        website: string;
        industryType: string;
        businessType: string;
        registrationDate: Date;
        bankDetails: {
            accountHolderName: string;
            accountNumber: string;
            bankName: string;
            branchName: string;
            ifscCode: string;
        },
        taxDetails: {
            tdsRate: number;
            taxSlab: string;
        },
        currency: string;
        gstCertificate: string;
        incorporationCertificate: string;
        otherDocuments: {
            documentName: string;
            documentUrl: string;
        }[],
        status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
        tags: string[];
        socialMedia: {
            facebook: string;
            instagram: string;
            linkedin: string;
            twitter: string;
        }
    };
    deletedAt?: Date,
    createdAt?: Date,
    updatedAt?: Date
}

const UserCompanySchema: Schema<UserCompanyInterface> = new Schema<UserCompanyInterface>(
    {
        type: {
            type: String,
            enum: ["customer", "vendor"],
            default: "customer",
        },
        company_ids: [
            {
                type: Schema.Types.ObjectId,
                ref: "Company"
            }
        ],
        company_details: {
            name: { type: String, trim: true },
            address: [
                {
                    street: { type: String, trim: true },
                    city: { type: String, trim: true },
                    state: { type: String, trim: true },
                    pincode: { type: String, trim: true },
                    country: { type: String, trim: true, default: "India" }
                }
            ],
            billingAddress: [
                {
                    street: { type: String, trim: true },
                    city: { type: String, trim: true },
                    state: { type: String, trim: true },
                    pincode: { type: String, trim: true },
                    country: { type: String, trim: true, default: "India" }
                }
            ],
            phone: { type: String, trim: true },
            email: { type: String, trim: true },
            gstin: { type: String, trim: true },
            pan: { type: String, trim: true },
            primaryContact: {
                name: { type: String, trim: true },
                phone: { type: String, trim: true }
            },
            secondaryContact: {
                name: { type: String, trim: true },
                phone: { type: String, trim: true }
            },
            website: { type: String, trim: true },
            industryType: { type: String, trim: true },
            businessType: { type: String, trim: true },
            registrationDate: { type: Date },
            bankDetails: {
                accountHolderName: { type: String, trim: true },
                accountNumber: { type: String, trim: true },
                bankName: { type: String, trim: true },
                branchName: { type: String, trim: true },
                ifscCode: { type: String, trim: true }
            },
            taxDetails: {
                tdsRate: { type: Number, default: 0 },
                taxSlab: { type: String, trim: true }
            },
            currency: { type: String, trim: true, default: "INR" },
            gstCertificate: { type: String, trim: true },
            incorporationCertificate: { type: String, trim: true },
            otherDocuments: [
                {
                    documentName: { type: String, trim: true },
                    documentUrl: { type: String, trim: true }
                }
            ],
            status: {
                type: String,
                enum: ["active", "inactive", "suspended"],
                default: "active"
            },
            tags: [{ type: String, trim: true }],
            socialMedia: {
                facebook: { type: String, trim: true },
                instagram: { type: String, trim: true },
                linkedin: { type: String, trim: true },
                twitter: { type: String, trim: true }
            }
        },
        deletedAt: {
            type: Date
        },
        createdAt: {
            type: Date,
            default: new Date()
        },
        updatedAt: {
            type: Date
        }
    }
);

const Company = mongoose.model<UserCompanyInterface>("Company", UserCompanySchema);

export default Company;
