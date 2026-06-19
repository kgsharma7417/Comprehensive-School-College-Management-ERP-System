import mongoose from "mongoose";

const homeworkSchema = new mongoose.Schema(
  {
    class: { type: String, required: true },
    subject: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String },
    dueDate: { type: String, required: true },
  },
  { timestamps: true }
);

const Homework = mongoose.model("Homework", homeworkSchema);
export default Homework;
