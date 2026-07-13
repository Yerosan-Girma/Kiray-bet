const adminService = require('../services/adminService');
const { catchAsync } = require('../utils/AppError');

exports.getDashboard = catchAsync(async (req, res) => {
  const stats = await adminService.getDashboardStats();
  res.json({ success: true, data: stats });
});

exports.getUsers = catchAsync(async (req, res) => {
  const { page = 1, limit = 10, ...filters } = req.query;
  const result = await adminService.getUsers(filters, parseInt(page), parseInt(limit));
  res.json({ success: true, data: result.users, pagination: result.pagination });
});

exports.approveUser = catchAsync(async (req, res) => {
  const user = await adminService.approveUser(req.user.id, req.params.id);
  res.json({ success: true, data: user });
});

exports.suspendUser = catchAsync(async (req, res) => {
  const { reason, expiryDate } = req.body;
  const user = await adminService.suspendUser(req.user.id, req.params.id, reason, expiryDate);
  res.json({ success: true, data: user });
});

exports.banUser = catchAsync(async (req, res) => {
  const user = await adminService.banUser(req.user.id, req.params.id);
  res.json({ success: true, data: user });
});

exports.restoreUser = catchAsync(async (req, res) => {
  const user = await adminService.restoreUser(req.user.id, req.params.id);
  res.json({ success: true, data: user });
});

exports.getListings = catchAsync(async (req, res) => {
  const { page = 1, limit = 10, ...filters } = req.query;
  const result = await adminService.getListings(filters, parseInt(page), parseInt(limit));
  res.json({ success: true, data: result.listings, pagination: result.pagination });
});

exports.approveListing = catchAsync(async (req, res) => {
  const listing = await adminService.approveListing(req.user.id, req.params.id);
  res.json({ success: true, data: listing });
});

exports.rejectListing = catchAsync(async (req, res) => {
  const { reason } = req.body;
  const listing = await adminService.rejectListing(req.user.id, req.params.id, reason);
  res.json({ success: true, data: listing });
});

exports.deleteListing = catchAsync(async (req, res) => {
  await adminService.deleteListing(req.user.id, req.params.id);
  res.json({ success: true, message: 'Listing deleted' });
});

exports.getTransactions = catchAsync(async (req, res) => {
  const { page = 1, limit = 10, ...filters } = req.query;
  const result = await adminService.getTransactions(filters, parseInt(page), parseInt(limit));
  res.json({ success: true, data: result.transactions, pagination: result.pagination });
});

exports.getAuditLogs = catchAsync(async (req, res) => {
  const { page = 1, limit = 10, ...filters } = req.query;
  const result = await adminService.getAuditLogs(filters, parseInt(page), parseInt(limit));
  res.json({ success: true, data: result.logs, pagination: result.pagination });
});