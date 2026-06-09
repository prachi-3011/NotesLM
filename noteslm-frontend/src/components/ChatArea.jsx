import React from 'react';

export default function ChatArea({ messages, inputValue, setInputValue, isChatLoading, onSubmit, chatEndRef, activeDocId, documents }) {
  const activeFileName = documents.find(d => d._id === activeDocId)?.name;

  return (
    <div className="chat-area">
      <div className="chat-header">
        <h2>
          <span className="brand-title">
            <span className="brand-notes">Notes</span>
            <span className="brand-lm">LM</span>
          </span>
          {activeFileName ? (
            <span className="active-source-tag">📍 Focus Source: {activeFileName}</span>
          ) : (
            <span className="global-source-tag">🌐 Global Context Mode</span>
          )}
        </h2>
      </div>

      <div className="messages-container">
        {messages.map((msg, index) => {
          const isUser = msg.sender === 'user';
          return (
            <div key={index} className={`message-row ${isUser ? 'user-style' : 'assistant-style'}`}>
              <div className="message-bubble">
                {msg.text}
              </div>
            </div>
          );
        })}
        {isChatLoading && (
          <div className="message-row assistant-style">
            <div className="loading-text">⚡ Querying context matrices...</div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="chat-input-wrapper">
        <form onSubmit={onSubmit} className="chat-form-pill">
          <input 
            type="text" 
            value={inputValue} 
            disabled={isChatLoading} 
            onChange={(e) => setInputValue(e.target.value)} 
            placeholder={activeDocId ? "Ask a question focused on this source..." : "Ask a general question or pick a source to ground..."}
          />
          <button type="submit" className="circular-send-btn" disabled={isChatLoading}>
            ➔
          </button>
        </form>
      </div>
    </div>
  );
}