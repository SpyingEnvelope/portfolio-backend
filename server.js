var createError = require("http-errors");
var express = require("express");
var app = express();
const multer = require('multer');
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const bodyParser = require("body-parser");
const cors = require("cors");
const nodemailer = require("nodemailer");
require("dotenv").config();
const mySecretURI = process.env["MONGO_URI"];

// Storage data for multer so image uploading can be possible
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/images')
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
});

// using multer as a middleware to deal with requests involving an image file
const upload = multer({ storage: storage });

// set strictQuery to false in order to deal with the deprecation warning
mongoose.set("strictQuery", false);
// Connect to Database
mongoose
  .connect(mySecretURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .catch((e) => console.log(e));

// Schema for mongoose
const projectSchema = new Schema({
  category: String,
  name: String,
  description: String,
  techUsed: String,
  image: String,
  link: String,
});

// Model for mongoose
const PortfolioProject = mongoose.model("Project", projectSchema);

//Body parser for post requests
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

// Serve static images for the portfolio website
app.use(express.static("public"));

// Create nodemailer transport
const transporter = nodemailer.createTransport({
  host: 'smtp.sendgrid.net',
  port: 587,
  auth: {
    user: "apikey",
    pass: process.env.SENDGRID_API_KEY
  }
});

// GET request to the server for all projects
app.get("/api/portfolio-projects", async (req, res) => {
  try {
    const responseData = await PortfolioProject.find({});
    res.send(responseData);
  } catch (error) {
    console.log(error);
    res.json({ message: "error retrieving data" });
  }
});

// POST Request to add a new project to the database
app.post("/api/new-project", upload.single('image'), async (req, res) => {
  if (
    !req.body.category ||
    !req.body.name ||
    !req.body.description ||
    !req.body.techUsed ||
    !req.body.link ||
    !req.file
  ) {
    console.log("fields missing");
    res.json({ error: "Fields missing" });
    return;
  }
  try {
    const dataBody = {
      category: req.body.category,
      name: req.body.name,
      description: req.body.description,
      techUsed: req.body.techUsed,
      image: 'https://' + req.get('host') + '/images/' + req.file.originalname,
      link: req.body.link
    }

    const newProject = new PortfolioProject(dataBody);
    newProject.save(function (err) {
      if (err) {
        throw new Error(err);
      }
    });

    res.json({ message: "New Project Saved Successfully" });
  } catch (error) {
    console.log(error);
    res.json({ "error": "failed to save new project" });
  }
});

// A POST api to deal with logging into the website
app.post("/api/login", (req, res) => {
  if (
    req.body.username == process.env["PORTFOLIO_USERNAME"] &&
    req.body.password == process.env.PASSWORD
  ) {
    res.json({ token: process.env.TOKEN });
  } else {
    res.json({ error: "Username or password do not exist" });
  }
});

// A DELETE api to deal with deleting a project from the website
app.delete("/api/delete-project", async (req, res) => {
  try {
    const deleted = await PortfolioProject.deleteOne({ _id: req.body.id });
    console.log(deleted);
    if (deleted.deletedCount === 0) {
      throw new Error("No projects with a matching id to delete");
    }
    res.json({ message: "Project deleted successfully" });
  } catch (error) {
    console.log(error);
    res.json({ "error": "Failed to delete project" });
  }
});

// A POST api to check if a token is valid
app.post("/api/check-token", (req, res) => {
  console.log("I am in api check-token");
  console.log(req.body.token);
  if (req.body.token != process.env.TOKEN) {
    res.json({ error: "invalid token" });
    return;
  }

  res.json({ message: "token authenticated" });
});

// A GET api to retrieve data for one project
app.get('/api/project/:id', async (req, res) => {
  try {
    const projectData = await PortfolioProject.findOne({'_id': req.params.id}).exec();
    if (!projectData) {
      throw new Error('Cannot find project with given id');
    };
    res.json(projectData);
  } catch (error) {
    res.json({'error': 'could not retrieve data'})
  }
});

// A POST api to update data of an existing project
app.post('/api/project/update-project', async (req, res) => {
  try {
    const projectData = await PortfolioProject.findOne({'_id': req.body.id});
    if (!projectData) {
      throw new Error('No project with matching id found');
    };
    projectData.category = req.body.category;
    projectData.name = req.body.name;
    projectData.description = req.body.description;
    projectData.techUsed = req.body.techUsed;
    projectData.image = req.body.image;
    projectData.link = req.body.link;

    const saveResponse = await projectData.save();
    if (saveResponse == projectData) {
      res.json({'message': 'Project updated succesfully'})
    } else {
      throw new Error('Failed to save project')
    }
    
  } catch (error) {
    console.log(error);
    res.json({'error': 'Could not update project'});
  }
});

// A POST api for sending an email when someone completes the contact me form
app.post('/api/contact-me', async (req, res) => {
  if (!req.body.email || !req.body.phone || !req.body.name || !req.body.message) {
    res.json({"error": "fields missing"});
    return;
  }

  try {
    const emailResponse = await transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to: process.env.TO_EMAIL,
      subject: 'Message from your portfolio website from ' + req.body.name,
      text: `Sender Name: ${req.body.name} Phone number: ${req.body.phone} E-mail: ${req.body.email} Message: ${req.body.message}`
    });

    if (emailResponse.accepted.length == 0) {
      throw new Error('Failed to send email');
    };

    res.json({'message': 'Successfully sent email.'});
  } catch (error) {
    console.log(error)
    res.json({'error': 'Could not send email'})
  }
})

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

const listener = app.listen(process.env.PORT || 8000, () => {
  console.log("Server is listening on port " + listener.address().port);
});

module.exports = app;
