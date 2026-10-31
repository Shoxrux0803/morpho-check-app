// src/services/aiService.js
import axios from 'axios';
import { API_BASE, API_PREFIX } from './api';

const API_URL = `${API_BASE}${API_PREFIX}`;

const aiService = {
  chat: async (
    message,
    contextPage,
    history = [],
    contextData = null,
    imageData = null,
    imageMimeType = null,
    lang = 'uz'
  ) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No token found');

    const payload = {
      message,
      context_page: contextPage,
      history,
      context_data: contextData,
    };

    if (imageData && imageMimeType) {
      payload.image_data = imageData;
      payload.image_mime_type = imageMimeType;
    }

    const response = await axios.post(
      `${API_URL}/ai/chat?lang=${lang}`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Accept-Language': lang,
        },
      }
    );
    return response.data;
  },

  predictParams: async (
    age,
    gender,
    targetForm = 'analysis',
    ageMonths = 0,
    ageDays = 0
  ) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No token found');
    const response = await axios.post(
      `${API_URL}/ai/predict-params`,
      {
        age,
        age_months: ageMonths || 0,
        age_days: ageDays || 0,
        gender,
        target_form: targetForm,
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  generateParentTips: async (patientData, mlPredictions, lang = 'uz') => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No token found');
    const response = await axios.post(
      `${API_URL}/ai/generate-parent-tips`,
      { patient_data: patientData, ml_predictions: mlPredictions, lang },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },
};

export default aiService;
