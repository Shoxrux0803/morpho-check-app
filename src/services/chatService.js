// src/services/chatService.js
import axios from 'axios';

const API_BASE_URL =
  process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const chatService = {
  sendMessage: async (
    recipientId,
    content,
    type = 'direct',
    replyToId = null,
    fileUrl = null
  ) => {
    const payload = {
      recipient_id: recipientId,
      content,
      message_type: type,
      reply_to_id: replyToId,
      file_url: fileUrl,
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
    return await axios.post(
      `${API_BASE_URL}/chat/typing`,
      {},
      {
        headers: getAuthHeader(),
      }
    );
  },

  getTypingStatus: async () => {
    if (!localStorage.getItem('token')) {
      return [];
    }
    const response = await axios.get(`${API_BASE_URL}/chat/typing-status`, {
      headers: getAuthHeader(),
    });
    return response.data;
  },

  getMessages: async (messageType = null) => {
    const params = messageType ? { message_type: messageType } : {};
    const response = await axios.get(`${API_BASE_URL}/chat/my-messages`, {
      params,
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

  getHistoryWithUser: async (userId) => {
    const response = await axios.get(`${API_BASE_URL}/chat/history/${userId}`, {
      headers: getAuthHeader(),
    });
    return response.data;
  },

  markAsRead: async (messageId) => {
    const response = await axios.post(
      `${API_BASE_URL}/chat/mark-read/${messageId}`,
      {},
      {
        headers: getAuthHeader(),
      }
    );
    return response.data;
  },

  markAllRead: async () => {
    const response = await axios.post(
      `${API_BASE_URL}/chat/mark-all-read`,
      {},
      {
        headers: getAuthHeader(),
      }
    );
    return response.data;
  },

  markUserMessagesRead: async (userId) => {
    const response = await axios.post(
      `${API_BASE_URL}/chat/mark-read/user/${userId}`,
      {},
      {
        headers: getAuthHeader(),
      }
    );
    return response.data;
  },

  reactToMessage: async (messageId, reaction) => {
    const response = await axios.post(
      `${API_BASE_URL}/chat/react/${messageId}`,
      { reaction },
      {
        headers: getAuthHeader(),
      }
    );
    return response.data;
  },

  getUsersForSuperadmin: async () => {
    const response = await axios.get(`${API_BASE_URL}/admin/users`, {
      params: { page_size: 100 },
      headers: getAuthHeader(),
    });
    return response.data;
  },

  editMessage: async (messageId, content) => {
    const response = await axios.put(
      `${API_BASE_URL}/chat/message/${messageId}`,
      { content },
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  deleteMessage: async (messageId) => {
    const response = await axios.delete(
      `${API_BASE_URL}/chat/message/${messageId}`,
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  getMonitoringPairs: async () => {
    const response = await axios.get(`${API_BASE_URL}/chat/monitoring/pairs`, {
      headers: getAuthHeader(),
    });
    return response.data;
  },

  getMonitoringHistory: async (adminId, assistantId) => {
    const response = await axios.get(
      `${API_BASE_URL}/chat/monitoring/history/${adminId}/${assistantId}`,
      { headers: getAuthHeader() }
    );
    return response.data;
  },
};
