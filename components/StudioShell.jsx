'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import ImageGenerator from './ImageGenerator';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default function StudioShell({ apiKey, onKeyChange }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from('produits_lumik')
        .select('*')
        .limit(20);

      if (!error && data) {
        setProducts(data);
      }
      setLoading(false);
    };

    fetchProducts();
  }, []);

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-[#00FF85] mb-2">LUMIK Studio</h1>
            <p className="text-white/60">Generate product images with AI</p>
          </div>
          <button
            onClick={onKeyChange}
            className="bg-red-500/10 text-red-400 hover:bg-red-500/20 px-4 py-2 rounded text-sm font-semibold transition"
          >
            Change Key
          </button>
        </header>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-white/60">Loading products...</p>
          </div>
        ) : (
          <ImageGenerator apiKey={apiKey} products={products} supabase={supabase} />
        )}
      </div>
    </div>
  );
}
