import express from 'express';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Register route
router.post('/register', async (req, res) => {
    const { username, email, password, role, gender} = req.body;
    try {
        if(!username || !email || !password || !role || !gender) {
            return res.status(400).json({ message: 'Please enter all fields' });
        }

        if(!["doctor", "patient"].includes(role)) {
            return res.status(400).json({ message: 'Role must be doctor or patient' });
        }

        const userExists = await User.findOne({email});
        if(userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({ username, email, password, role, gender });
        const token = generateToken(user._id);
        res.status(201).json({
            _id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            gender: user.gender,
            token,
        });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Login route
router.post('/login', async (req, res) => {
    const { email, password, role } = req.body;
    try {
        if(!email || !password || !role) {
            return res.status(400).json({ message: 'Please enter all fields' });
        }

        if(!["doctor", "patient"].includes(role)) {
            return res.status(400).json({ message: 'Role must be doctor or patient' });
        }

        const user = await User.findOne({email});
        if(!user || !(await user.matchPassword(password))) {
             return res.status(401).json({ message: 'Invalid credentials' });
        }

        if(user.role !== role) {
             return res.status(401).json({ message: 'Role mismatch' });
        }
        const token = generateToken(user._id);
        res.status(200).json({
            _id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            gender: user.gender,
            token,
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Me route
// In auth.js, modify /me route
router.get("/me", protect, async (req, res) => {
    const user = await User.findById(req.user._id)
        .select("-password")
        .populate("family.father family.mother family.siblings family.children");
    res.status(200).json(user);
});


// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({id}, process.env.JWT_SECRET, { expiresIn: '30d' });
}

export default router;