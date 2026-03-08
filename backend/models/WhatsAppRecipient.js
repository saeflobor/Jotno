import mongoose from "mongoose";

const whatsAppRecipientSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    templateSentAt: {
      type: Date,
      default: null,
    },
    lastSentAt: {
      type: Date,
      default: null,
    },
    lastSentMode: {
      type: String,
      enum: ["template", "text"],
      default: null,
    },
    totalSends: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

const WhatsAppRecipient = mongoose.model(
  "WhatsAppRecipient",
  whatsAppRecipientSchema,
);

export default WhatsAppRecipient;
