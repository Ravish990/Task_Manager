const express = require('express');
const passport = require('passport');
const router = express.Router();

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    res.redirect('https://task-manager-1-es9c.onrender.com/dashboard');
  }
);


router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Error during logout' });
    }
    res.status(200).json({ message: 'Logout successful' });
  });
});


router.get('/current_user', (req, res) => {
  res.send(req.user);
});

module.exports = router;