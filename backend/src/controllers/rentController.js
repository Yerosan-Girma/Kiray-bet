const rentService = require('../services/rentService');
const { catchAsync } = require('../utils/AppError');

// ── Search tenant by email (Broker / Admin only) ─────────────────────────────
exports.searchTenant = catchAsync(async (req, res) => {
  const { email } = req.query;
  const tenant = await rentService.searchTenant(email);
  res.json({ success: true, data: tenant });
});

// ── Get inquirers for a house (Broker / Admin only) ──────────────────────────
exports.getHouseInquirers = catchAsync(async (req, res) => {
  const { houseId } = req.params;
  const inquirers = await rentService.getHouseInquirers(houseId);
  res.json({ success: true, data: inquirers });
});

// ── Create rental agreement (Broker only) ───────────────────────────────────
exports.createRentalAgreement = catchAsync(async (req, res) => {
  const { houseId, tenantId, ...rentalData } = req.body;
  const rent = await rentService.createRentalAgreement(
    req.user.id,
    houseId,
    tenantId,
    rentalData
  );
  res.status(201).json({ success: true, data: rent });
});

// ── Get rentals for the authenticated user ───────────────────────────────────
exports.getMyRentals = catchAsync(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const result = await rentService.getRentalsForUser(
    req.user.id,
    req.user.role,
    parseInt(page, 10),
    parseInt(limit, 10)
  );
  res.json({ success: true, data: result.rentals, pagination: result.pagination });
});

// ── Get single rental by ID ───────────────────────────────────────────────────
exports.getRentalById = catchAsync(async (req, res) => {
  const rent = await rentService.getRentalById(req.params.id, req.user.id, req.user.role);
  res.json({ success: true, data: rent });
});

// ── Update rental status (terminate/complete) ────────────────────────────────
exports.updateRentalStatus = catchAsync(async (req, res) => {
  const { status, terminationReason } = req.body;
  const rent = await rentService.updateRentalStatus(
    req.params.id,
    req.user.id,
    req.user.role,
    status,
    terminationReason
  );
  res.json({ success: true, data: rent });
});

// ── Add payment record to rental ────────────────────────────────────────────
exports.addPaymentRecord = catchAsync(async (req, res) => {
  const rent = await rentService.addPaymentRecord(
    req.params.id,
    req.user.id,
    req.user.role,
    req.body
  );
  res.json({ success: true, data: rent });
});
