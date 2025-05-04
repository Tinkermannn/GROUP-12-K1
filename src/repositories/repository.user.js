const User = require("../models/UserModel");
const bcrypt = require("bcrypt");
const emailRegex = /^([a-zA-Z0-9_\-\.]+)@([a-zA-Z0-9_\-\.]+)\.([a-zA-Z]{2,5})$/;
const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*(),.?":{}|<>])(?=.*[a-zA-Z]).{8,}$/;

// 1. Create User
async function createUser(req, res) {
    try {
        const { username, email, password, role } = req.body;

        // Cek apakah username atau email sudah ada
        const usernameExists = await User.exists({ username });
        const emailExists = await User.exists({ email });

        if (usernameExists) throw new Error("Username sudah terdaftar");
        if (emailExists) throw new Error("Email sudah terdaftar");

        // Buat user baru
        const newUser = new User({
            username,
            email,
            password,
            role,
        });

        const savedUser = await newUser.save();

        res.status(201).json({
            success: true,
            message: "User berhasil dibuat",
            data: savedUser,
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
}

// 2. Get All Users
async function getAllUsers(req, res) {
    try {
        const users = await User.find().sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: users,
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
}

// 3. Get User By ID
async function getUserById(req, res) {
    try {
        const user = await User.findById(req.params.id);

        if (!user) throw new Error("User tidak ditemukan");

        res.status(200).json({
            success: true,
            data: user,
        });
    } catch (err) {
        res.status(404).json({ success: false, message: err.message });
    }
}

// 4. Update User
async function updateUser(req, res) {
    try {
        const { username, email, password, role } = req.body;

        // Cek apakah password ada dalam request untuk di-update
        if (password) {
            // Jika password ada, hash password baru
            const salt = await bcrypt.genSalt(10);
            req.body.password = await bcrypt.hash(password, salt);
        }

        // Update user
        const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });

        res.status(200).json({
            success: true,
            data: updatedUser,
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
}

// 5. Delete User
async function deleteUser(req, res) {
    try {
        const user = await User.findByIdAndDelete(req.params.id);

        if (!user) throw new Error("User tidak ditemukan");

        res.status(200).json({
            success: true,
            message: "User berhasil dihapus",
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
}

// 6. Login User (Authenticate)
async function loginUser(req, res) {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (!user) throw new Error("Email atau password salah");

        // Verifikasi password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) throw new Error("Email atau password salah");

        res.status(200).json({
            success: true,
            message: "Login berhasil",
            data: user,
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
}

module.exports = {
    createUser,
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
    loginUser,
};
