import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: [true, "Username is required"] },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: [true, "A user with this email already exists"],
      validate: {
        validator: (v) => {
          return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v);
        },
        message: (props) => `${props.value} is not a valid email!`,
      },
    },
    password: { type: String, required: [true, "password is required"] },
    role: {
      type: String,
      enum: ["doctor", "patient"],
      default: "patient",
      required: [true, "Role is required"],
    },
    gender: {
      type: String,
      enum: ["male", "female"],
      required: [true, "Gender is required"],
    },

    verified: { type: Boolean, default: false },
    phone: {
      type: String,
      required: true,
      unique: [true, "A user with this phone exists"],
      validate: {
        validator: (v) => {
          return /^(017|018|019|015|016|013)\d{8}$/.test(v);
        },
        message: (props) => `${props.value} is not a valid phone number!`,
      },
    },
    family: {
      father: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      spouse: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      mother: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      children: [
        { type: mongoose.Schema.Types.ObjectId, ref: "User", default: [] },
      ],
    },
    private: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// Hash password
userSchema.index(
  { createdAt: 1 },
  {
    expireAfterSeconds: 300, // 60 seconds = 1 minute
    partialFilterExpression: { verified: false },
  },
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;
