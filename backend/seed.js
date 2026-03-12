import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './models/User.js';

dotenv.config();

const dummyUsers = [
    {
        name: 'John Citizen',
        email: 'citizen@cityfix.com',
        password: 'citizen123',
        role: 'citizen',
        photoURL: 'https://ui-avatars.com/api/?name=John+Citizen&background=3b82f6&color=fff',
        zone: 'North District',
    },
    {
        name: 'Officer Sarah',
        email: 'officer@cityfix.com',
        password: 'officer123',
        role: 'officer',
        photoURL: 'https://ui-avatars.com/api/?name=Officer+Sarah&background=8b5cf6&color=fff',
        department: 'Public Works',
        zone: 'North District',
    },
    {
        name: 'Admin Suresh',
        email: 'admin@cityfix.com',
        password: 'admin123',
        role: 'admin',
        photoURL: 'https://ui-avatars.com/api/?name=Admin+Suresh&background=f97316&color=fff',
        department: 'Headquarters',
    }
];

// Helper to wait until mongoose gives us its instance
const seedDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log(`✅ MongoDB connected specifically for Seeding...`);

        // Check each dummy user. Setup if blank.
        for (let dummy of dummyUsers) {
            const exists = await User.findOne({ email: dummy.email });
            if (!exists) {
                // The pre('save') hook in your User.js handles the bcrypt hashing transparently
                await User.create(dummy);
                console.log(`🌱 Seeded ${dummy.role} account into MongoDB.`);
            } else {
                console.log(`⚡ ${dummy.role} account already exists — skipping.`);
            }
        }

        console.log('✅ Seeding Complete!');
        process.exit();
    } catch (err) {
        console.error('❌ Seeding Failed:', err);
        process.exit(1);
    }
};

seedDB();
