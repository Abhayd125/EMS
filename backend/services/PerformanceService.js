const prisma = require('../database/db');
const AppError = require('../utils/AppError');

class PerformanceService {
  async getAllPerformance() {
    const performances = await prisma.performance.findMany({
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            department: {
              select: { name: true }
            }
          }
        }
      },
      orderBy: { evaluationDate: 'desc' }
    });
    return performances;
  }

  async getEmployeePerformance(employeeId) {
    const targetEmpId = parseInt(employeeId);
    if (isNaN(targetEmpId)) {
      throw new AppError('Invalid employee ID', 400);
    }
    const performances = await prisma.performance.findMany({
      where: { employeeId: targetEmpId },
      orderBy: { evaluationDate: 'desc' }
    });
    return performances;
  }

  async createOrUpdatePerformance(employeeId, data) {
    const targetEmpId = parseInt(employeeId);
    if (isNaN(targetEmpId)) {
      throw new AppError('Invalid employee ID', 400);
    }

    const { qualityRating, productivity, communication, comments, evaluationDate } = data;

    if (qualityRating === undefined || productivity === undefined || communication === undefined) {
      throw new AppError('Quality, productivity, and communication ratings are required', 400);
    }

    const parsedQuality = parseFloat(qualityRating);
    const parsedProductivity = parseFloat(productivity);
    const parsedCommunication = parseFloat(communication);

    if (isNaN(parsedQuality) || isNaN(parsedProductivity) || isNaN(parsedCommunication)) {
      throw new AppError('Ratings must be valid numbers', 400);
    }

    if (parsedQuality < 1 || parsedQuality > 5 || 
        parsedProductivity < 1 || parsedProductivity > 5 || 
        parsedCommunication < 1 || parsedCommunication > 5) {
      throw new AppError('Ratings must be between 1.0 and 5.0', 400);
    }

    const overallRating = (parsedQuality + parsedProductivity + parsedCommunication) / 3;

    // Check if employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: targetEmpId }
    });

    if (!employee) {
      throw new AppError('Employee profile not found', 404);
    }

    const performance = await prisma.performance.create({
      data: {
        employeeId: targetEmpId,
        qualityRating: parsedQuality,
        productivity: parsedProductivity,
        communication: parsedCommunication,
        overallRating: parseFloat(overallRating.toFixed(2)),
        comments: comments || '',
        evaluationDate: evaluationDate ? new Date(evaluationDate) : new Date()
      }
    });

    return performance;
  }
}

module.exports = new PerformanceService();
