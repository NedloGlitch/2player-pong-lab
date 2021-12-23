var sqlite3 = require('sqlite3').verbose()

var DBSOURCE = "./db/db.sqlite"

var db = new sqlite3.Database(DBSOURCE, (err) => {
  if (err) {
    // Cannot open database
    console.error(err.message)
    throw err
  } else {
    console.log('Connected to the SQLite database.')
    db.run(`CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name text,
      email text UNIQUE,
      password text,
      p1color text,
      p2color text,
      CONSTRAINT email_unique UNIQUE (email)
      )`,
    (err) => {
      if (err) {
        console.log("Table users is already exists:" + err.message)
      } else {
        console.log("Table users is created")
      }
    });
  }
});


module.exports = db
