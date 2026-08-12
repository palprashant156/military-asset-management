import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';

/**
 * POST /api/auth/login
 * Authenticate user and return JWT.
 */
export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user by username
    const user = await prisma.user.findUnique({
      where: { username },
      include: { base: true },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password',
        code: 'INVALID_CREDENTIALS',
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password',
        code: 'INVALID_CREDENTIALS',
      });
    }

    // Generate JWT
    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
        baseId: user.baseId,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          baseId: user.baseId,
          baseName: user.base?.name || null,
        },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
    });
  }
};

/**
 * GET /api/auth/me
 * Return current user's profile from JWT.
 */
export const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        username: true,
        role: true,
        baseId: true,
        base: { select: { id: true, name: true, location: true } },
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        code: 'NOT_FOUND',
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('GetMe error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
    });
  }
};
