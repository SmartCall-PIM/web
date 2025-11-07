import React, { useState, useRef, useEffect } from 'react';

function ChatComposer({ onSendMessage, onTyping, disabled }) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Auto-resize do textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [message]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      // Notifica que parou de digitar
      if (onTyping) {
        onTyping(false);
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      onSendMessage(message);
      setMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleChange = (e) => {
    setMessage(e.target.value);

    // Notifica que está digitando
    if (onTyping && e.target.value.trim()) {
      onTyping(true);

      // Reseta o timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Após 2 segundos sem digitar, notifica que parou
      typingTimeoutRef.current = setTimeout(() => {
        onTyping(false);
      }, 2000);
    } else if (onTyping && !e.target.value.trim()) {
      onTyping(false);
    }
  };

  return (
    <div className="chat-composer">
      <textarea 
        ref={textareaRef}
        placeholder="Pergunte alguma coisa..."
        value={message}
        onChange={handleChange}
        onKeyPress={handleKeyPress}
        rows={1}
        disabled={disabled}
      />
      <button 
        className="btn btn-primary"
        onClick={handleSubmit}
        disabled={disabled}
      >
        {disabled ? 'Enviando...' : 'Enviar'}
      </button>
    </div>
  );
}

export default ChatComposer;
