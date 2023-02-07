# Welcome to my portfolio backend server!

## What packages does it use?

The server uses body parser to parse incoming post requests. It uses dotenv to handle environmental variables, or secrets. It relies on Express to run the server. The server also utilizes mongoose in order to create schemas and communicate with MongoDB. I decided to use nodemailer to make sending emails easier when the contact form is filled out. Multer is used in order to parse multipart/form-data requests, as I made it possible to upload images from the admin panel of my portfolio page.

## What does the backend do exactly?
When I built my website, I wanted to make a full-stack application. I wanted to be able to edit, add, or delete projects all from my website. I also wanted the website to retrieve all its portfolio information from the backend, so that's what I did!
My backend uses MongoDB to store all the project data. It then handles everything related to MongoDB, including deleting projects, editing projects, and creating new projects. Furthermore, the backend also has some simple authentication to deal with logging in. It all works!