const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const adminController = require('../controllers/adminController');

// All routes require admin role
router.use(protect, authorize('admin'));

router.get('/dashboard', adminController.getDashboard);
router.get('/users', adminController.getUsers);
router.put('/users/:id/approve', adminController.approveUser);
router.put('/users/:id/suspend', adminController.suspendUser);
router.put('/users/:id/ban', adminController.banUser);
router.put('/users/:id/restore', adminController.restoreUser);

router.get('/listings', adminController.getListings);
router.put('/listings/:id/approve', adminController.approveListing);
router.put('/listings/:id/reject', adminController.rejectListing);
router.delete('/listings/:id', adminController.deleteListing);

router.get('/transactions', adminController.getTransactions);
router.get('/auditlogs', adminController.getAuditLogs);

module.exports = router;