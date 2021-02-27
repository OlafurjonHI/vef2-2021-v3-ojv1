import passport from 'passport';

import { comparePasswords, findByUsername, findById } from './users.js';

export async function strat(username, password, done) {
  try {
    const user = await findByUsername(username);
    if (!user) {
      return done(null, false);
    }
    // Verður annað hvort notanda hlutur ef lykilorð rétt, eða false
    const result = await comparePasswords(password, user.password);
    if (result) return done(null, user);
    return done(null, false);
  } catch (err) {
    console.error(err);
    return done(err);
  }
}

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await findById(id);
    return done(null, user);
  } catch (error) {
    return done(error);
  }
});
export default passport;
