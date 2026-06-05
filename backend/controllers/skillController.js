const prisma = require('../database/db');

// Create Skill
const createSkill = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Skill name is required' });
    }

    const exists = await prisma.skill.findUnique({ where: { name } });
    if (exists) {
      return res.status(400).json({ message: 'Skill with this name already exists' });
    }

    const skill = await prisma.skill.create({
      data: { name }
    });

    res.status(201).json({ message: 'Skill created successfully', skill });
  } catch (error) {
    console.error('Create skill error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get All Skills
const getSkills = async (req, res) => {
  try {
    const skills = await prisma.skill.findMany({
      include: {
        _count: {
          select: { employees: true }
        }
      },
      orderBy: { name: 'asc' }
    });
    res.status(200).json({ skills });
  } catch (error) {
    console.error('Get skills error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update Skill
const updateSkill = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const skillId = parseInt(id);
    if (isNaN(skillId)) {
      return res.status(400).json({ message: 'Invalid ID parameter' });
    }

    if (name) {
      const exists = await prisma.skill.findFirst({
        where: {
          name,
          NOT: { id: skillId }
        }
      });
      if (exists) {
        return res.status(400).json({ message: 'Skill with this name already exists' });
      }
    }

    const skill = await prisma.skill.update({
      where: { id: skillId },
      data: { name }
    });

    res.status(200).json({ message: 'Skill updated successfully', skill });
  } catch (error) {
    console.error('Update skill error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete Skill
const deleteSkill = async (req, res) => {
  try {
    const { id } = req.params;
    const skillId = parseInt(id);
    if (isNaN(skillId)) {
      return res.status(400).json({ message: 'Invalid ID parameter' });
    }

    await prisma.skill.delete({
      where: { id: skillId }
    });

    res.status(200).json({ message: 'Skill deleted successfully' });
  } catch (error) {
    console.error('Delete skill error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  createSkill,
  getSkills,
  updateSkill,
  deleteSkill
};
