'use client';

import { useState } from 'react';

export default function ApiKeyModal({ onSave }) {
  const [key, setKey] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!key.trim()) {
      setError('API key required');
      return;
    }
    onSave(key);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[#0a0a0a] border border-[#00FF85]/20 rounded-xl p-8">
        <h1 className="text-3xl font-bold mb-2 text-[#00FF85]">LUMIK Studio</h1>
        <p className="text-white/60 mb-8">AI image generation for e-commerce</p>

        <div className="mb-6">
          <label className="block text-sm text-[#00FF85] mb-2">Muapi.ai API Key</label>
          <input
            type="password"
            value={key}
            onChange={(e) => {
              setKey(e.target.value);
              setError('');
            }}
            placeholder="ghp_..."
            className="w-full bg-[#1a1a1a] border border-[#00FF85]/30 text-white px-4 py-2 rounded focus:border-[#00FF85] outline-none"
          />
          {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
        </div>

        <button
          onClick={handleSubmit}
          className="w-full bg-[#00FF85] text-[#080808] font-bold py-2 rounded hover:bg-[#00FF85]/80 transition"
        >
          Enter Studio
        </button>
      </div>
    </div>
  );
}
