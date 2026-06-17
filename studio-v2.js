import React, { useState, useEffect } from 'react';
import { Search, Image, RotateCw, Download } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const MUAPI_KEY = 'fb75f283f55c0b1b505620a29e169e3b34bfa505a636b4a84bad461d9340838d';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function StudioV2() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(null);
  const [outputs, setOutputs] = useState([]);

  useEffect(() => {
    loadOutputs();
  }, []);

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

  const saveOutput = async (url, prompt) => {
    try {
      await supabase.from('lumik_studio_outputs').insert({
        image_url: url,
        prompt: prompt,
        type: 'muapi',
        created_at: new Date()
      });
      loadOutputs();
    } catch (err) {
      console.error('Save output error:', err);
    }
  };

  const generateMuapi = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('https://api.muapi.ai/v1/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${MUAPI_KEY}`,
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
        saveOutput(url, query);
      } else {
        alert('Erreur: ' + (data.error || 'génération échouée'));
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

  return (
    <div className="min-h-screen bg-[#080808] text-white p-4 md:p-6 font-['IBM_Plex_Mono']">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 border-b border-gray-700 pb-4">
          <h1 className="text-3xl font-['Bebas_Neue'] text-[#00FF85]">LUMIK STUDIO</h1>
          <p className="text-gray-400 text-sm">Génération IA Muapi</p>
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
                onKeyPress={(e) => e.key === 'Enter' && generateMuapi()}
                placeholder="Décris le produit (ex: sac main japonais minimaliste)..."
                className="flex-1 bg-gray-900 border border-gray-700 rounded px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#00FF85]"
              />
              <button
                onClick={generateMuapi}
                disabled={loading}
                className="px-6 py-2 bg-[#00FF85] text-black font-bold rounded hover:bg-[#00cc6a] disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <RotateCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                {loading ? 'GÉNÉRATION...' : 'GÉNÉRER'}
              </button>
            </div>

            {/* Generated Image */}
            {generated && (
              <div className="mb-8 p-4 bg-gray-900 rounded border border-gray-700">
                <img
                  src={generated}
                  alt="Generated"
                  className="w-full rounded mb-4 max-h-96 object-cover"
                />
                <div className="flex gap-2 items-center">
                  <div className="flex-1">
                    <p className="text-gray-400 text-sm">Prompt: {query}</p>
                  </div>
                  <button
                    onClick={() => downloadImage(generated, `lumik-${Date.now()}`)}
                    className="px-4 py-2 bg-[#00FF85] text-black font-bold rounded hover:bg-[#00cc6a] flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    TÉLÉCHARGER
                  </button>
                </div>
              </div>
            )}

            {!generated && (
              <div className="text-center py-12 text-gray-500">
                <Image className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Décris un produit, génère avec IA...</p>
              </div>
            )}
          </div>

          {/* Sidebar: Recent Outputs */}
          <div className="lg:col-span-1">
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 sticky top-4">
              <h3 className="text-sm font-bold text-[#00FF85] mb-4">HISTORIQUE</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {outputs.length === 0 ? (
                  <p className="text-xs text-gray-500">Pas encore d'images...</p>
                ) : (
                  outputs.map((output, idx) => (
                    <div key={idx} className="p-2 bg-gray-800 rounded border border-gray-700 hover:border-[#00FF85] transition group">
                      <img
                        src={output.image_url}
                        alt="output"
                        className="w-full h-20 object-cover rounded mb-1 cursor-pointer"
                        onClick={() => {
                          setGenerated(output.image_url);
                          setQuery(output.prompt);
                        }}
                      />
                      <p className="text-xs text-gray-400 truncate">{output.prompt}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(output.created_at).toLocaleDateString('fr-FR')}
                      </p>
                      <button
                        onClick={() => downloadImage(output.image_url, 'lumik-output')}
                        className="mt-1 w-full px-2 py-1 bg-gray-700 text-white text-xs rounded hover:bg-[#00FF85] hover:text-black transition opacity-0 group-hover:opacity-100"
                      >
                        DL
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
