import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    class: { type: String, required: true },
    section: { type: String, required: true },
    rollNo: { type: String, required: true },
    fees: {
      total: { type: Number, default: 0 },
      paid: { type: Number, default: 0 },
      balance: { type: Number, default: 0 },
      dueDate: { type: String },
      breakdown: {
        monthlyTuition: { type: Number, default: 0 },
        yearlyTerm: { type: Number, default: 0 },
        extraCharges: { type: Number, default: 0 },
      },
    },
    attendanceHistory: [
      {
        date: { type: String, required: true },
        status: { type: String, enum: ["Present", "Absent", "Late", "Half-Day"], required: true },
      },
    ],
    overallAttendance: { type: Number, default: 100 },
    marks: [
      {
        subject: { type: String, required: true },
        exam: { type: String, required: true },
        marksObtained: { type: Number, required: true },
        maxMarks: { type: Number, required: true },
      },
    ],
    concessions: [{ type: String }],
  },
  { timestamps: true }
);

// Auto-calculate balance before saving
studentSchema.pre("save", function (next) {
  if (this.fees) {
    this.fees.balance = (this.fees.total || 0) - (this.fees.paid || 0);
  }
  next();
});

const Student = mongoose.model("Student", studentSchema);
export default Student;
