const asyncHandler = require("../../utils/asyncHandler");
const dashboardService = require("./dashboard.service");

exports.getOverview = asyncHandler(async (req, res) => {
  const data = await dashboardService.getDashboardOverview();

  res.status(200).json({
    success: true,
    message: "Dashboard overview fetched successfully.",
    data,
  });
});

exports.getApplicationAnalytics = asyncHandler(async (req, res) => {
  const data = await dashboardService.getApplicationStatusAnalytics();

  res.status(200).json({
    success: true,
    message: "Application analytics fetched successfully.",
    data,
  });
});

exports.exportApplications = asyncHandler(async (req, res) => {
  const csv = await dashboardService.exportApplicationsCsv(req.query);

  const date = new Date().toISOString().slice(0, 10);

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="br30-applications-${date}.csv"`);
  res.setHeader("Cache-Control", "no-store");

  // UTF-8 BOM improves compatibility with Excel.
  res.status(200).send(`\uFEFF${csv}`);
});
