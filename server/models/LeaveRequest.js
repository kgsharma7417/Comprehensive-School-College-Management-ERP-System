import mongoose from "mongoose";

const leaveRequestSchema = new mongoose.Schema(
  {
    teacherId: { type: String, required: true },
    teacherName: { type: String, required: true },
    days: { type: String, required: true },
    reason: { type: String, required: true },
    status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
    date: { type: String, required: true },
  },
  { timestamps: true }
);

const LeaveRequest = mongoose.model("LeaveRequest", leaveRequestSchema);
export default LeaveRequest;
