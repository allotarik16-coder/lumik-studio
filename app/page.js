'use client';

import { useState } from 'react';
import StudioShell from '@/components/StudioShell';
import ApiKeyModal from '@/components/ApiKeyModal';

export default function Home() {
  const [apiKey, setApiKey] = useState(null);

  const handleKeySet = (key) => {
    setApiKey(key);
    localStorage.setItem('lumik_api_key', key);
  };

  if (!apiKey) {
    return <ApiKeyModal onSave={handleKeySet} />;
  }

  return <StudioShell apiKey={apiKey} onKeyChange={() => setApiKey(null)} />;
}
