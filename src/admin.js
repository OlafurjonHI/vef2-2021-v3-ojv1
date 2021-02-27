/* eslint-disable no-underscore-dangle */
import express from 'express';
import { Strategy } from 'passport-local';
import passport, { strat } from './login.js';

import { getList } from './registration.js';
import { deleteRow } from './db.js';

export const router = express.Router();
passport.use(new Strategy(strat));
router.use(passport.initialize());
router.use(passport.session());
router.use((req, res, next) => {
  if (req.isAuthenticated()) {
    // getum núna notað user í viewum
    res.locals.user = req.user;
  } else {
    res.locals.user = null;
  }

  next();
});
function ensureLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }

  return res.redirect('/admin/login');
}
/**
 * Higher-order fall sem umlykur async middleware með villumeðhöndlun.
 *
 * @param {function} fn Middleware sem grípa á villur fyrir
 * @returns {function} Middleware með villumeðhöndlun
 */

router.post(
  '/login',

  // Þetta notar strat að ofan til að skrá notanda inn
  passport.authenticate('local', {
    failureMessage: 'Notandanafn eða lykilorð vitlaust.',
    failureRedirect: '/admin/login',
  }),
  // Ef við komumst hingað var notandi skráður inn, senda á /admin
  (req, res) => {
    req.session.user = res.locals.user;
    res.redirect('/admin');
  },
);

router.get('/logout', (req, res) => {
  // logout hendir session cookie og session
  req.logout();
  res.redirect('/');
});
router.get('/login', (req, res) => {
  let message = '';

  // Athugum hvort einhver skilaboð séu til í session, ef svo er birtum þau
  // og hreinsum skilaboð
  if (req.session.messages && req.session.messages.length > 0) {
    message = req.session.messages.join(', ');
    req.session.messages = [];
  }
  res.render('login', { message });
});
router.post('/delete', ensureLoggedIn, async (req, res) => {
  await deleteRow(req.body);
  res.redirect('/admin');
});

// ensureLoggedIn middleware passar upp á að aðeins innskráðir notendur geti
// skoðað efnið, aðrir lenda í redirect á /login, stillt í línu 103
router.get('/', ensureLoggedIn, async (req, res) => {
  const { page = 1 } = req.query;
  const { registrations, result } = await getList(page, 50, '/admin');
  res.render('admin', { registrations, result });
});
