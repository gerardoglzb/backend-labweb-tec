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

const messages = {}
let messageIdx = 0;

function getMessages() {
    sql = `SELECT * FROM MESSAGES`;
    db.all(sql, [], (err, rows) => {
        if (err) return console.error(err.message);
        var i = 0;
        rows.forEach(row => {
            console.log(row);
            messages[i++] = row.text;
        })
    })
}

getMessages();

app.set('view-engine', 'ejs')
app.use(express.urlencoded({ extended: false }))
app.use(flash())
app.use(session({
    secret: process.env.SESSION_SECRET,
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
    res.json(messages);
})

app.get('/login', checkNotAuthenticated, (req, res) => {
    console.log(users);
    res.render('login.ejs')
})

app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
}))

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