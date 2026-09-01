const axios = require('axios');
const log = require('../logger');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const TIMEOUT_MS = parseInt(process.env.AI_SERVICE_TIMEOUT_MS) || 5000;

// M-8: service-to-service auth. The backend sends a shared secret in
// the `X-Bookify-Auth` header on every request. The AI service verifies
// the secret in its auth dependency (see ai-service/middleware/auth.py).
const AI_AUTH_TOKEN = process.env.AI_SERVICE_AUTH_TOKEN;

if (!AI_AUTH_TOKEN) {
  log.warn('ai_service_auth_token_missing', {
    remediation: 'Set AI_SERVICE_AUTH_TOKEN to a shared secret matching the AI service',
  });
}

const aiClient = axios.create({
  baseURL: AI_SERVICE_URL,
  timeout: TIMEOUT_MS,
});

// Attach the auth header to every request.
aiClient.interceptors.request.use((config) => {
  if (AI_AUTH_TOKEN) {
    config.headers['X-Bookify-Auth'] = AI_AUTH_TOKEN;
  }
  return config;
});

/**
 * Re-rank search results using the AI service.
 * Falls back to original ordering if the AI service is unavailable.
 *
 * @param {string} query        - The search query string
 * @param {Array}  candidates   - Array of book objects { book_id, title, description }
 * @returns {Promise<string[]>} - Ordered array of book_ids
 */
const rerankSearch = async (query, candidates) => {
  try {
    const response = await aiClient.post('/ai/search', { query, candidates });
    return response.data.ranked_ids;
  } catch (err) {
    log.warn('ai_search_rerank_unavailable', { message: err.message, fallback: 'keyword_order' });
    return candidates.map(c => c.book_id);
  }
};

/**
 * Get personalized book recommendations for a student.
 * Falls back to empty array if AI service unavailable.
 *
 * @param {string} studentId
 * @returns {Promise<Array>} - Array of { book_id, title, reason }
 */
const getRecommendations = async (studentId) => {
  try {
    const response = await aiClient.get(`/ai/recommendations/${studentId}`);
    return response.data.recommendations;
  } catch (err) {
    log.warn('ai_recommendations_unavailable', { message: err.message, fallback: 'empty' });
    return [];
  }
};

/**
 * Trigger demand forecast computation on the AI service.
 * Results are written back to the demand_forecasts table by the AI service.
 */
const triggerDemandForecast = async () => {
  try {
    const response = await aiClient.get('/ai/demand-forecast');
    return response.data;
  } catch (err) {
    log.warn('ai_demand_forecast_unavailable', { message: err.message });
    return null;
  }
};

module.exports = { rerankSearch, getRecommendations, triggerDemandForecast };
