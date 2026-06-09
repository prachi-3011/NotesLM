import React, { useRef } from 'react';

export default function Sidebar({ documents, activeDocId, setActiveDocId, onFileUpload, onFileDelete, user, onSignOut }) {
  const fileRef = useRef(null);

  const handleInternalDelete = (docId, event) => {
    event.stopPropagation(); 
    if (window.confirm("Are you sure you want to permanently delete this document?")) {
      onFileDelete(docId);
    }
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2 className="sidebar-title" onClick={() => setActiveDocId(null)}>
          📚 Sources
        </h2>
        
        <input 
          type="file" 
          ref={fileRef}
          onChange={onFileUpload}
          accept=".txt,.pdf,.md,.docx"
          style={{ display: 'none' }}
        />
        
        <div 
          className="upload-icon-button" 
          title="Upload Document"
          onClick={() => fileRef.current.click()}
        >
          +
        </div>
      </div>

      <div className="documents-list">
        {documents.length === 0 ? (
          <p className="no-docs">No documents vectorized.</p>
        ) : (
          documents.map((doc) => {
            const isActive = activeDocId === doc._id;
            return (
              <div 
                key={doc._id}
                onClick={() => setActiveDocId(doc._id)}
                className={`document-item ${isActive ? 'active' : ''}`}
              >
                <div style={{ display: 'flex', alignItems: 'center', overflow: 'hidden', width: '85%' }}>
                  <span style={{ flexShrink: 0 }}>📄</span> 
                  <span className="doc-name" style={{ marginLeft: '10px' }}>
                    {doc.name}
                  </span>
                </div>
                <button
                  onClick={(e) => handleInternalDelete(doc._id, e)}
                  className="delete-btn"
                  title="Delete Source"
                >
                  🗑️
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* 🌟 USER STORAGE SIGN OUT FOOTER SECTION */}
      {user && (
        <div className="sidebar-user-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
            <img src={user.picture} alt="profile" className="user-avatar" referrerPolicy="no-referrer" />
            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#ffffff', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{user.name}</span>
              <span style={{ fontSize: '11px', color: '#5c6b73', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{user.email}</span>
            </div>
          </div>
          <button onClick={onSignOut} className="signout-button">
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}