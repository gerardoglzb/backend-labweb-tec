if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}

const express = require('express')
const app = express()
const bcrypt = require('bcrypt')
const passport = require('passport')
const flash = require('express-flash')
const session = require('express-session')
const methodOverride = require('method-override')
const sqlite3 = require("sqlite3").verbose()
let sql;

const db = new sqlite3.Database("./sqlite3.db", sqlite3.OPEN_READWRITE, (err) => {
    if (err) return console.error(err.message);
})

// sql = `CREATE TABLE users(id INTEGER PRIMARY KEY, name, email, password, type)`;
// sql = `DROP TABLE users`;
// db.run(sql);

// sql = `CREATE TABLE messages(id INTEGER PRIMARY KEY, text)`;
// sql = `DROP TABLE messages`;
// db.run(sql);

// mymsg = "De acuerdo. Muchas gracias!"

// sql = `INSERT INTO messages(text) VALUES (?)`;
// db.run(
//     sql,
//     [mymsg],
//     (err) => {
//         if (err) return console.error(err.message);
//     }
// )

function createUser(name, email, password, type) {
    sql = `INSERT INTO users(name, email, password, type) VALUES (?,?,?,?)`;
    db.run(
        sql,
        [name, email, password, type],
        (err) => {
            if (err) return console.error(err.message);
        }
    )
    sql = `SELECT id id
                FROM users
                WHERE email  = ?`;
    id = "";
    db.get(sql, [email], (err, row) => {
        if (err) {
            return console.error(err.message);
        }
        return row
        ?
    users.push({
        id: row.id.toString(),
        name: name,
        email: email,
        password: password,
        type: type,
    })
        : id = "";
    });
}

const initializePassport = require('./passport-config')
initializePassport(
    passport,
    email => users.find(user => user.email === email),
    id => users.find(user => user.id === id)
)

const users = []

function getUsers() {
    sql = `SELECT * FROM USERS`;
    db.all(sql, [], (err, rows) => {
        if (err) return console.error(err.message);
        rows.forEach(row => {
            users.push(row);
        })
    })
}

getUsers();

const messages = [];
let messageIdx = 0;

function getMessages() {
    sql = `SELECT * FROM MESSAGES`;
    db.all(sql, [], (err, rows) => {
        if (err) return console.error(err.message);
        rows.forEach(row => {
            console.log(row.text);
            messages.push(row.text);
        })
    })
}

getMessages();

app.set('view-engine', 'ejs')
app.use(express.urlencoded({ extended: false }))
app.use(flash())
app.use(session({
    secret: "secret",
    resave: false,
    saveUninitialized: false
}))
app.use(passport.initialize())
app.use(passport.session())
app.use(methodOverride('_method'))

app.get('/', checkAuthenticated, (req, res) => {
    res.render('index.ejs', { name: req.user.name })
})

app.get('/whatsapp', (req, res) => {
    var message = "Hola. Ocupo ayuda."
    if (messages.length > 0) {
        message = messages[messageIdx];
        messageIdx = (messageIdx + 1) % messages.length;
    }
    res.send(message);
})

app.get('/login', checkNotAuthenticated, (req, res) => {
    res.render('login.ejs')
})

app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
}))

var realHashed;

function realHashedFound(hashed) {
    realHashed = hashed;
}

app.get('/checklogin', async (req, res) => {
    const myEmail = req.query.email;
    sql = `SELECT *
            FROM users
            WHERE email = ?`;
    db.get(sql, [myEmail], (err, row) => {
        if (err) {
            return console.error(err.message);
        }
        return row
        ?
        realHashedFound(row.password)
        : realHashedFound(null);
    })
    console.log("donezo");
    console.log(realHashed);
    try {
        console.log("in the try");
        if (realHashed != null) {
            console.log("hashing");
            const myHashed = await bcrypt.hash(req.query.password, 10)
            console.log(myHashed);
            console.log(realHashed);
            if (myHashed == realHashed) {
                res.send(true);
            }
        }
    } catch {
        res.send("err");
    }
    console.log("bye");
    res.send(false);
})

app.get('/register', checkNotAuthenticated, (req, res) => {
    res.render('register.ejs')
})

app.post('/register', checkNotAuthenticated, async (req, res) => {
    try {
        const hashPassword = await bcrypt.hash(req.body.password, 10)
        createUser(req.body.name, req.body.email, hashPassword, 0);
        res.redirect('/login')
    } catch {
        res.redirect('/register')
    }
})

app.delete('/logout', (req, res, next) => {
    req.logOut((err) => {
      if (err) {
        return next(err);
      }
      res.redirect('/login');
    });
});

function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next()
    }

    res.redirect('/login')
}

function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect('/')
    }
    next()
}

app.listen(process.env.PORT || 5000)