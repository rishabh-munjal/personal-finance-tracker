import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

export const connectDB = async (req, res) => {

    const db = process.env.MONGO_URI;

    const {connection} = await mongoose.connect(db, { useNewUrlParser: true });

    console.log(`MongoDB Connected to ${connection.host}`);

}