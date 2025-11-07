import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000/api';

function Configuracoes() {
  const [usuario, setUsuario] = useState(null);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  
  // Estados separados para cada seção
  const [mensagemPerfil, setMensagemPerfil] = useState('');
  const [erroPerfil, setErroPerfil] = useState('');
  const [mensagemSenha, setMensagemSenha] = useState('');
  const [erroSenha, setErroSenha] = useState('');
  
  const [carregando, setCarregando] = useState(false);
  const [salvandoPerfil, setSalvandoPerfil] = useState(false);

  useEffect(() => {
    carregarDadosUsuario();
  }, []);

  const carregarDadosUsuario = async () => {
    console.log('Carregando dados do usuário...');
    console.log('API_BASE_URL:', API_BASE_URL);
    
    try {
      const token = localStorage.getItem('token');
      console.log('Token:', token ? 'presente' : 'ausente');
      
      if (!token) {
        // Se não tem token, tenta pegar do localStorage
        const userDataString = localStorage.getItem('user');
        console.log('User no localStorage:', userDataString);
        
        if (userDataString) {
          const userData = JSON.parse(userDataString);
          setUsuario(userData);
          setNome(userData.fullName || userData.FullName || '');
          setEmail(userData.email || userData.Email || '');
          return;
        }
        setErro('Usuário não autenticado');
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Resposta da API:', response.data);
      setUsuario(response.data);
      setNome(response.data.fullName || response.data.FullName || '');
      setEmail(response.data.email || response.data.Email || '');
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
      console.error('Detalhes do erro:', error.response?.data);
      
      // Fallback: tenta pegar do localStorage
      const userDataString = localStorage.getItem('user');
      if (userDataString) {
        const userData = JSON.parse(userDataString);
        console.log('Usando dados do localStorage:', userData);
        setUsuario(userData);
        setNome(userData.fullName || userData.FullName || '');
        setEmail(userData.email || userData.Email || '');
      } else {
        setErroPerfil('Erro ao carregar dados do usuário. Por favor, faça login novamente.');
      }
    }
  };

  const handleSalvarPerfil = async (e) => {
    e.preventDefault();
    setMensagemPerfil('');
    setErroPerfil('');

    if (!nome || !email) {
      setErroPerfil('Preencha todos os campos');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErroPerfil('Email inválido');
      return;
    }

    setSalvandoPerfil(true);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API_BASE_URL}/auth/update-profile`,
        {
          fullName: nome,
          email: email
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setUsuario(response.data);
      setMensagemPerfil('Informações atualizadas com sucesso!');
      
      // Atualiza localStorage
      const userData = {
        ...JSON.parse(localStorage.getItem('user') || '{}'),
        fullName: nome,
        FullName: nome,
        email: email,
        Email: email
      };
      localStorage.setItem('user', JSON.stringify(userData));

      // Dispara evento para atualizar sidebar
      window.dispatchEvent(new Event('profileUpdated'));
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      setErroPerfil(error.response?.data?.message || 'Erro ao atualizar informações.');
    } finally {
      setSalvandoPerfil(false);
    }
  };

  const handleAlterarSenha = async (e) => {
    e.preventDefault();
    setMensagemSenha('');
    setErroSenha('');

    // Validações
    if (!senhaAtual || !novaSenha || !confirmarSenha) {
      setErroSenha('Preencha todos os campos');
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setErroSenha('As senhas não conferem');
      return;
    }

    if (novaSenha.length < 6) {
      setErroSenha('A nova senha deve ter no mínimo 6 caracteres');
      return;
    }

    setCarregando(true);

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_BASE_URL}/auth/change-password`,
        {
          senhaAtual,
          novaSenha
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setMensagemSenha('Senha alterada com sucesso!');
      setSenhaAtual('');
      setNovaSenha('');
      setConfirmarSenha('');
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      setErroSenha(error.response?.data?.message || 'Erro ao alterar senha. Verifique a senha atual.');
    } finally {
      setCarregando(false);
    }
  };

  if (!usuario && !erroPerfil) {
    return (
      <div className="configuracoes-container">
        <div className="loading">Carregando...</div>
      </div>
    );
  }

  if (erroPerfil && !usuario) {
    return (
      <div className="configuracoes-container">
        <div className="configuracoes-content">
          <div className="alert alert-error">
            {erroPerfil}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="configuracoes-container">
      <div className="configuracoes-content">
        {/* Seção de Informações Pessoais */}
        <div className="config-section">
          <h2>Informações Pessoais</h2>
          
          {mensagemPerfil && (
            <div className="alert alert-success">
              {mensagemPerfil}
            </div>
          )}

          {erroPerfil && (
            <div className="alert alert-error">
              {erroPerfil}
            </div>
          )}

          <div className="info-card">
            <form onSubmit={handleSalvarPerfil}>
              <div className="form-group">
                <label>Nome Completo</label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Digite seu nome completo"
                  disabled={salvandoPerfil}
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Digite seu email"
                  disabled={salvandoPerfil}
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={salvandoPerfil}
              >
                {salvandoPerfil ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </form>
          </div>
        </div>

        {/* Seção de Alteração de Senha */}
        <div className="config-section">
          <h2>Segurança</h2>
          <div className="senha-card">
            <h3>Alterar Senha</h3>
            
            {mensagemSenha && (
              <div className="alert alert-success">
                {mensagemSenha}
              </div>
            )}

            {erroSenha && (
              <div className="alert alert-error">
                {erroSenha}
              </div>
            )}

            <form onSubmit={handleAlterarSenha}>
              <div className="form-group">
                <label>Senha Atual</label>
                <input
                  type="password"
                  value={senhaAtual}
                  onChange={(e) => setSenhaAtual(e.target.value)}
                  placeholder="Digite sua senha atual"
                  disabled={carregando}
                />
              </div>

              <div className="form-group">
                <label>Nova Senha</label>
                <input
                  type="password"
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  placeholder="Digite a nova senha (mínimo 6 caracteres)"
                  disabled={carregando}
                />
              </div>

              <div className="form-group">
                <label>Confirmar Nova Senha</label>
                <input
                  type="password"
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  placeholder="Confirme a nova senha"
                  disabled={carregando}
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={carregando}
              >
                {carregando ? 'Alterando...' : 'Alterar Senha'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Configuracoes;
