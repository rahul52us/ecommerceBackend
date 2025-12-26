import mongoose from "mongoose";

const recallAppointmentSchema = new mongoose.Schema(
  {
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },

    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
    },

    recallDate: {
      type: Date,
      required: true,
    },

    // 📝 Why recall
    reason: {
      type: String,
      trim: true,
      required: true,
    },

    // 🔄 Recall status (NOT appointment status)
    status: {
      type: String,
      enum: ["pending", "scheduled", "completed", "cancelled"],
      default: "pending",
    },

    // 📆 New appointment created from recall
    scheduledAppointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    createdAt : {
        type : Date,
        default : new Date()
    }
  },

);

export default mongoose.model("RecallAppointment", recallAppointmentSchema);
