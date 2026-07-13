const brokerService = require('../services/brokerService');
const { catchAsync } = require('../utils/AppError');

// ── Public ────────────────────────────────────────────────────────────────────
exports.getApprovedBrokers = catchAsync(async (req, res) => {
  const brokers = await brokerService.getApprovedBrokers();
  res.json({ success: true, data: brokers });
});

// ── Authenticated user ────────────────────────────────────────────────────────
exports.applyBroker = catchAsync(async (req, res) => {
  const { paymentMethod, ...applicationData } = req.body;
  const result = await brokerService.applyBroker(req.user.id, applicationData, paymentMethod);
  res.status(201).json({ success: true, data: result });
});

exports.ownerSubmitToBroker = catchAsync(async (req, res) => {
  const { brokerId, ...propertyData } = req.body;
  const house = await brokerService.ownerSubmitToBroker(req.user.id, brokerId, propertyData);
  res.status(201).json({ success: true, data: house });
});

// ── Broker ────────────────────────────────────────────────────────────────────
exports.getMySubmissions = catchAsync(async (req, res) => {
  const { status } = req.query;
  const houses = await brokerService.getBrokerSubmissions(req.user.id, status);
  res.json({ success: true, data: houses });
});

exports.respondToSubmission = catchAsync(async (req, res) => {
  const { action, notes } = req.body;
  const house = await brokerService.brokerRespondToSubmission(
    req.user.id,
    req.params.houseId,
    action,
    notes
  );
  res.json({ success: true, data: house });
});

// ── Admin ─────────────────────────────────────────────────────────────────────
exports.getBrokerApplications = catchAsync(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  const result = await brokerService.getBrokerApplications(
    { status },
    parseInt(page),
    parseInt(limit)
  );
  res.json({ success: true, data: result.applicants, pagination: result.pagination });
});

exports.approveBrokerApplication = catchAsync(async (req, res) => {
  const user = await brokerService.approveBrokerApplication(req.user.id, req.params.userId);
  res.json({ success: true, data: user });
});

exports.rejectBrokerApplication = catchAsync(async (req, res) => {
  const { reason } = req.body;
  const user = await brokerService.rejectBrokerApplication(req.user.id, req.params.userId, reason);
  res.json({ success: true, data: user });
});
