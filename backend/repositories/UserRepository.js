const prisma = require('../database/db');

class UserRepository {
  async findById(id) {
    return prisma.user.findUnique({
      where: { id },
      include: { employee: true }
    });
  }

  async findByEmail(email) {
    return prisma.user.findUnique({
      where: { email },
      include: { employee: true }
    });
  }

  async findByVerificationToken(token) {
    return prisma.user.findFirst({
      where: { verificationToken: token }
    });
  }

  async findByResetToken(token) {
    return prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date()
        }
      }
    });
  }

  async create(data) {
    return prisma.user.create({ data });
  }

  async update(id, data) {
    return prisma.user.update({
      where: { id },
      data
    });
  }

  async count() {
    return prisma.user.count();
  }
}

module.exports = new UserRepository();
