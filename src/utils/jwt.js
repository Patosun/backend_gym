const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m'; // Access token corto
const REFRESH_JWT_SECRET = process.env.REFRESH_JWT_SECRET || process.env.JWT_SECRET + '_refresh';
const REFRESH_JWT_EXPIRES_IN = process.env.REFRESH_JWT_EXPIRES_IN || '7d'; // Refresh token largo

/**
 * Generar access token JWT (corta duración)
 * @param {Object} payload - Datos a incluir en el token
 * @returns {String} Access token JWT
 */
const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

/**
 * Generar refresh token JWT (larga duración)
 * @param {Object} payload - Datos a incluir en el refresh token
 * @returns {String} Refresh token JWT
 */
const generateRefreshToken = (payload) => {
  return jwt.sign(payload, REFRESH_JWT_SECRET, { expiresIn: REFRESH_JWT_EXPIRES_IN });
};

/**
 * Generar par de tokens (access + refresh)
 * @param {Object} payload - Datos del usuario
 * @returns {Object} { accessToken, refreshToken }
 */
const generateTokenPair = (payload) => {
  const accessToken = generateToken(payload);
  const refreshToken = generateRefreshToken({ 
    userId: payload.userId, 
    email: payload.email,
    tokenType: 'refresh'
  });
  
  return { accessToken, refreshToken };
};

/**
 * Verificar access token JWT
 * @param {String} token - Token a verificar
 * @returns {Object} Payload decodificado
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expirado');
    }
    throw new Error('Token inválido');
  }
};

/**
 * Verificar refresh token JWT
 * @param {String} refreshToken - Refresh token a verificar
 * @returns {Object} Payload decodificado
 */
const verifyRefreshToken = (refreshToken) => {
  try {
    return jwt.verify(refreshToken, REFRESH_JWT_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Refresh token expirado');
    }
    throw new Error('Refresh token inválido');
  }
};

/**
 * Decodificar token sin verificar
 * @param {String} token - Token a decodificar
 * @returns {Object} Payload decodificado
 */
const decodeToken = (token) => {
  return jwt.decode(token);
};

/**
 * Verificar si el token ha expirado
 * @param {String} token - Token a verificar
 * @returns {Boolean} True si ha expirado
 */
const isTokenExpired = (token) => {
  try {
    const decoded = jwt.decode(token);
    const currentTime = Date.now() / 1000;
    return decoded.exp < currentTime;
  } catch (error) {
    return true;
  }
};

/**
 * Extraer información del token sin verificar firma
 * @param {String} token - Token a analizar
 * @returns {Object|null} Información del token o null si es inválido
 */
const getTokenInfo = (token) => {
  try {
    const decoded = jwt.decode(token);
    if (!decoded) return null;
    
    const currentTime = Date.now() / 1000;
    const isExpired = decoded.exp < currentTime;
    const timeUntilExpiry = decoded.exp - currentTime;
    
    return {
      payload: decoded,
      isExpired,
      expiresAt: new Date(decoded.exp * 1000),
      timeUntilExpiry: Math.max(0, timeUntilExpiry)
    };
  } catch (error) {
    return null;
  }
};

module.exports = {
  generateToken,
  generateRefreshToken,
  generateTokenPair,
  verifyToken,
  verifyRefreshToken,
  decodeToken,
  isTokenExpired,
  getTokenInfo
};