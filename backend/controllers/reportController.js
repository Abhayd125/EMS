const reportService = require('../services/ReportService');

const getEmployeeReport = async (req, res, next) => {
  try {
    const data = await reportService.getEmployeeReportData(req.query);
    if (req.query.format === 'csv') {
      const csv = reportService.convertToCSV('employees', data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=employees_report.csv');
      return res.status(200).send(csv);
    }
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
};

const getLeaveReport = async (req, res, next) => {
  try {
    const data = await reportService.getLeaveReportData(req.query);
    if (req.query.format === 'csv') {
      const csv = reportService.convertToCSV('leaves', data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=leaves_report.csv');
      return res.status(200).send(csv);
    }
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
};

const getAssetReport = async (req, res, next) => {
  try {
    const data = await reportService.getAssetReportData(req.query);
    if (req.query.format === 'csv') {
      const csv = reportService.convertToCSV('assets', data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=assets_report.csv');
      return res.status(200).send(csv);
    }
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getEmployeeReport,
  getLeaveReport,
  getAssetReport
};
