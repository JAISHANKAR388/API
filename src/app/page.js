'use client';
import { useState } from 'react';

export default function Home() {
  const [inputText, setInputText] = useState('A->B\nA->C\nB->D');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setResult(null);


    const data = inputText
      .split(/[\n,]+/)
      .map(item => item.trim())
      .filter(item => item !== '');

    try {
      const response = await fetch('/api/bfhl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || 'API request failed');
      }

      setResult(responseData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderTree = (treeData, level = 0) => {
    return Object.keys(treeData).map(node => (
      <div key={node} style={{ paddingLeft: `${level * 20}px` }}>
        └─ {node}
        {Object.keys(treeData[node]).length > 0 && renderTree(treeData[node], level + 1)}
      </div>
    ));
  };

  return (
    <main className="container">
      <div className="header">
        <h1>Graph Evaluator</h1>
        <p>Advanced hierarchical relationship analyzer via REST API</p>
      </div>

      <div className="user-info">
        {result && (
            <span>
                Credentials Confirmed: {result.user_id} | {result.email_id} | {result.college_roll_number}
            </span>
        )}
      </div>

      <section className="glass-panel input-section">
        <h2>Input Nodes</h2>
        <label>Enter hierarchical relationships (e.g., A-&gt;B):</label>
        <textarea 
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="A->B&#10;B->C&#10;C->D"
        />
        <button 
          className={`btn ${loading ? 'btn-loading' : ''}`}
          onClick={handleSubmit}
          disabled={loading || inputText.trim() === ''}
        >
          {loading ? 'Processing...' : 'Process Graph'}
        </button>
        {error && <div className="error-msg">Error: {error}</div>}
      </section>

      <section className="glass-panel results-section" style={{ opacity: result ? 1 : 0.5, pointerEvents: result ? 'auto' : 'none' }}>
        <h2>Analysis Results</h2>
        
        {result ? (
          <>
            <div className="summary-cards">
              <div className="stat-card">
                <h3>Total Trees</h3>
                <div className="value">{result.summary.total_trees}</div>
              </div>
              <div className="stat-card">
                <h3>Total Cycles</h3>
                <div className="value">{result.summary.total_cycles}</div>
              </div>
              <div className="stat-card">
                <h3>Largest Root</h3>
                <div className="value">{result.summary.largest_tree_root || '-'}</div>
              </div>
            </div>

            {(result.invalid_entries.length > 0 || result.duplicate_edges.length > 0) && (
                <div>
                    {result.invalid_entries.length > 0 && (
                        <div>
                            <h4>Invalid Entries:</h4>
                            <div className="tag-list">
                                {result.invalid_entries.map((entry, idx) => (
                                    <span key={idx} className="tag invalid">{entry}</span>
                                ))}
                            </div>
                        </div>
                    )}
                     {result.duplicate_edges.length > 0 && (
                        <div style={{marginTop: '1rem'}}>
                            <h4>Duplicate Edges:</h4>
                            <div className="tag-list">
                                {result.duplicate_edges.map((entry, idx) => (
                                    <span key={idx} className="tag duplicate">{entry}</span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            <h3>Hierarchies</h3>
            <div className="hierarchy-list">
              {result.hierarchies.length === 0 ? (
                  <p>No valid hierarchies found.</p>
              ) : (
                result.hierarchies.map((h, index) => (
                    <div key={index} className={`hierarchy-item ${h.has_cycle ? 'cycle' : ''}`}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong>Root: {h.root}</strong>
                        {h.has_cycle ? (
                            <span style={{ color: 'var(--error)', fontWeight: 'bold' }}>⚠️ Cycle Detected</span>
                        ) : (
                            <span style={{ color: 'var(--success)' }}>Depth: {h.depth}</span>
                        )}
                    </div>
                    <div className="tree-view">
                        {renderTree(h.tree)}
                    </div>
                    </div>
                ))
              )}
            </div>
            
            <div style={{marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)'}}>
                <h3>Raw JSON Response</h3>
                <pre style={{background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '0.5rem', overflow: 'auto', fontSize: '0.85rem'}}>
                    {JSON.stringify(result, null, 2)}
                </pre>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            Submit data to view insights
          </div>
        )}
      </section>
    </main>
  );
}
