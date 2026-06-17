import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, FileText, CheckCircle } from 'lucide-react';

const BulkDirectMonitor = () => {
  const [stats, setStats] = useState({
    subs_scanned: 0,
    posts_scraped: 0,
    leads_extracted: 0,
    leads_validated: 0,
    success_rate: 0,
    avg_lead_quality: 0,
    last_run: null,
    next_run: null
  });

  const [batches, setBatches] = useState([]);
  const [logs, setLogs] = useState([]);
  const [isLiveMode, setIsLiveMode] = useState(true);
  const [selectedBatch, setSelectedBatch] = useState(null);

  useEffect(() => {
    if (!isLiveMode) return;

    const pollInterval = setInterval(() => {
      const mockStats = {
        subs_scanned: Math.floor(Math.random() * 10) + 8,
        posts_scraped: Math.floor(Math.random() * 500) + 200,
        leads_extracted: Math.floor(Math.random() * 150) + 50,
        leads_validated: Math.floor(Math.random() * 120) + 30,
        avg_lead_quality: Math.floor(Math.random() * 30) + 70,
        last_run: new Date(Date.now() - Math.random() * 86400000),
        next_run: new Date(Date.now() + (3 - (new Date().getHours() % 3)) * 3600000)
      };
      mockStats.success_rate = Math.round(
        (mockStats.leads_validated / mockStats.leads_extracted) * 100
      );

      setStats(mockStats);

      setLogs(prev => [
        {
          timestamp: new Date(),
          message: `Reddit scan: ${mockStats.subs_scanned} subs, ${mockStats.posts_scraped} posts, ${mockStats.leads_extracted} leads`,
          level: mockStats.success_rate >= 60 ? 'success' : 'warning'
        },
        ...prev.slice(0, 19)
      ]);
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [isLiveMode]);

  useEffect(() => {
    const mockBatches = Array.from({ length: 5 }, (_, i) => ({
      id: `bulk-batch-${i}`,
      timestamp: new Date(Date.now() - i * 86400000),
      subs_scanned: Math.floor(Math.random() * 10) + 8,
      posts_scraped: Math.floor(Math.random() * 500) + 200,
      leads_extracted: Math.floor(Math.random() * 150) + 50,
      leads_validated: Math.floor(Math.random() * 120) + 30,
      status: i === 0 ? 'running' : 'completed'
    }));
    setBatches(mockBatches);
  }, []);

  return (
    <div className="min-h-screen bg-[#080808] text-white font-mono p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[#2f6fed] text-2xl">🔗 BULKDIRECT MONITOR</div>
            <button
              onClick={() => setIsLiveMode(!isLiveMode)}
              className={`px-3 py-1 border-2 text-xs font-bold transition ${
                isLiveMode
                  ? 'border-[#2f6fed] bg-[#2f6fed] text-white'
                  : 'border-[#333] text-[#888]'
              }`}
            >
              {isLiveMode ? '◉ LIVE' : '○ OFFLINE'}
            </button>
          </div>
          <div className="text-xs text-[#666]">Reddit pipeline • Vercel cron 03:00 UTC</div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="border-2 border-[#2f6fed] bg-[#1a1a1a] p-4">
            <div className="text-[#888] text-xs mb-2 flex items-center gap-1">
              <Users size={12} /> SUBS SCANNED
            </div>
            <div className="text-[#2f6fed] text-3xl font-bold">{stats.subs_scanned}</div>
          </div>

          <div className="border-2 border-[#2f6fed] bg-[#1a1a1a] p-4">
            <div className="text-[#888] text-xs mb-2 flex items-center gap-1">
              <FileText size={12} /> POSTS
            </div>
            <div className="text-[#2f6fed] text-3xl font-bold">{stats.posts_scraped}</div>
          </div>

          <div className="border-2 border-[#2f6fed] bg-[#1a1a1a] p-4">
            <div className="text-[#888] text-xs mb-2 flex items-center gap-1">
              <TrendingUp size={12} /> LEADS EXTRACTED
            </div>
            <div className="text-[#2f6fed] text-3xl font-bold">{stats.leads_extracted}</div>
          </div>

          <div className="border-2 border-[#2f6fed] bg-[#1a1a1a] p-4">
            <div className="text-[#888] text-xs mb-2 flex items-center gap-1">
              <CheckCircle size={12} /> VALIDATED
            </div>
            <div className="text-[#2f6fed] text-3xl font-bold">{stats.leads_validated}</div>
            <div className="text-[#666] text-xs mt-2">{stats.success_rate}% valid</div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Batch History */}
          <div className="lg:col-span-2 border-2 border-[#333] bg-[#1a1a1a] p-6">
            <div className="text-[#2f6fed] mb-4">PIPELINE HISTORY</div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {batches.map(batch => (
                <button
                  key={batch.id}
                  onClick={() => setSelectedBatch(batch)}
                  className={`w-full text-left p-3 border-2 transition ${
                    selectedBatch?.id === batch.id
                      ? 'border-[#2f6fed] bg-[#0a1a2a]'
                      : 'border-[#333] hover:border-[#2f6fed]'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#888]">{batch.timestamp.toLocaleString()}</span>
                    <span className={batch.status === 'running' ? 'text-[#2f6fed] animate-pulse' : 'text-[#666]'}>
                      {batch.status === 'running' ? '● RUNNING' : '✓ DONE'}
                    </span>
                  </div>
                  <div className="flex justify-between mt-2 text-sm">
                    <span className="text-[#2f6fed]">{batch.posts_scraped} posts</span>
                    <span className="text-[#2f6fed]">{batch.leads_extracted} leads</span>
                    <span className="text-[#00FF85]">{batch.leads_validated} valid</span>
                  </div>
                  <div className="w-full bg-black h-1 mt-2 border border-[#333]">
                    <div
                      className="h-full bg-[#2f6fed]"
                      style={{ width: `${(batch.leads_validated / (batch.leads_extracted || 1)) * 100}%` }}
                    />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Logs */}
          <div className="border-2 border-[#333] bg-[#1a1a1a] p-6">
            <div className="text-[#2f6fed] mb-4">LOGS</div>
            <div className="space-y-1 max-h-96 overflow-y-auto font-mono text-xs">
              {logs.map((log, i) => (
                <div key={i} className="text-[#666]">
                  <span style={{ color: log.level === 'success' ? '#2f6fed' : '#FFB800' }}>
                    {log.level === 'success' ? '✓' : '⚠'}
                  </span>
                  {' '}
                  <span className="text-[#888]">{log.timestamp.toLocaleTimeString()}</span>
                  {' '}
                  <span className="text-[#999]">{log.message}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Batch Details */}
        {selectedBatch && (
          <div className="mt-8 border-2 border-[#2f6fed] bg-[#1a1a1a] p-6">
            <div className="text-[#2f6fed] mb-4">BATCH DETAILS</div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-xs">
              <div>
                <div className="text-[#666] mb-1">Timestamp</div>
                <div className="text-[#2f6fed]">{selectedBatch.timestamp.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-[#666] mb-1">Subs Scanned</div>
                <div className="text-[#2f6fed]">{selectedBatch.subs_scanned}</div>
              </div>
              <div>
                <div className="text-[#666] mb-1">Posts Scraped</div>
                <div className="text-[#2f6fed]">{selectedBatch.posts_scraped}</div>
              </div>
              <div>
                <div className="text-[#666] mb-1">Leads Extracted</div>
                <div className="text-[#2f6fed]">{selectedBatch.leads_extracted}</div>
              </div>
              <div>
                <div className="text-[#666] mb-1">Validation Rate</div>
                <div className="text-[#2f6fed]">
                  {Math.round((selectedBatch.leads_validated / (selectedBatch.leads_extracted || 1)) * 100)}%
                </div>
              </div>
            </div>

            <div className="mt-6 border-t border-[#333] pt-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#2f6fed]">Subreddits Scanned</span>
                <span className="text-[#2f6fed]">{selectedBatch.subs_scanned}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#2f6fed]">Total Posts</span>
                <span className="text-[#2f6fed]">{selectedBatch.posts_scraped}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#2f6fed]">Raw Leads</span>
                <span className="text-[#2f6fed]">{selectedBatch.leads_extracted}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#00FF85]">✓ Validated</span>
                <span className="text-[#00FF85]">{selectedBatch.leads_validated}</span>
              </div>
            </div>
          </div>
        )}

        {/* Query Info */}
        <div className="mt-8 border border-[#333] bg-black p-4 rounded text-xs text-[#666]">
          <div className="text-[#2f6fed] mb-2">Supabase Query</div>
          <pre className="overflow-x-auto">{`SELECT 
  company, email, website, intent, confidence,
  source_post_id, created_at
FROM crm_leads
WHERE created_at > NOW() - INTERVAL '24 hours'
AND confidence >= 70
ORDER BY created_at DESC;`}</pre>
        </div>
      </div>
    </div>
  );
};

export default BulkDirectMonitor;
