import express from 'express';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import {sendEmail} from '../controllers/emailverification.js';
import jwt from 'jsonwebtoken';

const router = express.Router();
router.post('/verifyemail',async (req,res) => {
    try {
        const {token} = req.body;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findByIdAndUpdate(decoded.id, {verified: true});
        return res.status(200).json({success: true, id:decoded.id, user});
    } catch (error) {
        console.error('Jwt Decoding Error:', error);
        return res.status(401).json({success: false, message: 'User is not created' });

    }

})



// Register route
router.post('/register', async (req, res) => {
    const { username, email, password, role, gender} = req.body;
    try {
        
        const domain = email.split('@')[1];
        if(domain !== 'gmail.com' && domain !== 'yahoo.com' && domain !=='outlook.com') {
            return  res.status(400).json({ message: 'Email domain is not supported' });
        }
        const user = await User.create({
            username,
            email,
            password,
            role,
            verified: false,
            gender
        });

        const verifytoken = generateverifyToken(user._id);
        const sendemail = await sendEmail(email,verifytoken);
        if(!sendemail.success) {           
            console.error(`Failed to send verification email: ${email}`);
            return res.status(400).json({ message: 'Email doesnot exist' });
        }
        console.log('Verification email sent');
        return res.status(200).json({ message: 'Registration successful, please verify your email'});

    } catch (err) {
        console.error('Register error:', err);
        if(err.code === 11000 || err?.cause?.code === 11000) {
            return res.status(400).json({ message: 'User already exists' });
        }
        else
            return res.status(500).json({ message: 'Server error', error: err.message });
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

        if(user.verified === false) {
            return res.status(401).json({ message: 'Please verify your email to login' });
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
        .populate("family.father family.spouse family.mother family.siblings family.children");
    res.status(200).json(user);
});


// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({id}, process.env.JWT_SECRET, { expiresIn: '1d' });
}

const generateverifyToken = (id) => {
    return jwt.sign({id}, process.env.JWT_SECRET, { expiresIn: '600s' });
}

export default router;