const express = require('express')
const app = express();
const db = require("./database.js")
const bcrypt = require('bcrypt')
const session = require('express-session')

app.set('view engine', 'ejs')

app.use('/bootstrap', express.static(__dirname + '/node_modules/bootstrap/dist'))
app.use('/jquery', express.static(__dirname + '/node_modules/jquery/dist/'))
app.use(express.urlencoded())
app.use(session({
  secret: 'randomly generated secret',
}))


function setCurrentUser(req, res, next) {
  if (req.session.loggedIn) {
    var sql = "SELECT * FROM users WHERE id = ?"
    var params = [req.session.userId]
    db.get(sql, params, (err, row) => {
      if (row !== undefined) {
        res.locals.currentUser = row
      }
      return next()
    });
  } else {
    return next()
  }
}

app.use(setCurrentUser)

function checkAuth(req, res, next) {
  if (req.session.loggedIn) {
    return next()
  } else {
    res.redirect('/login')
  }
}


app.get('/', function (req, res) {
  res.render('index', { activePage: "home" })
})

app.get('/register', function (req, res) {
  res.render('register', { activePage: "register" })
})

app.get('/login', function (req, res) {
  res.render('login', { activePage: "login", error: "" })
})

app.get('/logout', function (req, res) {
  req.session.userId = null
  req.session.loggedIn = false
  res.redirect("/login")
})

app.get('/profile', checkAuth, function (req, res) {
  res.render('profile', { activePage: "profile" })
})

app.get('/edit_profile', checkAuth, function (req, res) {
  res.render('edit_profile', { activePage: "profile" })
})


app.post('/register', function (req, res) {
  bcrypt.hash(req.body.password, 10, function (err, hash) {
    var data = [
      req.body.name,
      req.body.email,
      hash
    ]
    var sql = "INSERT INTO users (name, email, password) VALUES (?,?,?)"
    db.run(sql, data, function (err, result) {
      if (err) {
        res.status(400)
        res.send("database error:" + err.message)
        return;
      }
      res.render('register_answer', {
        activePage: "register", formData:
          req.body
      })
    });
  });
})

app.post('/login', function (req, res) {
  var sql = "SELECT * FROM users WHERE email = ?"
  var params = [req.body.email]
  var error = ""
  db.get(sql, params, (err, row) => {
    if (err) {
      error = err.message
    }
    if (row === undefined) {
      error = "Wrong email or password"
    }
    if (error !== "") {
      res.render('login', { activePage: "login", error: error })
      return
    }
      bcrypt.compare(req.body.password, row["password"], function (err, hashRes) {
        if (hashRes === false) {
          error = "Wrong password";
          res.render('login', { activePage: "login", error: error })
          return
        }
        req.session.userId = row["id"]
        req.session.loggedIn = true
        res.redirect("/")
      });
  })
})

app.post('/edit_profile', function (req, res) {
  bcrypt.hash(req.body.password, 10, function (err, hash) {
    var data = [
      req.body.name,
      req.body.email,
      hash,
      req.session.userId,
    ]
    db.run(
      `UPDATE users SET
  name = COALESCE(?,name),
  email= COALESCE(?,email),
  password = COALESCE(?,password)
  WHERE id = ?`,
      data,
      function (err, result) {
        if (err) {
          res.status(400)
          res.send("database error:" + err.message)
          return;
        }
        res.redirect('/profile')
      });
  });
})

app.listen(3000)