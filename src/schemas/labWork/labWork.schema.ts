import mongoose from "mongoose";

const labWorkSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    patientNameManual: String,
    primaryDoctor: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "primaryDoctorModel",
      required: false,
    },
    primaryDoctorModel: {
      type: String,
      required: true,
      enum: ["User", "LabDoctor"],
      default: "User",
    },
    doctorNameManual: String,
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    workType: {
      type: String,
      enum: ["in-house", "outside", "external"],
      required: true,
      default: "outside",
    },

    // Array to support selecting more than one work for one patient
    selectedWorks: [
      {
        selections: [String], // Flexible array to store nested dropdown values
        customNotes: String,  // General notes for this item
        shadeSystem: String,
        shadeValue: String,
        teethNumbers: [String], // Array of strings (e.g. ["11", "12"])
        arch: String,
        amount: { type: Number, default: 0 },
      }
    ],
    labInstructions: {
      type: String,
      trim: true,
    },
    lab: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lab",
      // Required only if workType is outside
    },
    labNameManual: String, // Fallback if lab is in-house or just text
    sendDate: {
      type: Date,
    },
    dueDate: {
      type: Date,
    },
    receivedDate: {
      type: Date,
    },
    status: {
      type: String,
      default: "plan",
    },
    statusHistory: [
      {
        status: String,
        date: {
          type: Date,
          default: Date.now,
        },
        note: String,
        updatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      }
    ],
    statusDate: {
      type: Date,
      default: Date.now,
    },
    warrantyCardNumber: {
      type: String,
      trim: true,
    },
    warrantyYears: {
      type: Number,
    },
    price: {
      type: Number,
      default: 0,
    },
    delay: {
      type: Number, // Difference in days between dueDate and receivedDate
    },
    itemsReceived: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    itemsSent: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    returnableItems: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Middleware to calculate delay if both dates are present
labWorkSchema.pre("save", function (next) {
  if (this.sendDate && this.receivedDate) {
    const s = this.sendDate.getTime();
    const r = this.receivedDate.getTime();
    const diffTime = r - s;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    this.delay = diffDays;
  }
  next();
});

export default mongoose.model("LabWork", labWorkSchema);
