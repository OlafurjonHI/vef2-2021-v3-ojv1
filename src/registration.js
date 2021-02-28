/* eslint-disable no-underscore-dangle */
import express from 'express';
import { body, validationResult } from 'express-validator';
import xss from 'xss';
import {
  list, insert, total,
} from './db.js';

export const router = express.Router();

/**
 * Higher-order fall sem umlykur async middleware með villumeðhöndlun.
 *
 * @param {function} fn Middleware sem grípa á villur fyrir
 * @returns {function} Middleware með villumeðhöndlun
 */
function catchErrors(fn) {
  return (req, res, next) => fn(req, res, next).catch(next);
}
const modulo = (a, n) => ((a % n) + n) % n;
export const getList = async (offset, limit, url) => {
  let page = offset;
  const totalsig = parseInt(await total(), 10);
  const maxPages = (modulo(totalsig, limit) === 0) ? (totalsig / limit) : (totalsig / limit) + 1;
  page = Math.round(page);
  const registrations = await list(page, limit);
  const result = {
    totalsig,
    page,
    pages: maxPages,
    _links: {
      self: {
        href: `${url}?page=${page}`,
      },
    },
    items: registrations,
  };

  if (page > 1) {
    result._links.prev = {
      href: `${url}?page=${Number(page) - 1}`,
    };
  }

  if (page + 1 < maxPages) {
    result._links.next = {
      href: `${url}?page=${Number(page) + 1}`,
    };
  }
  return { registrations, result };
};
export async function index(req, res) {
  const { page = 1 } = req.query;
  const limit = 50;
  const errors = [];
  const formData = {
    name: '',
    nationalId: '',
    anonymous: false,
    comment: '',
  };
  const { registrations, result } = await getList(page, limit, '/');
  res.render('index', {
    errors, formData, registrations, result,
  });
}
const nationalIdPattern = '^[0-9]{6}-?[0-9]{4}$';

const validationMiddleware = [
  body('name')
    .isLength({ min: 1 })
    .withMessage('Nafn má ekki vera tómt'),
  body('name')
    .isLength({ max: 128 })
    .withMessage('Nafn má að hámarki vera 128 stafir'),
  body('nationalId')
    .isLength({ min: 1 })
    .withMessage('Kennitala má ekki vera tóm'),
  body('nationalId')
    .matches(new RegExp(nationalIdPattern))
    .withMessage('Kennitala verður að vera á formi 000000-0000 eða 0000000000'),
  body('comment')
    .isLength({ max: 400 })
    .withMessage('Athugasemd má að hámarki vera 400 stafir'),
];

// Viljum keyra sér og með validation, ver gegn „self XSS“
const xssSanitizationMiddleware = [
  body('name').customSanitizer((v) => xss(v)),
  body('nationalId').customSanitizer((v) => xss(v)),
  body('comment').customSanitizer((v) => xss(v)),
  body('anonymous').customSanitizer((v) => xss(v)),
];

const sanitizationMiddleware = [
  body('name').trim().escape(),
  body('nationalId').blacklist('-'),
];

async function validationCheck(req, res, next) {
  const { page = 1 } = req.query;
  const {
    name, nationalId, comment, anonymous,
  } = req.body;

  const formData = {
    name, nationalId, comment, anonymous,
  };

  const { registrations, result } = await getList(page, 50, '/');
  const validation = validationResult(req);

  if (!validation.isEmpty()) {
    return res.render('index', {
      formData, errors: validation.errors, registrations, result,
    });
  }

  return next();
}

async function register(req, res) {
  const {
    name, nationalId, comment, anonymous,
  } = req.body;

  let success = true;

  try {
    success = await insert({
      name, nationalId, comment, anonymous,
    });
  } catch (e) {
    console.error(e);
  }

  if (success) {
    return res.redirect('/');
  }

  return res.render('error', { title: 'Gat ekki skráð!', text: 'Hafðir þú skrifað undir áður?' });
}

router.get('/', catchErrors(index));

router.post(
  '/',
  validationMiddleware,
  xssSanitizationMiddleware,
  catchErrors(validationCheck),
  sanitizationMiddleware,
  catchErrors(register),
);
