import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authService from '../services/authService';
import '../styles/auth.css';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const validateField = (name, value, errorsObj = null) => {
    const errors = errorsObj || { ...fieldErrors };

    switch (name) {
      case 'email':
        if (!value) {
          errors.email = 'Email é obrigatório';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errors.email = 'Email inválido';
        } else {
          delete errors.email;
        }
        break;
      case 'password':
        if (!value) {
          errors.password = 'Senha é obrigatória';
        } else if (value.length < 6) {
          errors.password = 'Senha deve ter no mínimo 6 caracteres';
        } else {
          delete errors.password;
        }
        break;
      default:
        break;
    }

    if (!errorsObj) {
      setFieldErrors(errors);
    }
    return errors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    validateField(name, value);
    setError('');
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    validateField(name, value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Valida todos os campos
    let errors = {};
    errors = validateField('email', formData.email, errors);
    errors = validateField('password', formData.password, errors);

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      setError('Por favor, corrija os erros antes de continuar');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await authService.login(formData.email, formData.password);
      
      if (response.Success) {
        navigate('/chamados');
      } else {
        setError(response.Message || 'Credenciais inválidas');
      }
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Email ou senha incorretos');
      } else if (err.response?.status === 400) {
        setError(err.response.data?.Message || 'Dados inválidos');
      } else {
        setError('Email ou senha incorretos');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>SmartCall</h2>
        <p className="auth-subtitle">Faça login para continuar</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              className={fieldErrors.email ? 'input-error' : ''}
              placeholder="Insira seu email"
              disabled={loading}
            />
            {fieldErrors.email && (
              <div className="field-error">{fieldErrors.email}</div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">Senha</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              onBlur={handleBlur}
              className={fieldErrors.password ? 'input-error' : ''}
              placeholder="Insira sua senha"
              disabled={loading}
            />
            {fieldErrors.password && (
              <div className="field-error">{fieldErrors.password}</div>
            )}
          </div>

          <button type="submit" className="btn-primary" disabled={loading || Object.keys(fieldErrors).length > 0}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Não tem uma conta? <Link to="/register">Registre-se</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
