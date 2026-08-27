const test = require('node:test');
const assert = require('node:assert');
const { requireRole, LIBRARIAN_ROLES, HEAD_ONLY, STUDENT_ONLY } = require('../middleware/roleMiddleware');

test('Role Middleware: Blocks unauthenticated requests', (t) => {
  const req = {};
  let statusSent = null;
  let jsonSent = null;
  const res = {
    status(code) {
      statusSent = code;
      return this;
    },
    json(data) {
      jsonSent = data;
    }
  };
  let nextCalled = false;
  const next = () => { nextCalled = true; };

  const middleware = requireRole('HEAD_LIBRARIAN');
  middleware(req, res, next);

  assert.strictEqual(statusSent, 401);
  assert.strictEqual(nextCalled, false);
  assert.strictEqual(jsonSent.error, 'Not authenticated');
});

test('Role Middleware: Denies student from librarian routes', (t) => {
  const req = { user: { userId: 'u-123', role: 'STUDENT' } };
  let statusSent = null;
  let jsonSent = null;
  const res = {
    status(code) {
      statusSent = code;
      return this;
    },
    json(data) {
      jsonSent = data;
    }
  };
  let nextCalled = false;
  const next = () => { nextCalled = true; };

  const middleware = requireRole(...LIBRARIAN_ROLES);
  middleware(req, res, next);

  assert.strictEqual(statusSent, 403);
  assert.strictEqual(nextCalled, false);
  assert.match(jsonSent.error, /Access denied/);
});

test('Role Middleware: Denies assistant librarian from head-only routes', (t) => {
  const req = { user: { userId: 'u-456', role: 'ASSISTANT_LIBRARIAN' } };
  let statusSent = null;
  const res = {
    status(code) {
      statusSent = code;
      return this;
    },
    json() {}
  };
  let nextCalled = false;
  const next = () => { nextCalled = true; };

  const middleware = requireRole(...HEAD_ONLY);
  middleware(req, res, next);

  assert.strictEqual(statusSent, 403);
  assert.strictEqual(nextCalled, false);
});

test('Role Middleware: Allows authorized head librarian', (t) => {
  const req = { user: { userId: 'u-789', role: 'HEAD_LIBRARIAN' } };
  const res = { status() { return this; }, json() {} };
  let nextCalled = false;
  const next = () => { nextCalled = true; };

  const middleware = requireRole(...LIBRARIAN_ROLES);
  middleware(req, res, next);

  assert.strictEqual(nextCalled, true);
});

test('Role Middleware: Allows authorized student on student route', (t) => {
  const req = { user: { userId: 'u-999', role: 'STUDENT' } };
  const res = { status() { return this; }, json() {} };
  let nextCalled = false;
  const next = () => { nextCalled = true; };

  const middleware = requireRole(...STUDENT_ONLY);
  middleware(req, res, next);

  assert.strictEqual(nextCalled, true);
});
