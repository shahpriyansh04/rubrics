const mongoose = require("mongoose");
require('dotenv').config()

URL= "mongodb+srv://rajshah:rajshah1234@cluster0.t8cbi.mongodb.net/authDB?retryWrites=true&w=majority&appName=Cluster0"

async function dbConnect() {
    mongoose
    .connect(
      process.env.DB_URL,
      {
        //   these are options to ensure that the connection is done properly
        // useNewUrlParser: true,
        // useUnifiedTopology: true,
        // useCreateIndex: true,
      }
    )

    .then(() => {
        console.log("Successfully connected to MongoDB Atlas!");
      })
      .catch((error) => {
        console.log("Unable to connect to MongoDB Atlas!");
        console.error(error);
      });
}

module.exports = dbConnect;