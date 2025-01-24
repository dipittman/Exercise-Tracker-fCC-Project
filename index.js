const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongo = require('mongodb');
const mongoose = require('mongoose');
let bodyParser = require('body-parser');

mongoose.connect(process.env.MONGO_URI,  { useNewUrlParser: true, useUnifiedTopology: true });

app.use(bodyParser.urlencoded({ extended: false }));

//User Schema and Model
const userSchema = new mongoose.Schema({
  username: {type: String, required: true, unique: true},
  count: {type: Number},
  log: {type: Array}
});
let userModel = mongoose.model("user", userSchema);

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

//Post new user to API
app.post('/api/users', (req, res) => {
  let username = req.body.username;
    let newUser = new userModel({username: username, count: 0});
    newUser.save();
    res.json({username: newUser.username, _id: newUser._id})
})

//Get array of users if you add /api/users
app.get('/api/users', (req, res) => {
  userModel.find({}).then((users) => {
    let displayUsers = users.map((user) => {
      return {username: user.username, _id: user._id}
    })
    res.json(displayUsers)
  });
})

//Post new exercise to API
app.post('/api/users/:_id/exercises', (req, res) => {
  let _id = req.params._id;
  let date
  if (req.body.date) {
    date = new Date(req.body.date).toDateString()
  } else {
    date = new Date().toDateString()
  }
  let exerciseObj = {
    description: req.body.description,
    duration: parseInt(req.body.duration),
    date: date
  }
  userModel.findById(_id).then((userFound) => {
    userFound.log.push(exerciseObj);
    userFound.count = userFound.log.length;
    userFound.save();
    res.json({
      _id: userFound._id,
      username: userFound.username,
      ... exerciseObj
    })
  }) 
})

//Get user object with count and log array when you add /api/users/:_id/logs
app.get('/api/users/:_id/logs', (req, res) => {
  let _id = req.params._id;
  const from = req.query.from;
  const to = req.query.to;
  const limit = req.query.limit;

  userModel.findById(_id).then((userFound) => {
    
    //if a from or to or limit query exists
    if (from || to) {
      let filteredLog = userFound.log;
      if (from && to) {
        filteredLog = filteredLog.filter((exercise) => {
          let mathDate = new Date(exercise.date);
          return mathDate >= new Date(from) && mathDate <= new Date(to)
          })
      } else {
         if (from) {
           filteredLog = filteredLog.filter((exercise) => {
           console.log("true or false", new Date(exercise.date) <= new Date(to));
           return new Date(exercise.date) >= new Date(from)
           })
         } else {
            if (to) {
              filteredLog = filteredLog.filter((exercise) => {
              return new Date(exercise.date) <= new Date(to)
              })
            }
           }
      };
      if (limit) {
        filteredLog = filteredLog.slice(0, parseInt(limit))
      }
      res.json({_id: userFound._id,
        username: userFound.username,
        count: filteredLog.length,
        log: filteredLog
      })
    } 
    //if limit query exists, but no from or to
    else {
      if (limit) {
        let limitedLog = userFound.log.slice(0, parseInt(limit))
        res.json({_id: userFound._id,
          username: userFound.username,
          count: limitedLog.length,
          log: limitedLog
        })
      } 
      //if no queries exist
      else {
        console.log("You found me", userFound)
        res.json(userFound)
      }
    } 
  })
})


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
