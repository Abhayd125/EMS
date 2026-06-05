const express = require('express');
const router = express.Router();
const {
  getLeaveBalance,
  applyLeave,
  getMyLeaves,
  getPendingApprovals,
  reviewManager,
  reviewHR,
  getLeavesStats
} = require('../controllers/leaveController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

router.use(protect);

/**
 * @swagger
 * /api/leaves/balance:
 *   get:
 *     summary: Retrieve leave balances for the logged-in employee
 *     tags: [Leaves]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Leave balance object containing sick, casual, and paid totals.
 */
router.get('/balance', getLeaveBalance);

/**
 * @swagger
 * /api/leaves/apply:
 *   post:
 *     summary: Submit a new leave request (subtracts balance in transaction)
 *     tags: [Leaves]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - leaveType
 *               - startDate
 *               - endDate
 *               - reason
 *             properties:
 *               leaveType:
 *                 type: string
 *                 enum: [SICK, CASUAL, PAID]
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *               reason:
 *                 type: string
 *     responses:
 *       201:
 *         description: Leave request successfully filed.
 *       400:
 *         description: Insufficient balances or date mismatch.
 */
router.post('/apply', applyLeave);

/**
 * @swagger
 * /api/leaves/my-leaves:
 *   get:
 *     summary: Retrieve leave request history with audit timelines for the logged-in employee
 *     tags: [Leaves]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of personal leave request objects.
 */
router.get('/my-leaves', getMyLeaves);

/**
 * @swagger
 * /api/leaves/approvals:
 *   get:
 *     summary: Fetch pending requests awaiting review (Manager or HR role matching)
 *     tags: [Leaves]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of pending leave requests with join details.
 */
router.get('/approvals', restrictTo('MANAGER', 'HR', 'ADMIN'), getPendingApprovals);

/**
 * @swagger
 * /api/leaves/review/manager/{id}:
 *   put:
 *     summary: Update request status by Manager (rejects or advances to PENDING_HR)
 *     tags: [Leaves]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [APPROVED, REJECTED]
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Request status modified successfully.
 */
router.put('/review/manager/:id', restrictTo('MANAGER', 'ADMIN'), reviewManager);

/**
 * @swagger
 * /api/leaves/review/hr/{id}:
 *   put:
 *     summary: Finalize request status by HR (commits balance deduction in transaction)
 *     tags: [Leaves]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [APPROVED, REJECTED]
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Transaction completed, request approved, balances reduced.
 *       400:
 *         description: Insufficient balances or invalid request ID.
 */
router.put('/review/hr/:id', restrictTo('HR', 'ADMIN'), reviewHR);

/**
 * @swagger
 * /api/leaves/stats:
 *   get:
 *     summary: Aggregate leave request analytics totals (Admin/HR dashboards)
 *     tags: [Leaves]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Counts of pending, approved, and rejected leave types.
 */
router.get('/stats', getLeavesStats);

module.exports = router;
