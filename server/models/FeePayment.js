import mongoose from "mongoose";

const feePaymentSchema = new mongoose.Schema(
  {
    studentId: { type: String, required: true },
    studentName: { type: String, required: true },
    class: { type: String, required: true },
    amountPaid: { type: Number, required: true },
    paymentDate: { type: String, required: true },
    transactionId: { type: String, required: true },
    message: { type: String },
    status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
  },
  { timestamps: true }
);

const FeePayment = mongoose.model("FeePayment", feePaymentSchema);
export default FeePayment;
