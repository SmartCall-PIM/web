import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

// Intervalo de heartbeat: 30 segundos
const HEARTBEAT_INTERVAL = 30000;

let heartbeatInterval = null;

const heartbeatService = {
  // Inicia o heartbeat periódico
  startHeartbeat: () => {
    // Limpa qualquer interval anterior
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
    }

    // Envia heartbeat imediatamente
    heartbeatService.sendHeartbeat();

    // Configura interval para enviar a cada 30 segundos
    heartbeatInterval = setInterval(() => {
      heartbeatService.sendHeartbeat();
    }, HEARTBEAT_INTERVAL);
  },

  // Envia um heartbeat para o backend
  sendHeartbeat: async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return;
      }

      await axios.post(`${API_URL}/auth/heartbeat`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Heartbeat enviado');
    } catch (error) {
      console.error('Erro ao enviar heartbeat:', error);
      // Se o token for inválido, para o heartbeat
      if (error.response?.status === 401) {
        heartbeatService.stopHeartbeat();
      }
    }
  },

  // Para o heartbeat
  stopHeartbeat: () => {
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      heartbeatInterval = null;
      console.log('Heartbeat parado');
    }
  }
};

export default heartbeatService;
