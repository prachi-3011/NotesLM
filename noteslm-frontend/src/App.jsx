import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import './App.css';

function App() {
  const [user, setUser] = useState(() => {
    const cached = localStorage.getItem('noteslm_user');
    return cached ? JSON.parse(cached) : null;
  });
  const [documents, setDocuments] = useState([]);
  const [activeDocId, setActiveDocId] = useState(null);
  const [messages, setMessages] = useState([
    { sender: 'assistant', text: 'System Online. Select an active document source to begin context-grounded analysis.' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  // 🌟 DYNAMICALLY MOUNT GOOGLE IDENTITY CLIENT LIBRARY
  useEffect(() => {
    if (user) return;

    const script = document.createElement('script');
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      window.google?.accounts.id.initialize({
        client_id: "263824013785-iu2d5cgu7dt0rlimfrf26q80jdg7ncth.apps.googleusercontent.com", 
        callback: handleGoogleLoginResponse
      });
      
      const btnTarget = document.getElementById("google-sigin-hook");
      if (btnTarget) {
        window.google?.accounts.id.renderButton(btnTarget, {
          theme: "outline",
          size: "large",
          text: "signin_with",
          shape: "pill"
        });
      }
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchDocumentsList();
    }
  }, [user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleGoogleLoginResponse = async (response) => {
    try {
      const res = await fetch('http://localhost:5000/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential })
      });
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
        localStorage.setItem('noteslm_user', JSON.stringify(userData));
      } else {
        alert("Authentication failed on server pipeline verification.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSignOut = () => {
    setUser(null);
    setDocuments([]);
    setActiveDocId(null);
    setMessages([{ sender: 'assistant', text: 'System Online. Select an active document source to begin context-grounded analysis.' }]);
    localStorage.removeItem('noteslm_user');
  };

  const fetchDocumentsList = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/documents?userId=${user._id}`);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
      }
    } catch (err) {
      console.error("Failed to read server index list:", err);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const dataUrl = e.target.result;
        const base64Data = dataUrl.split(',')[1];

        const response = await fetch("http://localhost:5000/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            name: file.name, 
            base64Data: base64Data, 
            fileType: file.type,
            userId: user._id 
          })
        });

        const responseData = await response.json();

        if (response.ok) {
          setDocuments(prev => [...prev, { _id: responseData.docId, name: responseData.name }]);
          setActiveDocId(responseData.docId);
        } else {
          alert(`Server Error: ${responseData.error}`);
        }
      } catch (err) {
        alert("Network Error: Connection failed.");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileDelete = async (docId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/documents/${docId}`, { method: "DELETE" });
      if (response.ok) {
        setDocuments(prev => prev.filter(doc => doc._id !== docId));
        if (activeDocId === docId) setActiveDocId(null);
      }
    } catch (err) {
      console.error("Removal failure:", err);
    }
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() || isChatLoading) return;

    const userMessage = { sender: 'user', text: inputValue };
    const updatedHistory = [...messages, userMessage];

    setMessages(updatedHistory);
    setInputValue('');
    setIsChatLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedHistory.filter(m => m.sender !== 'assistant' || updatedHistory.indexOf(m) !== 0),
          activeDocId: activeDocId
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, { sender: 'assistant', text: data.answer }]);
      } else {
        const errorData = await response.json();
        setMessages(prev => [...prev, { sender: 'assistant', text: `Pipeline Error: ${errorData.error || "Failed execution."}` }]);
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { sender: 'assistant', text: "Error connecting to server pipeline." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // 🌟 AUTHENTICATION ROUTE GUARD
  if (!user) {
    return (
      <div className="login-container">
        <div className="login-card">
          <h1 className="login-brand">
            Notes<span style={{ color: '#ccff00' }}>LM</span>
          </h1>
          <p className="login-subtitle">Unlock grounded, structured intelligence layouts.</p>
          <div id="google-sigin-hook" style={{ marginTop: '20px' }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Sidebar 
        documents={documents} 
        activeDocId={activeDocId} 
        setActiveDocId={setActiveDocId} 
        onFileUpload={handleFileUpload} 
        onFileDelete={handleFileDelete} 
        user={user}
        onSignOut={handleSignOut}
      />
      <ChatArea 
        messages={messages} 
        inputValue={inputValue}
        setInputValue={setInputValue}
        isChatLoading={isChatLoading}
        onSubmit={handleSendMessage}
        chatEndRef={chatEndRef}
        activeDocId={activeDocId} 
        documents={documents} 
      />
    </div>
  );
}

export default App;