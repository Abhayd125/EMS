const express = require('express');
const router = express.Router();
const prisma = require('../../database/db');

router.get('/', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: 'UP',
      timestamp: new Date(),
      services: {
        database: 'UP',
        uptime: process.uptime()
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'DOWN',
      timestamp: new Date(),
      services: {
        database: 'DOWN',
        error: error.message
      }
    });
  }
});

module.exports = router;
