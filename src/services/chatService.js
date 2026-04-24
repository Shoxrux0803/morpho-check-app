// src/services/chatService.js
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const chatService = {
  sendMessage: async (recipientId, content, type = 'direct', replyToId = null, fileUrl = null) => {
    const payload = { 
      recipient_id: recipientId, 
      content, 
      message_type: type,
      reply_to_id: replyToId,
      file_url: fileUrl
    };
    const response = await axios.post(`${API_BASE_URL}/chat/send`, payload, {
      headers: getAuthHeader(),
    });
    return response.data;
  },

  uploadFile: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axios.post(`${API_BASE_URL}/chat/upload`, formData, {
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  sendTypingStatus: async () => {
    return await axios.post(`${API_BASE_URL}/chat/typing`, {}, {
      headers: getAuthHeader(),
    });
  },

  getTypingStatus: async () => {
    const response = await axios.get(`${API_BASE_URL}/chat/typing-status`, {
      headers: getAuthHeader(),
    });
    return response.data;
  },

  getMessages: async () => {
    const response = await axios.get(`${API_BASE_URL}/chat/my-messages`, {
      headers: getAuthHeader(),
    });
    return response.data;
  },

  getSuperadminConversations: async () => {
    const response = await axios.get(`${API_BASE_URL}/chat/conversations`, {
      headers: getAuthHeader(),
    });
    return response.data;
  },

  markAsRead: async (messageId) => {
    const response = await axios.post(`${API_BASE_URL}/chat/mark-read/${messageId}`, {}, {
      headers: getAuthHeader(),
    });
    return response.data;
  },
  
  markAllRead: async () => {
    const response = await axios.post(`${API_BASE_URL}/chat/mark-all-read`, {}, {
      headers: getAuthHeader(),
    });
    return response.data;
  },

  getUsersForSuperadmin: async () => {
    const response = await axios.get(`${API_BASE_URL}/admin/users`, {
      params: { page_size: 100 },
      headers: getAuthHeader(),
    });
    return response.data;
  }
};
