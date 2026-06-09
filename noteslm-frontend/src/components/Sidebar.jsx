import * as React from 'react';

export default function Sidebar({ documents, activeDocId, setActiveDocId, onFileUpload, onFileDelete }) {
  const fileRef = React.useRef(null);

  const handleInternalDelete = (docId, event) => {
    event.stopPropagation(); // Stops row select from triggering when clicking delete icon
    if (window.confirm("Are you sure you want to permanently delete this document from cloud storage?")) {
      onFileDelete(docId);
    }
  };

  return (
    <div style={{
      display: 'flex', 
      flexDirection: 'column', 
      width: '260px',
      backgroundColor: '#0b132b',
      height: '100%',
      padding: '15px 15px 20px 15px',
      boxSizing: 'border-box',
      flexShrink: 0,
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      
      {/* Sidebar Header Row Section */}
      <div style={{
        display: 'flex', 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '25px',
        paddingBottom: '12px',
        borderBottom: '1px solid rgba(204, 255, 0, 0.15)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '18px' }}>📚</span>
          <span style={{ fontWeight: '700', letterSpacing: '0.3px', fontSize: '16px', color: '#ffffff' }}>
            Sources
          </span>
        </div>

        {/* Hidden File Ingestion Native Layer */}
        <input 
          type="file" 
          ref={fileRef}
          onChange={onFileUpload}
          accept=".txt,.pdf,.md,.docx"
          style={{ display: 'none' }}
        />
        
        {/* Neon Yellow Plus Icon Enclosure Container */}
        <button 
          onClick={() => fileRef.current.click()}
          style={{
            backgroundColor: 'transparent',
            color: '#ccff00',
            border: '1px solid #ccff00',
            borderRadius: '4px',
            padding: '4px 12px',
            fontSize: '13px',
            cursor: 'pointer',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            textShadow: '0 0 6px rgba(204, 255, 0, 0.5)',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#ccff00';
            e.currentTarget.style.color = '#0b132b';
            e.currentTarget.style.textShadow = 'none';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#ccff00';
            e.currentTarget.style.textShadow = '0 0 6px rgba(204, 255, 0, 0.5)';
          }}
        >
          <span style={{ fontSize: '16px', fontWeight: 'bold', lineHeight: '0' }}>+</span> Upload
        </button>
      </div>

      {/* Interactive Active State Buttons Feed Scroll Workspace */}
      <div className="documents-list" style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '10px', 
        overflowY: 'auto', 
        flexGrow: 1 
      }}>
        {documents.length === 0 ? (
          <p style={{ color: '#5c6b73', fontSize: '12px', textAlign: 'center', marginTop: '20px', fontStyle: 'italic' }}>
            No documents uploaded.
          </p>
        ) : (
          documents.map((doc) => {
            const isTargetActive = activeDocId === doc._id;
            return (
              <div 
                key={doc._id}
                onClick={() => setActiveDocId(doc._id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: isTargetActive ? 'rgba(204, 255, 0, 0.12)' : '#1c2541',
                  border: isTargetActive ? '1px solid #ccff00' : '1px solid transparent',
                  borderRadius: '6px',
                  padding: '10px 12px',
                  cursor: 'pointer',
                  width: '100%',
                  boxSizing: 'border-box',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', overflow: 'hidden', width: '85%' }}>
                  <span style={{ flexShrink: 0 }}>📄</span> 
                  <span style={{ 
                    marginLeft: '10px', 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis', 
                    whiteSpace: 'nowrap',
                    fontSize: '13px',
                    fontWeight: isTargetActive ? '600' : '500',
                    color: isTargetActive ? '#ccff00' : '#e0e1dd'
                  }}>
                    {doc.name}
                  </span>
                </div>

                <button
                  onClick={(e) => handleInternalDelete(doc._id, e)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#ff4d4d',
                    cursor: 'pointer',
                    fontSize: '13px',
                    padding: '0 4px',
                    display: 'flex',
                    alignItems: 'center',
                    opacity: 0.6,
                    transition: 'opacity 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.opacity = '1'}
                  onMouseOut={(e) => e.currentTarget.style.opacity = '0.6'}
                  title="Delete Source"
                >
                  🗑️
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}