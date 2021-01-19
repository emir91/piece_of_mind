const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo")(session)
const flash = require('connect-flash');
const app = express();

let sessionOptions = session({
    secret: "JavaScript is cool",
    store: new MongoStore({client: require("./db")}),
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24,
        httpOnly: true
    }
})

app.use(flash());
app.use(sessionOptions);

app.use(function(req, res, next) {
    res.locals.user = req.session.user;
    next();
})
const router = require("./router");

app.use(express.urlencoded({extended: false})); //sending data by submitting html form
app.use(express.json()); //sending json data

app.use(express.static('public'));
app.set('views', 'views'); //telling express where to look for our templates
app.set('view engine', 'ejs'); //setting template engine

app.use('/', router);

module.exports = app;