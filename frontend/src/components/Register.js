import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authService from '../services/authService';
import '../styles/auth.css';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const validateField = (name, value, errorsObj = null) => {
    const errors = errorsObj || { ...fieldErrors };

    switch (name) {
      case 'fullName':
        if (!value) {
          errors.fullName = 'Nome completo é obrigatório';
        } else if (value.trim().split(' ').length < 2) {
          errors.fullName = 'Informe nome e sobrenome';
        } else {
          delete errors.fullName;
        }
        break;
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
        // Revalida confirmPassword se já foi preenchida
        if (formData.confirmPassword && !errorsObj) {
          if (value !== formData.confirmPassword) {
            errors.confirmPassword = 'As senhas não coincidem';
          } else {
            delete errors.confirmPassword;
          }
        }
        break;
      case 'confirmPassword':
        if (!value) {
          errors.confirmPassword = 'Confirme sua senha';
        } else if (value !== formData.password) {
          errors.confirmPassword = 'As senhas não coincidem';
        } else {
          delete errors.confirmPassword;
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
    errors = validateField('fullName', formData.fullName, errors);
    errors = validateField('email', formData.email, errors);
    errors = validateField('password', formData.password, errors);
    errors = validateField('confirmPassword', formData.confirmPassword, errors);

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      setError('Por favor, corrija os erros antes de continuar');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await authService.register(
        formData.email,
        formData.password,
        formData.confirmPassword,
        formData.fullName
      );

      if (response.Success) {
        navigate('/chamados');
      } else {
        setError(response.Message || 'Erro ao registrar');
      }
    } catch (err) {
      console.log('Status do erro:', err.response?.status);
      console.log('Dados do erro:', err.response?.data);
      
      const status = err.response?.status;
      const errorData = err.response?.data;
      const errorMessage = errorData?.Message || errorData?.message || '';
      const errorList = errorData?.Errors || [];
      
      // Verifica se o erro é relacionado a email duplicado
      const isEmailDuplicate = 
        errorMessage?.toLowerCase().includes('cadastrado') ||
        errorMessage?.toLowerCase().includes('já está em uso') ||
        errorMessage?.toLowerCase().includes('email já') ||
        errorList.some(e => e?.toLowerCase().includes('email') && e?.toLowerCase().includes('uso'));
      
      if (isEmailDuplicate) {
        setFieldErrors({ email: 'Este email já está cadastrado' });
        setError('Este email já está em uso. Tente fazer login ou use outro email.');
      } else if (errorMessage?.toLowerCase().includes('senha') || 
                 errorMessage?.toLowerCase().includes('password')) {
        setFieldErrors({ password: errorMessage });
        setError(errorMessage || 'Erro na senha. Verifique os requisitos.');
      } else if (status === 500) {
        setError('Erro no servidor. Tente novamente mais tarde.');
      } else if (errorMessage) {
        setError(errorMessage);
      } else {
        setError('Erro ao criar conta. Verifique sua conexão e tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>SmartCall</h2>
        <p className="auth-subtitle">Crie sua conta</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="fullName">Nome Completo</label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              onBlur={handleBlur}
              className={fieldErrors.fullName ? 'input-error' : ''}
              placeholder="Seu nome"
              disabled={loading}
            />
            {fieldErrors.fullName && (
              <div className="field-error">{fieldErrors.fullName}</div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="email">Email *</label>
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
            <label htmlFor="password">Senha *</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              onBlur={handleBlur}
              className={fieldErrors.password ? 'input-error' : ''}
              placeholder="Mínimo 6 caracteres"
              disabled={loading}
            />
            {fieldErrors.password && (
              <div className="field-error">{fieldErrors.password}</div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirmar Senha *</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              onBlur={handleBlur}
              className={fieldErrors.confirmPassword ? 'input-error' : ''}
              placeholder="Digite a senha novamente"
              disabled={loading}
            />
            {fieldErrors.confirmPassword && (
              <div className="field-error">{fieldErrors.confirmPassword}</div>
            )}
          </div>

          <button type="submit" className="btn-primary" disabled={loading || Object.keys(fieldErrors).length > 0}>
            {loading ? 'Registrando...' : 'Registrar'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Já tem uma conta? <Link to="/login">Faça login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
