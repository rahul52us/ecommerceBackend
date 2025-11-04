import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    // 👩‍⚕️ Primary doctor
    primaryDoctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Company",
        required: true,
      },

    // 👨‍⚕️ Additional doctors involved
    additionalDoctors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // 🧍 Patient
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // 📅 Appointment scheduling
    appointmentDate: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String, // e.g. "10:00 AM"
    },
    endTime: {
      type: String, // e.g. "10:30 AM"
    },

    title: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },

    // 💻 Online / Offline mode
    mode: {
      type: String,
      enum: ["online", "offline"],
      required: true,
      default: "offline",
    },

    // 🌍 Meeting or Location Details
    meetingLink: {
      type: String, // only used if mode === "online"
    },
    location: {
      type: String, // e.g. "Apollo Hospital, Room 12" if offline
    },

    // 🔗 Follow-up relationship
    followUpOf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      default: null,
    },

    rootAppointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      default: null,
    },

    // 🔄 Status of appointment
    status: {
      type: String,
      enum: [
        "scheduled",
        "in-progress",
        "completed",
        "cancelled",
        "rescheduled",
        "no-show",
      ],
      default: "scheduled",
    },

    createdBy : {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // 📝 Notes by doctor or patient
    notes: [
      {
        author: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        text: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // 📜 Appointment action history
    history: [
      {
        action: String, // e.g. "created", "updated", "cancelled"
        by: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        timestamp: {
          type: Date
        },
        remarks: String,
      },
    ],

    isActive: {
      type: Boolean,
      default: true,
    },
    created_At:{
        type : Date
    },
    updated_At:{
        type : Date
    }
  }
);

export default mongoose.model("Appointment", appointmentSchema);
