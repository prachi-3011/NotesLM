import * as React from 'react';

export default function Sidebar({ documents, activeDocId, setActiveDocId, onFileUpload, onFileDelete }) {
  const fileRef = React.useRef(null);

  // Fallback deletion controller to ensure smooth pipeline tracking
  const handleInternalDelete = async (docId, event) => {
    event.stopPropagation(); // Stops the button click from auto-selecting the document row
    
    if (!window.confirm("Are you sure you want to permanently delete this document from cloud storage?")) return;

    if (typeof onFileDelete === 'function') {
      onFileDelete(docId);
    } else {
      // In-line integration hook if App.js framework mapping is directly fetching network requests
      try {
        const response = await fetch(`http://localhost:5000/api/documents/${docId}`, { method: "DELETE" });
        if (response.ok) {
          window.location.reload(); // Quick sync strategy if state setters are not mapped
        } else {
          alert("Could not remove the document from server arrays.");
        }
      } catch (err) {
        console.error("Network deletion pipeline failure:", err);
      }
    }
  };

  return (
    <div style={{
      display: 'flex', 
      flexDirection: 'column', 
      width: '260px',
      backgroundColor: '#0b132b',
      borderRight: '1px solid #ccff00',
      height: '100vh',
      padding: '20px 15px',
      boxSizing: 'border-box',
      flexShrink: 0,
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      
      {/* Sidebar Top Header Row Section */}
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
          <span style={{ fontWeight: '700', letterSpacing: '0.5px', fontSize: '16px', color: '#ffffff' }}>
            Sources
          </span>
        </div>

        {/* Hidden File Input UI Ingestion Layer */}
        <input 
          type="file" 
          ref={fileRef}
          onChange={onFileUpload}
          accept=".txt,.pdf,.md,.docx"
          style={{ display: 'none' }}
        />
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
            gap: '4px',
            textShadow: '0 0 6px rgba(204, 255, 0, 0.4)'
          }}
        >
          <span style={{ fontSize: '16px', fontWeight: 'bold', lineHeight: '0', color: '#ccff00' }}>+</span> Upload
        </button>
      </div>

      {/* Interactive Active State Buttons Container Feed */}
      <div style={{ 
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
                <div style={{ display: 'flex', alignItems: 'center', overflow: 'hidden', width: '80%' }}>
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
                  title="Delete Document Source"
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