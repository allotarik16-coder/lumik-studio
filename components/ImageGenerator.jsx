'use client';

import { useState } from 'react';
import axios from 'axios';

export default function ImageGenerator({ apiKey, products, supabase }) {
  const [selectedProduct, setSelectedProduct] = useState(products[0] || null);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState(null);

  const handleGenerate = async () => {
    if (!prompt.trim() || !apiKey || !selectedProduct) return;

    setIsGenerating(true);
    setResult(null);

    try {
      const fullPrompt = `Product photography: ${selectedProduct.nom}. ${prompt}. Professional studio lighting, white background, e-commerce style, 4K.`;

      // Submit to Muapi
      const submitRes = await axios.post(
        `${process.env.NEXT_PUBLIC_MUAPI_URL || 'https://api.muapi.ai'}/api/v1/flux-dev`,
        {
          prompt: fullPrompt,
          width: 768,
          height: 768,
        },
        {
          headers: { 'x-api-key': apiKey },
        }
      );

      if (!submitRes.data?.request_id) throw new Error('No request_id');

      // Poll until done
      let completed = false;
      let attempts = 0;

      while (!completed && attempts < 60) {
        await new Promise((r) => setTimeout(r, 2000));

        const pollRes = await axios.get(
          `${process.env.NEXT_PUBLIC_MUAPI_URL || 'https://api.muapi.ai'}/api/v1/predictions/${submitRes.data.request_id}/result`,
          {
            headers: { 'x-api-key': apiKey },
          }
        );

        if (pollRes.data?.status === 'completed') {
          const imgUrl = pollRes.data?.images?.[0]?.url;

          // Save to Supabase
          await supabase.from('lumik_studio_outputs').insert({
            product_id: selectedProduct.id,
            product_nom: selectedProduct.nom,
            prompt: prompt,
            image_url: imgUrl,
            model: 'flux-dev',
            created_at: new Date().toISOString(),
          });

          setResult({ url: imgUrl, status: 'success' });
          completed = true;
        }
        attempts++;
      }

      if (!completed) {
        setResult({ status: 'error', message: 'Timeout après 2 min' });
      }
    } catch (err) {
      setResult({ status: 'error', message: err.message });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-[#0a0a0a] border border-[#00FF85]/20 rounded-lg p-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Controls */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm text-[#00FF85] mb-2">Product</label>
            <select
              value={selectedProduct?.id || ''}
              onChange={(e) => {
                const p = products.find((x) => x.id === parseInt(e.target.value));
                setSelectedProduct(p);
              }}
              className="w-full bg-[#1a1a1a] border border-[#00FF85]/30 text-white px-3 py-2 rounded focus:border-[#00FF85] outline-none"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nom}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-[#00FF85] mb-2">Style / Context</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="ex: vibrant colors, minimal lifestyle setting, bokeh background"
              className="w-full h-24 bg-[#1a1a1a] border border-[#00FF85]/30 text-white px-3 py-2 rounded focus:border-[#00FF85] outline-none resize-none"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="w-full bg-[#00FF85] text-[#080808] font-bold py-3 rounded hover:bg-[#00FF85]/80 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {isGenerating ? 'Generating...' : 'Generate Image'}
          </button>
        </div>

        {/* Result */}
        <div>
          {result && (
            <div className="space-y-4">
              {result.status === 'success' && result.url && (
                <div>
                  <p className="text-[#00FF85] text-sm mb-3">✓ Generated and Saved</p>
                  <img
                    src={result.url}
                    alt="Generated"
                    className="w-full rounded-lg max-h-96 object-cover"
                  />
                </div>
              )}
              {result.status === 'error' && (
                <p className="text-red-400 text-sm bg-red-500/10 p-3 rounded">
                  {result.message}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
