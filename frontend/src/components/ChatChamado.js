import React, { useState, useEffect, useRef } from 'react';
import ChatMessage from './ChatMessage';
import ChatComposer from './ChatComposer';
import ConfirmarResolucaoModal from './ConfirmarResolucaoModal';
import chamadoService from '../services/chamadoService';

function ChatChamado({ chamado, onAtualizarChamado, isTecnico = false }) {
  const [mensagens, setMensagens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [resolvendoChamado, setResolvendoChamado] = useState(false);
  const [mostrarModalResolucao, setMostrarModalResolucao] = useState(false);
  const typingTimeoutRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Função para scroll automático
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Carrega mensagens iniciais
  useEffect(() => {
    if (chamado && chamado.Mensagens) {
      setMensagens(chamado.Mensagens.map(m => ({
        text: m.Message,
        isUser: m.IsUser,
        senderType: m.SenderType,
        id: m.Id,
        createdAt: m.CreatedAt
      })));
    }
  }, [chamado]);

  // Scroll automático quando mensagens mudam
  useEffect(() => {
    scrollToBottom();
  }, [mensagens]);

  // Polling para novas mensagens e status de digitação
  useEffect(() => {
    if (!chamado) return;

    const checkUpdates = async () => {
      try {
        // Pega o ID da última mensagem que temos
        const lastMessageId = mensagens.length > 0 
          ? Math.max(...mensagens.map(m => m.id))
          : 0;

        // Busca mensagens com ID maior
        const novasMensagens = await chamadoService.buscarNovasMensagens(
          chamado.Id,
          lastMessageId
        );

        if (novasMensagens && novasMensagens.length > 0) {
          setMensagens(prev => [
            ...prev,
            ...novasMensagens.map(m => ({
              text: m.Message,
              isUser: m.IsUser,
              senderType: m.SenderType,
              id: m.Id,
              createdAt: m.CreatedAt
            }))
          ]);

          // Atualiza o chamado na lista
          if (onAtualizarChamado) {
            onAtualizarChamado();
          }
        }

        // Busca status de digitação
        const usuariosDigitando = await chamadoService.obterUsuariosDigitando(chamado.Id);
        if (Array.isArray(usuariosDigitando)) {
          setTypingUsers(usuariosDigitando);
        }
      } catch (error) {
        console.error('Erro ao verificar atualizações:', error);
      }
    };

    // Executa primeira verificação após 1 segundo
    const timeoutId = setTimeout(checkUpdates, 1000);

    // Polling a cada 2 segundos
    pollIntervalRef.current = setInterval(checkUpdates, 2000);

    // Limpa o intervalo ao desmontar
    return () => {
      clearTimeout(timeoutId);
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [chamado, mensagens, onAtualizarChamado]);

  // Limpa status de digitação ao desmontar
  useEffect(() => {
    return () => {
      if (chamado && isTyping) {
        chamadoService.atualizarStatusDigitacao(chamado.Id, false);
      }
    };
  }, [chamado, isTyping]);

  const handleTyping = async (typing) => {
    if (!chamado) return;

    setIsTyping(typing);

    // Notifica o servidor sobre o status de digitação
    await chamadoService.atualizarStatusDigitacao(chamado.Id, typing);

    // Se começou a digitar, configura timeout para limpar status
    if (typing) {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(async () => {
        setIsTyping(false);
        await chamadoService.atualizarStatusDigitacao(chamado.Id, false);
      }, 3000); // Para de mostrar "digitando" após 3 segundos sem atividade
    }
  };

  const handleSendMessage = async (message) => {
    if (!chamado) return;

    // Limpa status de digitação
    if (isTyping) {
      setIsTyping(false);
      await chamadoService.atualizarStatusDigitacao(chamado.Id, false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }

    // Se o chamado está resolvido, volta para "Em Andamento"
    if (chamado.Status === 'Resolvido') {
      try {
        await chamadoService.atualizarStatus(chamado.Id, 'Em Andamento');
        chamado.Status = 'Em Andamento';
      } catch (error) {
        console.error('Erro ao reabrir chamado:', error);
      }
    }

    // Adiciona mensagem do usuário IMEDIATAMENTE (antes de enviar ao backend)
    const tempUserMessage = {
      text: message,
      isUser: true,
      senderType: 'user',
      id: Date.now(), // ID temporário
      createdAt: new Date().toISOString()
    };
    
    setMensagens(prev => [...prev, tempUserMessage]);
    setLoading(true);

    try {
      // Envia mensagem para o backend
      const response = await chamadoService.enviarMensagem(chamado.Id, message);
      
      // Remove a mensagem temporária e adiciona as mensagens reais do servidor
      setMensagens(prev => {
        // Remove a mensagem temporária
        const semTemp = prev.filter(m => m.id !== tempUserMessage.id);
        
        const newMessages = [];
        
        // Adiciona a mensagem do usuário do servidor
        if (response.UserMessage) {
          newMessages.push({
            text: response.UserMessage.Message,
            isUser: true,
            senderType: response.UserMessage.SenderType,
            id: response.UserMessage.Id,
            createdAt: response.UserMessage.CreatedAt
          });
        }
        
        // Adiciona resposta do bot se houver
        if (response.BotResponse) {
          newMessages.push({
            text: response.BotResponse.Message,
            isUser: false,
            senderType: response.BotResponse.SenderType || 'ai',
            id: response.BotResponse.Id,
            createdAt: response.BotResponse.CreatedAt
          });
        }
        
        return [...semTemp, ...newMessages];
      });
      
      // Atualiza o chamado na lista
      if (onAtualizarChamado) {
        onAtualizarChamado();
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      
      // Remove a mensagem temporária em caso de erro
      setMensagens(prev => prev.filter(m => m.id !== tempUserMessage.id));
      
      alert('Erro ao enviar mensagem. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (messageIndex, resolved) => {
    console.log(`Feedback para mensagem ${messageIndex}: ${resolved ? 'Resolvido' : 'Não resolvido'}`);
    
    // Se o problema foi resolvido, atualiza automaticamente para "Resolvido"
    if (resolved && chamado.Status === 'Em Andamento') {
      try {
        await chamadoService.atualizarStatus(chamado.Id, 'Resolvido');
        if (onAtualizarChamado) {
          onAtualizarChamado();
        }
      } catch (error) {
        console.error('Erro ao atualizar status:', error);
      }
    }
    
    // Se não foi resolvido, escala para técnico
    if (!resolved) {
      try {
        await chamadoService.escalarParaTecnico(chamado.Id);
        
        // Adiciona mensagem informativa
        const infoMessage = {
          text: '🔧 Este chamado foi escalado para um técnico. Em breve você receberá atendimento personalizado.',
          isUser: false,
          isSystem: true
        };
        setMensagens(prev => [...prev, infoMessage]);
        
        if (onAtualizarChamado) {
          onAtualizarChamado();
        }
      } catch (error) {
        console.error('Erro ao escalar chamado:', error);
        const errorMessage = {
          text: 'Erro ao escalar chamado para técnico. Por favor, tente novamente.',
          isUser: false
        };
        setMensagens(prev => [...prev, errorMessage]);
      }
    }
  };

  const handleMarcarComoResolvido = async () => {
    if (!chamado || chamado.Status === 'Resolvido') return;

    try {
      setResolvendoChamado(true);
      await chamadoService.marcarComoResolvido(chamado.Id);
      
      // Fecha o modal
      setMostrarModalResolucao(false);
      
      // Atualiza o chamado
      if (onAtualizarChamado) {
        onAtualizarChamado();
      }
    } catch (error) {
      console.error('Erro ao marcar chamado como resolvido:', error);
      alert('Erro ao marcar chamado como resolvido. Verifique se você tem permissão.');
    } finally {
      setResolvendoChamado(false);
    }
  };

  const handleAbrirModalResolucao = () => {
    setMostrarModalResolucao(true);
  };

  const handleCancelarResolucao = () => {
    setMostrarModalResolucao(false);
  };

  if (!chamado) {
    return (
      <div className="chat-chamado-empty">
        <div className="empty-state">
          {isTecnico ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                <path d="M9 10h.01"></path>
                <path d="M15 10h.01"></path>
                <path d="M9.5 15a3.5 3.5 0 0 0 5 0"></path>
              </svg>
              <h3>Nenhum chamado selecionado</h3>
              <p>Selecione um chamado da lista para visualizar as mensagens e atender o cliente</p>
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
              <h3>Selecione um chamado</h3>
              <p>Escolha um chamado da lista ou crie um novo para começar</p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <main className="main-content chat-layout">
      <header className="main-header">
        <div className="ticket-info">
            <h2>{chamado.Titulo}</h2>
            <div className="ticket-meta">
              <span className="ticket-id">#{chamado.Id}</span>
              <span className="ticket-usuario">{chamado.NomeUsuario}</span>
              {chamado.Categoria && <span className="ticket-categoria">{chamado.Categoria}</span>}
              {chamado.Prioridade && (
                <span className={`ticket-prioridade prioridade-${chamado.Prioridade.toLowerCase()}`}>
                  {chamado.Prioridade}
                </span>
              )}
              <span className={`ticket-status status-${chamado.Status.toLowerCase().replace(' ', '-')}`}>
                {chamado.Status}
              </span>
            </div>
        </div>
        {isTecnico && chamado.Status !== 'Resolvido' && (
          <button 
            className="btn-resolver-chamado"
            onClick={handleAbrirModalResolucao}
            disabled={resolvendoChamado}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            {resolvendoChamado ? 'Resolvendo...' : 'Marcar como Resolvido'}
          </button>
        )}
      </header>

      <ConfirmarResolucaoModal 
        isOpen={mostrarModalResolucao}
        onConfirm={handleMarcarComoResolvido}
        onCancel={handleCancelarResolucao}
      />

      <div className="chat-messages">
        {mensagens.map((msg, index) => (
          <ChatMessage 
            key={msg.id || index}
            message={msg.text}
            isUser={msg.isUser}
            senderType={msg.senderType}
            onFeedback={!msg.isUser ? (resolved) => handleFeedback(index, resolved) : undefined}
            chamadoBloqueado={chamado.Status === 'Resolvido'}
            atribuidoATecnico={chamado.AtribuidoATecnico}
          />
        ))}
        {typingUsers.length > 0 && (
          <div className={`typing-indicator-wrapper ${typingUsers[0].UserType === 'tecnico' ? 'tecnico-typing' : 'user-typing'}`}>
            <div className={`typing-avatar ${typingUsers[0].UserType === 'tecnico' ? 'tecnico-typing-avatar' : 'user-typing-avatar'}`}>
              {typingUsers[0].UserType === 'tecnico' ? (
                typingUsers[0].UserName.charAt(0).toUpperCase()
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 20a6 6 0 0 0-12 0"/>
                  <circle cx="12" cy="10" r="4"/>
                  <circle cx="12" cy="12" r="10"/>
                </svg>
              )}
            </div>
            <div className={`typing-bubble ${typingUsers[0].UserType === 'tecnico' ? 'tecnico-typing-bubble' : ''}`}>
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <div className="typing-text">
                {typingUsers[0].UserName} está digitando...
              </div>
            </div>
          </div>
        )}
        {loading && (
          <div className="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {chamado.Status === 'Resolvido' ? (
        <div className="chat-bloqueado">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          <p>Este chamado foi resolvido e está bloqueado para novas mensagens.</p>
        </div>
      ) : (
        <ChatComposer onSendMessage={handleSendMessage} onTyping={handleTyping} disabled={loading} />
      )}
    </main>
  );
}

export default ChatChamado;
