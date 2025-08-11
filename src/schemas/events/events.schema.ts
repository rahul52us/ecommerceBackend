import mongoose, { Document } from "mongoose";

interface TestimonialI extends Document {
  title: string;
  user: mongoose.Schema.Types.ObjectId;
  category:string;
  target:string;
  trigger:string;
  company: mongoose.Schema.Types.ObjectId;
  image: any;
  price:string;
  description: string;
  createdAt:any;
  eventDate?:any
}

const EventSchema = new mongoose.Schema<TestimonialI>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },
    company : {
      type : mongoose.Schema.Types.ObjectId,
      ref : 'Company',
      required: [true, "Organisation is required"],
    },
    description:{
      type : String
    },
    price: {
      type : String
    },
    eventDate: {
      type : String
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category:{
      type : String,
      trim:true
    },
    target: {
      type: String,
      trim: true,
    },
    trigger: {
        type : String
    },
    image: {
      name: {
        type: String,
      },
      url: {
        type: String,
      },
      type: {
        type: String,
      },
    },
    createdAt: {
        type: Date,
        default: new Date(),
      },
  },
);

export default mongoose.model<TestimonialI>("Event", EventSchema);
