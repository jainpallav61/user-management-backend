import { Router } from "express";
import passport from "passport";
import '../googleStrategy.js'

const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/'); 
};


const router = Router();

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login', session: true }),
  (req, res) => {
    res.redirect('/api/auth/dashboard');
  }
);

router.get('/logout', isAuthenticated, (req, res) => {
  console.log(req.user)
  req.logout(() => {
    res.redirect('/');
  });
});

router.get('/dashboard', (req, res) => {
    res.send(`Hello ${req.user.name}, welcome to your dashboard`);
  });


export default router;