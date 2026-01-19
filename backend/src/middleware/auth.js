const jwt = require('jsonwebtoken');
const { User } = require('../models');

exports.protect = async (req, res, next) => {
  let token;

  // Vérifier si le token existe dans les headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Non autorisé. Token manquant.'
    });
  }

  try {
    // Vérifier et décoder le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Récupérer l'utilisateur
    req.user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password'] }
    });

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token invalide ou expiré'
    });
  }
};

// Générer un token JWT
exports.generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};