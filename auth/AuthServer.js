var express  = require('express')
	, session  = require('express-session')
	, passport = require('passport')
	, Strategy = require('../lib').Strategy
	, app      = express();

passport.serializeUser(function(user, done) {
	done(null, user);
});
passport.deserializeUser(function(obj, done) {
	done(null, obj);
});

var scopes = ['identify', 'email', /* 'connections', (it is currently broken) */ 'guilds', 'guilds.join'];

passport.use(new Strategy({
	clientID: '346803209295364102',
	clientSecret: 'd31nwVj3BtmB0AqsdUT0aD0no0fphK3v',
	callbackURL: 'http://localhost:5000/callback',
	scope: scopes
}, function(accessToken, refreshToken, profile, done) {
	process.nextTick(function() {
		return done(null, profile);
	});
}));

app.use(session({
	secret: 'keyboard cat',
	resave: false,
	saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.get('/', passport.authenticate('discord', { scope: scopes }), function(req, res) {});
app.get('/callback',
	passport.authenticate('discord', { failureRedirect: '/' }), function(req, res) { res.redirect('/info') } // auth success
);
app.get('/logout', function(req, res) {
	req.logout();
	res.redirect('/');
});
app.get('/info', checkAuth, function(req, res) {
	//console.log(req.user)
	res.json(req.user);
});


function checkAuth(req, res, next) {
	if (req.isAuthenticated()) return next();
	res.send('not logged in :(');
}


app.listen(5000, function (err) {
	if (err) return console.log(err)
	console.log('Listening at http://localhost:5000/')
})