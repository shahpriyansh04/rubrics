const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const dbConnect = require("./db/dbConnect");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const auth = require("./authMiddleware");
const User = require("./db/userModel");

const cors = require("cors");

app.use(
  cors({
    origin: "*", // Allow all origins (for testing)
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// execute database connection
dbConnect();

// body parser configuration
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (request, response, next) => {
  response.json({ message: "Hey! This is your server response!" });
  next();
});

// free endpoint
app.get("/Customer-dashboard", auth("Customer"), (request, response) => {
  response.json({ message: "You are authorized to access student dashboard" });
});

// authentication endpoint
app.get("/Business-dashboard", auth("Business"), (request, response) => {
  response.json({ message: "You are authorized to access teacher dashbaord" });
});

app.get("/Admin", auth("Admin"), (request, response) => {
  response.json({ message: "You are authorized to access teacher dashbaord" });
});

app.post("/login", (request, response) => {
  // check if email exists
  User.findOne({ email: request.body.email , role:request.body.role })

    // if email and role exists
    .then((user) => {
      // compare the password entered and the hashed password found
      
        bcrypt
          .compare(request.body.password, user.password)

          // if the passwords match
          .then((passwordCheck) => {
            // check if password matches
            if (!passwordCheck) {
              return response.status(400).send({
                message: "Passwords does not match",
                error,
              });
            }  

          //create JWT token
          const token = jwt.sign(
            {
              userId: user._id,
              userEmail: user.email,
              role: user.role,
            },
            "RANDOM-TOKEN",
            { expiresIn: "24h" }
          );

          //   return success response
          response.status(200).send({
            message: "Login Successful",
            email: user.email,
            token,
            role
          });
        })
        // catch error if password does not match
        .catch((error) => {
          response.status(400).send({
            message: "Passwords does not match",
            error,
          });
        })      
    })
  
    // catch error if email does not exist
    .catch((e) => {
      response.status(404).send({
        message: "Email not found",
        e,
      });
    });
});

app.get("/register", (request, response, next) => {
  response.json({ message: "register page is working" });
  next();
});

app.post("/register", (req, res) => {
  // hash the password
  bcrypt
    .hash(req.body.password, 10)
    .then((hashedPassword) => {
      // create a new user instance and collect the data
      const user = new User({
        email: req.body.email,
        password: hashedPassword,
        role: req.body.role,
      });

      // save the new user
      user
        .save()
        // return success if the new user is added to the database successfully
        .then((result) => {
          res.status(201).send({
            message: "User Created Successfully",
            result,
          });
        })
        // catch error if the new user wasn't added successfully to the database
        .catch((error) => {
          res.status(500).send({
            message: "Error creating user",
            error,
          });
        });
    })
    // catch error if the password hash isn't successful
    .catch((e) => {
      res.status(500).send({
        message: "Password was not hashed successfully",
        e,
      });
    });
});

module.exports = app;
