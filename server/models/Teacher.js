import mongoose from "mongoose";

const teacherSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    class: { type: String },
    section: { type: String },
    designation: { type: String, required: true },
    joiningDate: { type: String },
    salary: { type: Number, default: 0 },
    salaryDetails: {
      base: { type: Number, default: 0 },
      allowances: { type: Number, default: 0 },
      deductions: { type: Number, default: 0 },
      net: { type: Number, default: 0 },
    },
    bankDetails: { type: String },
    syllabusCompletion: { type: Number, default: 0 },
    status: { type: String, enum: ["Present", "Absent", "On Leave", "Late"], default: "Present" },
    checkIn: { type: String },
    remarks: { type: String },
  },
  { timestamps: true }
);

teacherSchema.pre("save", function (next) {
  if (this.salaryDetails) {
    this.salaryDetails.net = 
      (this.salaryDetails.base || 0) + 
      (this.salaryDetails.allowances || 0) - 
      (this.salaryDetails.deductions || 0);
    this.salary = this.salaryDetails.net;
  }
  next();
});

const Teacher = mongoose.model("Teacher", teacherSchema);
export default Teacher;
