const express = require("express");
require("./db/mongoose"); //ensures mongoose  connects to db
const userRoute = require("./routers/user");
const taskRoute = require("./routers/task");

const app = express();

const port = process.env.PORT;

//app.use is to customize the server and express.json() is used to parse the incoming json body from postman.
//This data is available in the req.body
app.use(express.json());
app.use(userRoute);
app.use(taskRoute);

app.listen(port, () => {
  console.log("Server is up on port " + port);
});
