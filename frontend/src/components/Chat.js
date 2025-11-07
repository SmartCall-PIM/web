import React, { useState, useEffect, useRef } from 'react';
import ChatMessage from './ChatMessage';
import ChatEmptyState from './ChatEmptyState';
import ChatComposer from './ChatComposer';
import chatService from '../services/chatService';

function Chat({ userName }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (message) => {
    // Adiciona mensagem do usuário imediatamente
    const userMessage = { text: message, isUser: true };
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      // Envia mensagem para o backend
      const response = await chatService.sendMessage(message);
      
      // Suporta tanto Python (snake_case) quanto C# (PascalCase)
      const botResponseText = response.bot_response?.message || 
                              response.BotResponse?.Message ||
                              response.bot_response?.Message ||
                              response.BotResponse?.message ||
                              'Erro ao processar resposta';
      
      // Adiciona resposta do bot
      const botMessage = {
        text: botResponseText,
        isUser: false
      };
      
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      
      // Mensagem de erro para o usuário
      const errorMessage = {
        text: 'Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.',
        isUser: false
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    handleSendMessage(suggestion);
  };

  return (
    <main className="main-content chat-layout">
      <header className="main-header">
        <div className="ticket-info">
          <h2>Abertura de Chamado</h2>
        </div>
        <div className="user-info">
          <span id="welcomeUserName">{userName}</span>
        </div>
      </header>

      <div className="chat-messages">
        {messages.length === 0 ? (
          <ChatEmptyState onSuggestionClick={handleSuggestionClick} />
        ) : (
          <>
            {messages.map((msg, index) => (
              <ChatMessage 
                key={index}
                message={msg.text}
                isUser={msg.isUser}
              />
            ))}
            {loading && (
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <ChatComposer onSendMessage={handleSendMessage} disabled={loading} />
    </main>
  );
}

export default Chat;
