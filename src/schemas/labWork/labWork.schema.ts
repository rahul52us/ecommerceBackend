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
        unit: String,
        amount: { type: Number, default: 0 },
        technicianName: {
          type: String,
          lowercase: true,
          trim: true,
        },
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

// Middleware to calculate delay based on work type and dates
labWorkSchema.pre("save", function (next) {
  if (this.workType === "in-house" && this.receivedDate && this.dueDate) {
    const r = this.receivedDate.getTime();
    const d = this.dueDate.getTime();
    const diffTime = r - d;
    this.delay = Math.round(diffTime / (1000 * 60 * 60 * 24));
  } else if (this.workType === "outside" && this.sendDate && this.dueDate) {
    const s = this.sendDate.getTime();
    const d = this.dueDate.getTime();
    const diffTime = s - d;
    this.delay = Math.round(diffTime / (1000 * 60 * 60 * 24));
  }
  next();
});

export default mongoose.model("LabWork", labWorkSchema);
