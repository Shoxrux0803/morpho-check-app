// src/services/aiService.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const aiService = {
  chat: async (
    message,
    contextPage,
    history = [],
    contextData = null,
    imageData = null,
    imageMimeType = null
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

    const response = await axios.post(`${API_URL}/ai/chat`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  predictParams: async (age, gender, targetForm = 'analysis') => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No token found');
    const response = await axios.post(
      `${API_URL}/ai/predict-params`,
      { age, gender, target_form: targetForm },
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
