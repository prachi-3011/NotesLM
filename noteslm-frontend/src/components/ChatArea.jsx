import React, { useState, useRef, useEffect } from 'react';

export default function ChatArea({ messages, setMessages, activeDocId, documents }) {
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  // Derive active focus filename for metadata visual rendering tracking
  const activeFileName = documents.find(d => d._id === activeDocId)?.name;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSubmit = async () => {
    const trimmedInput = inputValue.trim();
    if (!trimmedInput || isTyping) return;

    setInputValue('');

    const updatedHistory = [...messages, { sender: 'user', text: trimmedInput }];
    setMessages(updatedHistory);
    setIsTyping(true);

    try {
      // Dispatches context elements directly through custom internal server node
      const response = await fetch("http://localhost:5000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedHistory, activeDocId })
      });

      const data = await response.json();
      setMessages([...updatedHistory, { sender: 'llm', text: data.answer }]);
    } catch (err) {
      console.error(err);
      setMessages([...updatedHistory, { sender: 'llm', text: "Error connecting to server pipeline." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSignOut = () => {
    const confirmLeave = window.confirm("Are you sure you want to sign out?");
    if (confirmLeave) {
      console.log("Signing user out...");
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      flex: 1, 
      height: '100vh', 
      backgroundColor: '#060b19', 
      boxSizing: 'border-box',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      
      {/* Top Header Section */}
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '15px 40px',
        backgroundColor: '#0b132b',
        borderBottom: '1px solid rgba(204, 255, 0, 0.2)',
        boxSizing: 'border-box',
        height: '60px'
      }}>
        <h1 style={{
          margin: 0,
          fontSize: '22px',
          fontWeight: '700',
          letterSpacing: '0.5px',
          display: 'flex',
          alignItems: 'center'
        }}>
          {/* Exact Brand Customization Split Rule Mapping */}
          <span style={{ color: '#ffffff' }}>Notes</span>
          <span style={{ color: '#ccff00', textShadow: '0 0 8px rgba(204, 255, 0, 0.3)' }}>LM</span>
          
          {activeFileName && (
            <span style={{
              fontSize: '12px',
              color: '#ccff00',
              marginLeft: '15px',
              padding: '4px 10px',
              backgroundColor: '#1c2541',
              border: '1px solid rgba(204, 255, 0, 0.3)',
              borderRadius: '4px',
              fontWeight: '400',
              maxWidth: '350px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              🎯 Focus Source: {activeFileName}
            </span>
          )}
        </h1>

        <button
          onClick={handleSignOut}
          style={{
            backgroundColor: 'transparent',
            color: '#ff4d4d',
            border: '1px solid rgba(255, 77, 77, 0.4)',
            borderRadius: '20px',
            padding: '6px 16px',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#ff4d4d';
            e.currentTarget.style.color = '#060b19';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#ff4d4d';
          }}
        >
          Sign Out
        </button>
      </div>

      {/* Chat Messages Frame Window */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        padding: '30px 40px',
        display: 'flex',
        flexDirection: 'column',
        gap: '18px'
      }}>
        {messages.map((msg, index) => {
          const isUser = msg.sender === 'user';
          return (
            <div 
              key={index} 
              style={{ 
                display: 'flex', 
                justifyContent: isUser ? 'flex-end' : 'flex-start', 
                width: '100%' 
              }}
            >
              <div style={{
                maxWidth: '70%',
                padding: '14px 18px',
                borderRadius: isUser ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                backgroundColor: isUser ? '#1d3557' : '#0b132b', 
                border: isUser ? '1px solid transparent' : '1px solid rgba(204, 255, 0, 0.25)', 
                color: '#f8fafc',
                fontSize: '14px',
                lineHeight: '1.5',
                whiteSpace: 'pre-wrap',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}>
                {msg.text}
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', width: '100%' }}>
            <p style={{ color: '#ccff00', fontSize: '12px', margin: '4px 0 0 6px', letterSpacing: '0.5px' }}>
              ⚡ Querying JSON structural database chunks...
            </p>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Control Interface Segment */}
      <div style={{ padding: '20px 40px 30px 40px', backgroundColor: '#060b19' }}>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'row', 
          alignItems: 'center', 
          width: '100%', 
          maxWidth: '850px', 
          margin: '0 auto', 
          height: '54px', 
          backgroundColor: '#0b132b', 
          border: '1px solid #ccff00', 
          borderRadius: '27px', 
          padding: '0 8px 0 22px', 
          boxSizing: 'border-box' 
        }}>
          <input 
            type="text" 
            placeholder={isTyping ? "Scanning context blocks..." : "Ask a question about your active document focus..."}
            value={inputValue}
            disabled={isTyping}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            style={{ 
              flex: 1, 
              height: '100%', 
              backgroundColor: 'transparent', 
              color: '#f8fafc', 
              border: 'none', 
              outline: 'none', 
              fontSize: '14px' 
            }} 
          />
          <button 
            onClick={handleSubmit}
            disabled={isTyping}
            style={{ 
              backgroundColor: isTyping ? '#3a3f58' : '#ccff00', 
              border: 'none', 
              borderRadius: '50px', 
              width: '38px', 
              height: '38px', 
              color: '#060b19', 
              fontWeight: 'bold', 
              cursor: isTyping ? 'not-allowed' : 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              fontSize: '15px',
              transition: 'transform 0.1s'
            }}
            onMouseOver={(e) => { if(!isTyping) e.currentTarget.style.transform = 'scale(1.05)' }}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            ➔
          </button>
        </div>
      </div>

    </div>
  );
}