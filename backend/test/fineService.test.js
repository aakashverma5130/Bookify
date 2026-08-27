const test = require('node:test');
const assert = require('node:assert');
const { calculateFine } = require('../services/fineService');

test('Fine Calculation: Rs. 0 when returned on or before due date', async (t) => {
  const fakeClient = {
    async query(sql, params) {
      const today = new Date();
      const futureDue = new Date(today);
      futureDue.setDate(futureDue.getDate() + 5);

      return {
        rows: [{
          due_date: futureDue.toISOString().slice(0, 10),
          return_date: today.toISOString().slice(0, 10),
          status: 'RETURNED',
          fine_per_day: '2.00'
        }]
      };
    }
  };

  const result = await calculateFine('fake-issue-id', fakeClient);
  assert.strictEqual(result.amount, 0);
  assert.strictEqual(result.overdueDays, 0);
  assert.strictEqual(result.finePerDay, 2.0);
});

test('Fine Calculation: Accurately calculates 5 days overdue at Rs. 2/day', async (t) => {
  const fakeClient = {
    async query(sql, params) {
      const dueDate = new Date('2026-08-01');
      const returnDate = new Date('2026-08-06'); // 5 calendar days overdue

      return {
        rows: [{
          due_date: dueDate.toISOString().slice(0, 10),
          return_date: returnDate.toISOString().slice(0, 10),
          status: 'RETURNED',
          fine_per_day: '2.00'
        }]
      };
    }
  };

  const result = await calculateFine('fake-issue-id', fakeClient);
  assert.strictEqual(result.overdueDays, 5);
  assert.strictEqual(result.amount, 10.00); // 5 * 2.00 = 10.00
});

test('Fine Calculation: Respects custom fine_per_day from library_settings (e.g. Rs. 5/day)', async (t) => {
  const fakeClient = {
    async query(sql, params) {
      const dueDate = new Date('2026-08-01');
      const returnDate = new Date('2026-08-04'); // 3 days overdue

      return {
        rows: [{
          due_date: dueDate.toISOString().slice(0, 10),
          return_date: returnDate.toISOString().slice(0, 10),
          status: 'RETURNED',
          fine_per_day: '5.00'
        }]
      };
    }
  };

  const result = await calculateFine('fake-issue-id', fakeClient);
  assert.strictEqual(result.overdueDays, 3);
  assert.strictEqual(result.amount, 15.00); // 3 * 5.00 = 15.00
});
