import * as React from 'react';

export default function Sidebar({ documents, activeDocId, setActiveDocId, onFileUpload }) {
  const fileRef = React.useRef(null);

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
      flexShrink: 0
    }}>
      
      {/* Sidebar Top Section Wrapper */}
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
          <span style={{ color: '#ccff00', fontSize: '18px' }}>📚</span>
          <span style={{ fontWeight: '600', letterSpacing: '0.8px', fontSize: '13px', color: '#f8fafc' }}>SOURCES</span>
        </div>

        {/* Hidden File Input UI Wrapper */}
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
            fontSize: '12px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          + Upload
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
              <button 
                key={doc._id}
                onClick={() => setActiveDocId(doc._id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  textAlign: 'left',
                  backgroundColor: isTargetActive ? 'rgba(204, 255, 0, 0.12)' : '#1c2541',
                  color: isTargetActive ? '#ccff00' : '#e0e1dd',
                  border: isTargetActive ? '1px solid #ccff00' : '1px solid transparent',
                  borderRadius: '6px',
                  padding: '10px 12px',
                  fontSize: '13px',
                  cursor: 'pointer',
                  width: '100%',
                  transition: 'all 0.15s ease'
                }}
              >
                📄 <span style={{ marginLeft: '10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.name}</span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}