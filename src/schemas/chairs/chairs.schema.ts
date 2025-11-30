import mongoose from "mongoose";

const ChairSchema = new mongoose.Schema(
  {
    chairName: {
      type: String,
      required: true,
      trim: true,
    },

    chairColor: {
      type: String,
      required: true,
      trim: true,
    },

    chairDetails: {
      type: String,
      required: true,
      trim: true,
    },

    chairNo: {
      type: String,
      required: true,
      unique: true,
    },

    // --------------------------
    // References
    // --------------------------
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
  },
  {
    timestamps: true, // creates createdAt & updatedAt
  }
);

// (Optional) Indexes for faster searching
// ChairSchema.index({ chairName: 1 });
// ChairSchema.index({ chairNo: 1 }, { unique: true });

export default mongoose.models.Chair ||
  mongoose.model("Chair", ChairSchema);
