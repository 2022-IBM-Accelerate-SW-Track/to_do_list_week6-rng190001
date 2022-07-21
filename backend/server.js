const express = require("express"),
       app = express(),
       port = process.env.PORT || 8080,
       cors = require("cors");
const bodyParser = require('body-parser');
const fs = require("fs");
//const { authenticator } = require("./authentication");


const basicAuth = require("express-basic-auth");
var { authenticator, upsertUser, cookieAuth } = require("./authentication");
const auth = basicAuth({
    authorizer: authenticator
});
const cookieParser = require("cookie-parser");
app.use(cookieParser("82e4e438a0705fabf61f9854e3b575af"));

app.use(cors({
  credentials: true,
  origin: 'http://localhost:3000'
}));

//app.use(cors());
app.use(bodyParser.json({ extended: true }));
app.listen(port, () => console.log("Backend server live on " + port));

app.get("/", (req, res) => {
    res.send({ message: "Connected to Backend server!" });
    });


//Add the three endpoints
app.get("/authenticate", auth, (req, res) => {
    console.log(`user logging in: ${req.auth.user}`);
    res.cookie('user', req.auth.user, { signed: true });
    res.sendStatus(200);
});
  
app.post("/users", (req, res) => {
    const b64auth = (req.headers.authorization || '').split(' ')[1] || ''
    const [username, password] = Buffer.from(b64auth, 'base64').toString().split(':')
    const upsertSucceeded = upsertUser(username, password)
    res.sendStatus(upsertSucceeded ? 200 : 401);
});

app.get("/logout", (req, res) => {
    res.clearCookie('user');
    res.end();
});

//add new item to json file
app.post("/add/item", cookieAuth, addItem)

function addItem (request, response) {
    // Converting Javascript object (Task Item) to a JSON string
    let id = request.body.jsonObject.id
    let task = request.body.jsonObject.task
    let curDate = request.body.jsonObject.currentDate
    let dueDate = request.body.jsonObject.dueDate
    var newTask = {
      ID: id,
      Task: task,
      Current_date: curDate,
      Due_date: dueDate
    }
    const jsonString = JSON.stringify(newTask)


    var data = fs.readFileSync('database.json');
    var json = JSON.parse(data);
    json.push(newTask);
    fs.writeFile("database.json", JSON.stringify(json), function(err, result) {
      if (err) { console.log('error', err) }
      else { console.log('Successfully wrote to file') }
    });
    response.send(200)
}

app.get("/get/items", cookieAuth, getItems)
//** week5, get all items from the json database*/
  function getItems (request, response) {
    //begin here
    var data = fs.readFileSync('database.json');
    
    //uncomment to see the data being returned 
    //console.log(JSON.parse(data));

    response.json(JSON.parse(data));
    // Note this won't work, why? response.send();
  } 

app.get("/get/searchitem", cookieAuth, searchItems)
//**week 5, search items service */
  function searchItems (request, response) {
    //begin here
    var searchField = request.query.taskname;
    //uncomment to see the searchField passed in
    //console.log(searchField);

    var json = JSON.parse (fs.readFileSync('database.json'));
    returnData = json.filter(jsondata => jsondata.Task === searchField);

    //uncomment to see the todolists found in the backend service// 
    //console.log(returnData);
    response.json(returnData);
    //Note this won't work, why? response.send();
  }
