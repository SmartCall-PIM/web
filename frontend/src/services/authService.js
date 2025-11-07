import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000/api';

class AuthService {
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
        const token = this.getToken();
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
        // Não redireciona automaticamente se for erro de login (credenciais incorretas)
        if (error.response?.status === 401 && !error.config.url.includes('/auth/login')) {
          this.logout();
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Registra um novo usuário
   */
  async register(email, password, confirmPassword, fullName = '') {
    try {
      const response = await this.api.post('/auth/register', {
        Email: email,
        Password: password,
        ConfirmPassword: confirmPassword,
        FullName: fullName,
      });

      if (response.data.Success && response.data.Token) {
        this.setToken(response.data.Token);
        this.setUser(response.data.User);
      }

      return response.data;
    } catch (error) {
      console.error('Erro ao registrar:', error);
      throw error.response?.data || error;
    }
  }

  /**
   * Faz login do usuário
   */
  async login(email, password) {
    try {
      const response = await this.api.post('/auth/login', {
        Email: email,
        Password: password,
      });

      if (response.data.Success && response.data.Token) {
        this.setToken(response.data.Token);
        this.setUser(response.data.User);
      }

      return response.data;
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      throw error.response?.data || error;
    }
  }

  /**
   * Faz logout do usuário
   */
  async logout() {
    try {
      await this.api.post('/auth/logout');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
      this.removeToken();
      this.removeUser();
    }
  }

  /**
   * Busca o perfil do usuário autenticado
   */
  async getProfile() {
    try {
      const response = await this.api.get('/auth/profile');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
      throw error;
    }
  }

  /**
   * Renova o token JWT com as informações atualizadas do usuário
   */
  async refreshToken() {
    try {
      const response = await this.api.post('/auth/refresh-token');
      if (response.data.success && response.data.token) {
        this.setToken(response.data.token);
        this.setUser(response.data.user);
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('Erro ao renovar token:', error);
      throw error;
    }
  }

  /**
   * Verifica se o usuário está autenticado
   */
  isAuthenticated() {
    return !!this.getToken();
  }

  /**
   * Obtém o token do localStorage
   */
  getToken() {
    return localStorage.getItem('token');
  }

  /**
   * Busca os dados atualizados do usuário do servidor
   */
  async fetchCurrentUser() {
    try {
      const response = await this.api.get('/auth/me');
      if (response.data) {
        // Atualiza o localStorage com os dados mais recentes
        this.setUser(response.data);
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('Erro ao buscar dados do usuário:', error);
      return null;
    }
  }

  /**
   * Salva o token no localStorage
   */
  setToken(token) {
    localStorage.setItem('token', token);
  }

  /**
   * Remove o token do localStorage
   */
  removeToken() {
    localStorage.removeItem('token');
  }

  /**
   * Obtém os dados do usuário do localStorage
   */
  getUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  /**
   * Salva os dados do usuário no localStorage
   */
  setUser(user) {
    localStorage.setItem('user', JSON.stringify(user));
  }

  /**
   * Remove os dados do usuário do localStorage
   */
  removeUser() {
    localStorage.removeItem('user');
  }

  /**
   * Retorna a instância do axios configurada
   */
  getApi() {
    return this.api;
  }
}

export default new AuthService();
