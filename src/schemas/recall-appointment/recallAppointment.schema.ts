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
      type: Date
    },

    // 📝 Why recall
    reason: {
      type: String,
      trim: true,
      required: true,
    },

    status: {
      type: String,
      default: "pending",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    appointmentDate : {
      type : Date
    },
    createdAt : {
        type : Date,
        default : new Date()
    },
    updatedAt : {
      type : Date
    }
  },

);

export default mongoose.model("RecallAppointment", recallAppointmentSchema);
