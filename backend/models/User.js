import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
    username: { type: String, required: true},
    email: { type: String, 
            required: true,
            unique: true,
            validate: {
                validator: (v)=>{
                    return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v)},
                message: props => `${props.value} is not a valid email!`
                }},
    password: { type: String, required: true },
    role: { type: String, enum: ["doctor", "patient"], default: "patient" },
    gender: { type: String, enum: ["male", "female"], required: true },
    family: {
        father: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
        spouse: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
        mother: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
        siblings: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", default: [] }],
        children: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", default: [] }],
    }
}, { timestamps: true });

// Hash password
userSchema.pre("save", async function(next) {
    if (!this.isModified("password")) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Compare password
userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};


const User = mongoose.model("User", userSchema);

export default User;

