var User = require('./models/user');
var Team = require('./models/team');
var TechCareer = require('./models/tech_career');
var LectureFeedback = require('./models/course_feedback');

const emailEncoder = require('email-encoder');

var _ = require('lodash');

module.exports = function(app, passport) {
  app.get('/', (request, response) => {
    response.render('home', { currentUser: request.user });
  });

  app.get('/coding_exercise', (request, response) => {
    response.render('coding_exercise', { currentUser: request.user });
  });

  app.get('/workshop_summary', (request, response) => {
    response.render('workshop_summary', { currentUser: request.user });
  });

  app.get('/users', isLoggedIn, (request, response) => {
    User.findAll()
    .then(users => {
      response.render('users', { users: _.groupBy(users, 'mentor'), currentUser: request.user });
    })
  });

  app.get('/curriculum', (request, response) => {
    response.render('curriculum', { currentUser: request.user });
  });

  app.get('/users/:id', isLoggedIn, (request, response) => {
    User.findOne(request.params.id)
    .then(user => {
      response.render('user', {
        currentUser: request.user,
        alerts: [],
        user,
      });
    })
  });

  // form for editing user
  app.get('/users/:id/edit', (request, response) => {
    response.render('editProfile', {
      currentUser: request.user,
      alerts: [],
      user: request.user,
    })
  })

  // edit user
  app.post('/users/:id/edit', (request, response) => {
    User.update(request.params.id, request.body)
    .then(res => {
      User.findOne(request.params.id)
      .then(user => {
        response.render('user', {
          currentUser: request.user,
          alerts: ['Profile updated'],
          user,
        });
      })
    })
    .catch(err => console.log('User.edit err:', err))
  })


  app.get('/teams', isLoggedIn, (request, response) => {
    Team.teamsWithMembers()
    .then(teams => {
      response.render('teams', { teams, currentUser: request.user })
    })
  })

  app.get('/tech_careers', (request, response) => {
    var query;
    if(request.user) {
      query = TechCareer.findAll()
    } else {
       query = TechCareer.findAll({public: true})
    }

    query
    .then(careers => {
      response.render('tech_careers', { careers, currentUser: request.user })
    })
  })

  app.get('/tech_careers/:id', (request, response) => {
    TechCareer.findOne(request.params.id)
    .then(career => {
      if(career.contact && career.contact != '') {
        career.contact = emailEncoder(career.contact)
      }
      response.render('tech_career', { career, currentUser: request.user })
    })
  })

  app.get('/course_feedback/week/:id', isLoggedIn, (request, response) => {
    LectureFeedback.findByWeek(request.params.id)
    .then(feedbacks => {
      response.render('course_feedback', { feedbacks, currentUser: request.user })
    })
  })

  app.get('/setPassword', isLoggedOut, function(request, response) {
    response.render('set_password', { alerts: request.flash('setPassword'), currentUser: null });
  });

  app.post('/setPassword', isLoggedOut, function(request, response) {
    if(request.body.password !== request.body.confirm_password) {
      request.flash('setPassword', 'passwords do not match')
      response.redirect('/setPassword');
    }

    User.setPassword(request.body.email, request.body.password)
    .then((user) => {
      if(user) {
        request.flash('loginMessage', 'password set')
      } else {
        request.flash('loginMessage', 'password can not be reset')
      }

      response.redirect('/login');
    })
  });

  app.get('/login', isLoggedOut, function(request, response) {
    response.render('login', { alerts: request.flash('loginMessage'), currentUser: null });
  });

  app.post('/login', isLoggedOut, passport.authenticate('local-login', {
    failureRedirect: '/login',
    successRedirect: '/users'
  }));

  app.get('/logout', isLoggedIn, function(request, response) {
    request.logout();
    response.redirect('/');
  });
}


function isLoggedIn(req, res, next) {
  // if user is authenticated in the session, carry on
  if (req.isAuthenticated()) { return next(); }
  // if they aren't redirect them
  res.redirect('/login');
}

function isLoggedOut(req, res, next) {
  // if user is not  authenticated in the session, carry on
  if (!req.isAuthenticated()) { return next(); }
  // if they are, redirect them
  res.redirect('/');
}
