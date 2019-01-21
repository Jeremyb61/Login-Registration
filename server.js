var express = require('express');
var app = express();
var uniqueValidator = require('mongoose-unique-validator');

var session = require('express-session');
app.set('trust proxy', 1)
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 60000 }
}));

const bcrypt = require('bcrypt');

var mongoose = require('mongoose');
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost/login');

const flash = require('express-flash');
app.use(flash());

var path = require('path');
app.use(express.static(path.join(__dirname, './static')));

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));

var UserSchema = new mongoose.Schema({
    firstname: { type: String, required: [true, 'Please enter your first name'], minlength: [2, 'First name must be 2 or more characters'] },
    lastname: { type: String, required: [true, 'Please enter your last name'], minlength: [2, 'Last name must be 2 or more characters'] },
    password: { type: String, required: [true, 'Password is required'], minlength: [8, 'fhdfhfdh'] },
    email: { type: String, trim: true, lowercase: true, unique: true, required: 'Email address is required', match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address'] }
},
    { timestamps: true });
UserSchema.plugin(uniqueValidator);

mongoose.model('User', UserSchema);
var User = mongoose.model('User');

app.set('views', path.join(__dirname + '/views'));
app.set('view engine', 'ejs');

app.get('/', function (req, res) {
    res.render('index.ejs');
});
//POST REQUEST to add user to db
app.post('/process', function (req, res) {
    const user_instance = new User(req.body);
    if (req.body.confirmpassword != req.body.password) {
        res.redirect('/');
    } else {
        user_instance.validate(function (err) {
            if (err) {
                console.log('nope');
                console.log('something went wrong', err);
                for (var key in err.errors) {
                    req.flash('registration', err.errors[key].message);
                }
                res.redirect('/');
            } else {
                bcrypt.hash(req.body.password, 10, function (err, hash) {
                    console.log(err)
                    console.log(hash)
                    user_instance.password = hash;
                    user_instance.save(function (err) {
                        console.log(user_instance)
                        req.session.loggedin = user_instance._id
                        console.log('successfully added a user!');
                        res.redirect('/welcome');
                    })
                });
            }
        });
    }
})
// POST REQUEST to log user in
app.post('/plogin', function (req, res) {
    User.findOne({ email: req.body.email }, function (err, user) {
        if (err) {
            console.log('Login error');
            for (var key in err.errors) {
                req.flash('registration', err.errors[key].message);
            }
            res.redirect('/');
        } else if (user) {
            console.log('successfully logged in!');
            bcrypt.compare(req.body.pass, user.password, function (err, result) {

                if (err) {
                    res.redirect('/')
                }
                else if (result) {
                    req.session.loggedin = user._id
                    res.redirect('/welcome');
                } else {
                    res.redirect('/')
                }
            });
        } else {
            res.redirect('/');
        }

    })
});

app.get('/welcome', function (req, res) {

    res.render('welcome.ejs');
});

app.listen(8000, function () {
    console.log("listening on 8000");
});