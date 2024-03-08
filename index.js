require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI);

const userRoutes = require("./routes/user");
const offersRoutes = require("./routes/offer");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

app.get("/", (req, res) => {
  try {
    console.log("Welcome to the Vinted Reborn server 🔥");
    return res.status(200).json("Welcome to the Vinted Reborn server 🔥");
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.use(userRoutes);
app.use(offersRoutes);

app.all("*", (req, res) => {
  res.status(404).json({ message: "This route does not exist" });
});

app.listen(process.env.PORT, () => {
  console.log(`Server started on PORT ${process.env.PORT} 🚀`);
});
