import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    docId: { type: String, required: true, unique: true },
    class: { type: String, required: true },
    section: { type: String, required: true },
    date: { type: String, required: true },
    present: [{ type: String }],
    absent: [{ type: String }],
    markedBy: { type: String },
    markedByName: { type: String },
    markedAt: { type: String },
  },
  { timestamps: true }
);

const Attendance = mongoose.model("Attendance", attendanceSchema);
export default Attendance;
