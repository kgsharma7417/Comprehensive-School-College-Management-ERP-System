import mongoose from "mongoose";

const salarySlipSchema = new mongoose.Schema(
  {
    teacherId: { type: String, required: true },
    month: { type: String, required: true },
    base: { type: Number, required: true },
    deductions: { type: Number, default: 0 },
    net: { type: Number, required: true },
    status: { type: String, enum: ["Paid", "Pending"], default: "Pending" },
  },
  { timestamps: true }
);

const SalarySlip = mongoose.model("SalarySlip", salarySlipSchema);
export default SalarySlip;
