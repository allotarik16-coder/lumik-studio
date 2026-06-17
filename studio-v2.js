import React, { useState, useEffect } from 'react';
import { Search, Image, RotateCw, Download, Key } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function StudioV2() {
  const [apiKeys, setApiKeys] = useState({
    unsplash: '',
    pexels: '',
    muapi: ''
  });
  const [showKeyModal, setShowKeyModal] = useState(!process.env.NEXT_PUBLIC_SUPABASE_URL);
  const [mode, setMode] = useState('generate');
  const [query, setQuery] = useState('');
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState('unsplash');
  const [generated, setGenerated] = useState(null);
  const [outputs, setOutputs] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('lumik_api_keys');
    if (saved) setApiKeys(JSON.parse(saved));
    loadOutputs();
  }, []);

  const saveApiKeys = (keys) => {
    setApiKeys(keys);
    localStorage.setItem('lumik_api_keys', JSON.stringify(keys));
    setShowKeyModal(false);
  };

  const loadOutputs = async () => {
    try {
      const { data } = await supabase
        .from('lumik_studio_outputs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      setOutputs(data || []);
    } catch (err) {
      console.error('Load outputs error:', err);
    }
  };

  const saveOutput = async (url, prompt, type) => {
    try {
      await supabase.from('lumik_studio_outputs').insert({
        image_url: url,
        prompt: prompt,
        type: type,
        created_at: new Date()
      });
      loadOutputs();
    } catch (err) {
      console.error('Save output error:', err);
    }
  };

  const searchUnsplash = async () => {
    if (!query.trim() || !apiKeys.unsplash) return alert('Clé Unsplash requise');
    setLoading(true);
    try {
      const res = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=12&client_id=${apiKeys.unsplash}`
      );
      const data = await res.json();
      setImages(data.results || []);
    } catch (err) {
      console.error('Unsplash error:', err);
      alert('Erreur Unsplash');
    }
    setLoading(false);
  };

  const searchPexels = async () => {
    if (!query.trim() || !apiKeys.pexels) return alert('Clé Pexels requise');
    setLoading(true);
    try {
      const res = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=12`,
        { headers: { Authorization: apiKeys.pexels } }
      );
      const data = await res.json();
      setImages(data.photos || []);
    } catch (err) {
      console.error('Pexels error:', err);
      alert('Erreur Pexels');
    }
    setLoading(false);
  };

  const generateMuapi = async () => {
    if (!query.trim() || !apiKeys.muapi) return alert('Clé Muapi requise');
    setLoading(true);
    try {
      const res = await fetch('https://api.muapi.ai/v1/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKeys.muapi}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: query,
          model: 'muapi-v1',
          num_outputs: 1,
          guidance_scale: 7.5
        })
      });
      const data = await res.json();
      if (data.outputs?.[0]) {
        const url = data.outputs[0];
        setGenerated(url);
        saveOutput(url, query, 'muapi');
      }
    } catch (err) {
      console.error('Muapi error:', err);
      alert('Erreur génération');
    }
    setLoading(false);
  };

  const downloadImage = (url, name) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name}-${Date.now()}.jpg`;
    a.click();
  };

  if (showKeyModal) {
    return (
      <div className="min-h-screen bg-[#080808] text-white flex items-center justify-center p-4 font-['IBM_Plex_Mono']">
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-8 max-w-md w-full">
          <div className="flex items-center gap-2 mb-6">
            <Key className="w-6 h-6 text-[#00FF85]" />
            <h2 className="text-2xl font-['Bebas_Neue'] text-[#00FF85]">CLÉS API</h2>
          </div>
          <div className="space-y-4">
            <input
              type="password"
              placeholder="Unsplash API Key"
              defaultValue={apiKeys.unsplash}
              onChange={(e) => setApiKeys({ ...apiKeys, unsplash: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white placeholder-gray-500 text-sm"
            />
            <input
              type="password"
              placeholder="Pexels API Key"
              defaultValue={apiKeys.pexels}
              onChange={(e) => setApiKeys({ ...apiKeys, pexels: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white placeholder-gray-500 text-sm"
            />
            <input
              type="password"
              placeholder="Muapi API Key"
              defaultValue={apiKeys.muapi}
              onChange={(e) => setApiKeys({ ...apiKeys, muapi: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white placeholder-gray-500 text-sm"
            />
            <button
              onClick={() => saveApiKeys(apiKeys)}
              className="w-full px-4 py-2 bg-[#00FF85] text-black font-bold rounded hover:bg-[#00cc6a]"
            >
              VALIDER
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080808] text-white p-4 md:p-6 font-['IBM_Plex_Mono']">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 border-b border-gray-700 pb-4">
          <div>
            <h1 className="text-3xl font-['Bebas_Neue'] text-[#00FF85]">LUMIK STUDIO V2</h1>
            <p className="text-gray-400 text-sm">Sourcing + Génération IA</p>
          </div>
          <button
            onClick={() => setShowKeyModal(true)}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded hover:border-[#00FF85] transition text-sm flex items-center gap-2"
          >
            <Key className="w-4 h-4" />
            CLÉS
          </button>
        </div>

        {/* Mode Toggle */}
        <div className="flex gap-4 mb-8 border-b border-gray-700 pb-4">
          <button
            onClick={() => setMode('source')}
            className={`px-4 py-2 text-sm font-bold transition ${
              mode === 'source' ? 'text-[#00FF85] border-b-2 border-[#00FF85]' : 'text-gray-400'
            }`}
          >
            SOURCING
          </button>
          <button
            onClick={() => setMode('generate')}
            className={`px-4 py-2 text-sm font-bold transition ${
              mode === 'generate' ? 'text-[#00FF85] border-b-2 border-[#00FF85]' : 'text-gray-400'
            }`}
          >
            GÉNÉRATION IA
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Panel */}
          <div className="lg:col-span-2">
            {/* Search Bar */}
            <div className="mb-8 flex gap-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={(e) =>
                  e.key === 'Enter' &&
                  (mode === 'generate'
                    ? generateMuapi()
                    : source === 'unsplash'
                    ? searchUnsplash()
                    : searchPexels())
                }
                placeholder={
                  mode === 'generate'
                    ? 'Description produit (ex: sac main japonais minimaliste)...'
                    : 'Recherche asset (ex: texture tissu)...'
                }
                className="flex-1 bg-gray-900 border border-gray-700 rounded px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#00FF85]"
              />
              <button
                onClick={
                  mode === 'generate'
                    ? generateMuapi
                    : source === 'unsplash'
                    ? searchUnsplash
                    : searchPexels
                }
                disabled={loading}
                className="px-6 py-2 bg-[#00FF85] text-black font-bold rounded hover:bg-[#00cc6a] disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <RotateCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                {loading ? 'CHARGEMENT' : 'GO'}
              </button>
            </div>

            {/* Source Toggle */}
            {mode === 'source' && (
              <div className="mb-8 flex gap-2">
                <button
                  onClick={() => setSource('unsplash')}
                  className={`px-4 py-2 text-sm border rounded transition ${
                    source === 'unsplash'
                      ? 'bg-[#00FF85] text-black'
                      : 'border-gray-700 text-gray-400 hover:border-[#00FF85]'
                  }`}
                >
                  Unsplash
                </button>
                <button
                  onClick={() => setSource('pexels')}
                  className={`px-4 py-2 text-sm border rounded transition ${
                    source === 'pexels'
                      ? 'bg-[#00FF85] text-black'
                      : 'border-gray-700 text-gray-400 hover:border-[#00FF85]'
                  }`}
                >
                  Pexels
                </button>
              </div>
            )}

            {/* Generated Image */}
            {mode === 'generate' && generated && (
              <div className="mb-8 p-4 bg-gray-900 rounded border border-gray-700">
                <img
                  src={generated}
                  alt="Generated"
                  className="w-full rounded mb-4 max-h-96 object-cover"
                />
                <div className="flex gap-2">
                  <div className="flex-1">
                    <p className="text-gray-400 text-sm">Prompt: {query}</p>
                  </div>
                  <button
                    onClick={() =>
                      downloadImage(
                        generated,
                        `lumik-${Date.now()}`
                      )
                    }
                    className="px-4 py-2 bg-[#00FF85] text-black font-bold rounded hover:bg-[#00cc6a] flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    DL
                  </button>
                </div>
              </div>
            )}

            {/* Sourcing Grid */}
            {mode === 'source' && images.length > 0 && (
              <div>
                <p className="text-gray-400 text-sm mb-4">
                  {images.length} résultats • {source}
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {images.map((img, idx) => (
                    <div key={idx} className="group relative">
                      <img
                        src={
                          source === 'unsplash'
                            ? img.urls.small
                            : img.src.medium
                        }
                        alt="asset"
                        className="w-full h-40 object-cover rounded border border-gray-700 group-hover:border-[#00FF85] transition"
                      />
                      <button
                        onClick={() =>
                          downloadImage(
                            source === 'unsplash'
                              ? img.urls.full
                              : img.src.original,
                            `asset-${idx}`
                          )
                        }
                        className="absolute inset-0 bg-black/50 rounded opacity-0 group-hover:opacity-100 transition flex items-center justify-center"
                      >
                        <Download className="w-6 h-6 text-[#00FF85]" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {images.length === 0 && !generated && (
              <div className="text-center py-12 text-gray-500">
                <Image className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Cherche un asset ou génère avec IA...</p>
              </div>
            )}
          </div>

          {/* Sidebar: Recent Outputs */}
          <div className="lg:col-span-1">
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
              <h3 className="text-sm font-bold text-[#00FF85] mb-4">SORTIES RÉCENTES</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {outputs.map((output, idx) => (
                  <div
                    key={idx}
                    className="p-2 bg-gray-800 rounded border border-gray-700 hover:border-[#00FF85] transition cursor-pointer group"
                  >
                    <img
                      src={output.image_url}
                      alt="output"
                      className="w-full h-20 object-cover rounded mb-1"
                    />
                    <p className="text-xs text-gray-400 truncate">{output.prompt}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(output.created_at).toLocaleDateString('fr-FR')}
                    </p>
                    <button
                      onClick={() =>
                        downloadImage(output.image_url, output.type)
                      }
                      className="mt-1 w-full px-2 py-1 bg-gray-700 text-white text-xs rounded hover:bg-[#00FF85] hover:text-black transition opacity-0 group-hover:opacity-100"
                    >
                      DL
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
