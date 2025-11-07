import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000/api';

class ChatService {
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Envia uma mensagem para o chat e retorna a resposta da IA
   */
  async sendMessage(message) {
    try {
      const response = await this.api.post('/chat/messages/send_message/', {
        message: message,
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      throw error;
    }
  }

  /**
   * Analisa um chamado e retorna a classificação
   */
  async analisarChamado(descricao) {
    try {
      const response = await this.api.post('/chat/messages/analisar_chamado/', {
        descricao: descricao,
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao analisar chamado:', error);
      throw error;
    }
  }

  /**
   * Busca todas as mensagens do chat
   */
  async getMessages() {
    try {
      const response = await this.api.get('/chat/messages/');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
      throw error;
    }
  }
}

export default new ChatService();
