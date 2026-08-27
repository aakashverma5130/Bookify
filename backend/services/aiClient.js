const axios = require('axios');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const TIMEOUT_MS = parseInt(process.env.AI_SERVICE_TIMEOUT_MS) || 5000;

const aiClient = axios.create({
  baseURL: AI_SERVICE_URL,
  timeout: TIMEOUT_MS,
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
    console.warn(`[AI] Search re-rank unavailable (${err.message}). Using keyword order.`);
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
    console.warn(`[AI] Recommendations unavailable (${err.message}). Returning empty.`);
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
    console.warn(`[AI] Demand forecast unavailable (${err.message}).`);
    return null;
  }
};

module.exports = { rerankSearch, getRecommendations, triggerDemandForecast };
