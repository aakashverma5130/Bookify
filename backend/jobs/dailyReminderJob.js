const db = require('../config/db');
const notificationService = require('../services/notificationService');

/**
 * Daily reminder job — runs at 08:00 every day via node-cron.
 * Queries issues due in 7/3/1/0 days + all overdue, creates notifications.
 */
const dailyReminderJob = async () => {
  console.log('[REMINDER] Starting daily reminder job...');
  let notifCount = 0;

  try {
    // Issues due in 7, 3, 1 day or today
    const upcomingResult = await db.query(
      `SELECT i.issue_id, i.student_id, i.due_date,
              b.title AS book_title,
              u.user_id, u.name AS student_name,
              (i.due_date - CURRENT_DATE) AS days_remaining
       FROM issues i
       JOIN book_copies bc ON bc.copy_id   = i.copy_id
       JOIN books b        ON b.book_id    = bc.book_id
       JOIN students s     ON s.student_id = i.student_id
       JOIN users u        ON u.user_id    = s.user_id
       WHERE i.status = 'ISSUED'
         AND (i.due_date - CURRENT_DATE) IN (7, 3, 1, 0)`
    );

    for (const row of upcomingResult.rows) {
      const daysText = row.days_remaining === 0
        ? 'today'
        : `in ${row.days_remaining} day${row.days_remaining === 1 ? '' : 's'}`;

      await notificationService.createNotification({
        userId:  row.user_id,
        type:    'DUE_REMINDER',
        title:   `Book Due ${row.days_remaining === 0 ? 'Today' : `in ${row.days_remaining} Day${row.days_remaining === 1 ? '' : 's'}`}`,
        message: `"${row.book_title}" is due ${daysText} (${row.due_date}). Please return it on time to avoid fines.`,
        metadata: { issueId: row.issue_id, daysRemaining: row.days_remaining },
      });
      notifCount++;
    }

    // Overdue issues
    const overdueResult = await db.query(
      `SELECT i.issue_id, i.student_id, i.due_date,
              b.title AS book_title,
              u.user_id, u.name AS student_name,
              (CURRENT_DATE - i.due_date) AS overdue_days
       FROM issues i
       JOIN book_copies bc ON bc.copy_id   = i.copy_id
       JOIN books b        ON b.book_id    = bc.book_id
       JOIN students s     ON s.student_id = i.student_id
       JOIN users u        ON u.user_id    = s.user_id
       WHERE (i.status = 'OVERDUE' OR (i.status = 'ISSUED' AND i.due_date < CURRENT_DATE))`
    );

    // Update status to OVERDUE for any ISSUED issues that are past due
    await db.query(
      `UPDATE issues SET status = 'OVERDUE', updated_at = NOW()
       WHERE status = 'ISSUED' AND due_date < CURRENT_DATE`
    );

    for (const row of overdueResult.rows) {
      await notificationService.createNotification({
        userId:  row.user_id,
        type:    'OVERDUE',
        title:   `Book Overdue — ${row.overdue_days} Day${row.overdue_days === 1 ? '' : 's'} Late`,
        message: `"${row.book_title}" is ${row.overdue_days} day${row.overdue_days === 1 ? '' : 's'} overdue. Fine accumulating at Rs. 2/day. Please return immediately.`,
        metadata: { issueId: row.issue_id, overdueDays: row.overdue_days },
      });
      notifCount++;
    }

    console.log(`[REMINDER] Done — ${notifCount} notifications sent.`);
  } catch (err) {
    console.error('[REMINDER] Job error:', err.message);
    throw err;
  }
};

module.exports = { dailyReminderJob };
