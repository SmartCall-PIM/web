import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000/api';

class ChamadoService {
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptor para adicionar token em todas as requisições
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Interceptor para tratar erro 401 (não autenticado)
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Lista todos os chamados
   */
  async listarChamados() {
    try {
      const response = await this.api.get('/chamados');
      return response.data;
    } catch (error) {
      console.error('Erro ao listar chamados:', error);
      throw error;
    }
  }

  /**
   * Busca um chamado específico com todas as mensagens
   */
  async buscarChamado(id) {
    try {
      const response = await this.api.get(`/chamados/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar chamado:', error);
      throw error;
    }
  }

  /**
   * Cria um novo chamado
   * Agora requer apenas a descrição do problema
   * Os dados do usuário (nome, email) são extraídos do token JWT no backend
   */
  async criarChamado(mensagemInicial) {
    try {
      const response = await this.api.post('/chamados', {
        MensagemInicial: mensagemInicial
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao criar chamado:', error);
      throw error;
    }
  }

  /**
   * Adiciona uma mensagem a um chamado existente
   */
  async enviarMensagem(chamadoId, mensagem) {
    try {
      const response = await this.api.post(`/chamados/${chamadoId}/mensagens`, {
        Message: mensagem
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      throw error;
    }
  }

  /**
   * Atualiza o status de um chamado
   */
  async atualizarStatus(chamadoId, status) {
    try {
      const response = await this.api.patch(`/chamados/${chamadoId}/status`, 
        JSON.stringify(status),
        {
          headers: { 'Content-Type': 'application/json' }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      throw error;
    }
  }

  /**
   * Escala o chamado para um técnico
   */
  async escalarParaTecnico(chamadoId) {
    try {
      const response = await this.api.post(`/chamados/${chamadoId}/escalar`);
      return response.data;
    } catch (error) {
      console.error('Erro ao escalar chamado:', error);
      throw error;
    }
  }

  /**
   * Lista chamados atribuídos ao técnico logado
   */
  async listarChamadosTecnico() {
    try {
      const response = await this.api.get('/chamados/tecnico/meus-chamados');
      return response.data;
    } catch (error) {
      console.error('Erro ao listar chamados do técnico:', error);
      throw error;
    }
  }

  /**
   * Busca novas mensagens de um chamado após um determinado ID
   */
  async buscarNovasMensagens(chamadoId, afterId) {
    try {
      const params = afterId ? { afterId } : {};
      const response = await this.api.get(`/chamados/${chamadoId}/mensagens/novas`, { params });
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar novas mensagens:', error);
      return [];
    }
  }

  /**
   * Atualiza o status de digitação do usuário
   */
  async atualizarStatusDigitacao(chamadoId, isTyping) {
    try {
      await this.api.post(`/chamados/${chamadoId}/typing`, { IsTyping: isTyping });
    } catch (error) {
      console.error('Erro ao atualizar status de digitação:', error);
      // Não lança erro para não atrapalhar a experiência do usuário
    }
  }

  /**
   * Obtém os usuários que estão digitando
   */
  async obterUsuariosDigitando(chamadoId) {
    try {
      const response = await this.api.get(`/chamados/${chamadoId}/typing`);
      return response.data;
    } catch (error) {
      console.error('Erro ao obter usuários digitando:', error);
      return [];
    }
  }

  /**
   * Lista TODOS os chamados do sistema (apenas para técnicos e administradores)
   */
  async listarTodosChamados() {
    try {
      const response = await this.api.get('/chamados/relatorio/todos');
      return response.data;
    } catch (error) {
      console.error('Erro ao listar todos os chamados:', error);
      throw error;
    }
  }

  /**
   * Marca um chamado como resolvido (apenas técnicos/admins)
   */
  async marcarComoResolvido(chamadoId) {
    try {
      const response = await this.api.post(`/chamados/${chamadoId}/resolver`);
      return response.data;
    } catch (error) {
      console.error('Erro ao marcar chamado como resolvido:', error);
      throw error;
    }
  }
}

export default new ChamadoService();