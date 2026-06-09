import React, { useState, useRef, useEffect } from 'react';

export default function ChatArea({ messages, setMessages, activeDocId, documents }) {
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  const activeFileName = documents.find(d => d._id === activeDocId)?.name;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    const trimmedInput = inputValue.trim();
    if (!trimmedInput || isTyping) return;

    setInputValue('');
    const updatedHistory = [...messages, { sender: 'user', text: trimmedInput }];
    setMessages(updatedHistory);
    setIsTyping(true);

    try {
      // ➔ TARGETING THE CHAT ENDPOINT CORRECTLY
      const response = await fetch("http://localhost:5000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedHistory, activeDocId })
      });

      const data = await response.json();
      if (response.ok) {
        setMessages([...updatedHistory, { sender: 'llm', text: data.answer }]);
      } else {
        setMessages([...updatedHistory, { sender: 'llm', text: `Server Error: ${data.error || "Execution fault."}` }]);
      }
    } catch (err) {
      console.error(err);
      setMessages([...updatedHistory, { sender: 'llm', text: "Error connecting to server pipeline." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100vh', backgroundColor: '#060b19', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: '15px 40px', backgroundColor: '#0b132b', borderBottom: '2px solid #1c2541', height: '60px', boxSizing: 'border-box' }}>
        <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '700', display: 'flex', alignItems: 'center' }}>
          <span style={{ color: '#ffffff' }}>Notes</span>
          <span style={{ color: '#ccff00', textShadow: '0 0 8px rgba(204, 255, 0, 0.3)' }}>LM</span>
          {activeFileName && (
            <span style={{ fontSize: '12px', color: '#ccff00', marginLeft: '15px', padding: '4px 10px', backgroundColor: '#1c2541', border: '1px solid rgba(204, 255, 0, 0.3)', borderRadius: '4px', fontWeight: '400' }}>
              🎯 Focus Source: {activeFileName}
            </span>
          )}
        </h1>
      </div>

      <div className="messages-container" style={{ flex: 1, overflowY: 'auto', padding: '30px 40px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {messages.map((msg, index) => {
          const isUser = msg.sender === 'user';
          return (
            <div key={index} style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', width: '100%' }}>
              <div style={{ maxWidth: '65%', padding: '14px 18px', borderRadius: isUser ? '16px 16px 2px 16px' : '16px 16px 16px 2px', backgroundColor: isUser ? '#ccff00' : '#1c2541', color: isUser ? '#050b14' : '#f4f6f9', fontSize: '15px', whiteSpace: 'pre-wrap' }}>
                {msg.text}
              </div>
            </div>
          );
        })}
        {isTyping && <p style={{ color: '#ccff00', fontSize: '13px', fontStyle: 'italic' }}>⚡ Querying chunks...</p>}
        <div ref={chatEndRef} />
      </div>

      <div style={{ padding: '25px 40px 30px 40px', backgroundColor: '#0b132b', borderTop: '2px solid #1c2541' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', alignItems: 'center', width: '100%', maxWidth: '900px', margin: '0 auto', height: '54px', backgroundColor: '#050b14', border: '2px solid #3a506b', borderRadius: '27px', padding: '0 6px 0 22px', boxSizing: 'border-box' }}>
          <input type="text" placeholder={activeDocId ? "Ask a follow-up question..." : "Select a document to unlock grounded chat..."} value={inputValue} disabled={isTyping} onChange={(e) => setInputValue(e.target.value)} style={{ flex: 1, backgroundColor: 'transparent', color: '#f4f6f9', border: 'none', outline: 'none', fontSize: '15px' }} />
          <button type="submit" disabled={isTyping} style={{ backgroundColor: isTyping ? '#3a3f58' : '#ccff00', border: 'none', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>➔</button>
        </form>
      </div>
    </div>
  );
}