import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Clock, TrendingUp, RefreshCw } from 'lucide-react';

const LumikBatchMonitor = () => {
  const [stats, setStats] = useState({
    total_processed: 0,
    successful: 0,
    failed: 0,
    success_rate: 0,
    avg_generation_time: 0,
    last_run: null,
    next_run: null
  });

  const [batches, setBatches] = useState([]);
  const [logs, setLogs] = useState([]);
  const [isLiveMode, setIsLiveMode] = useState(true);
  const [selectedBatch, setSelectedBatch] = useState(null);

  // Simule subscription Supabase realtime
  useEffect(() => {
    if (!isLiveMode) return;

    // Polling simulation (en vrai: Supabase subscription)
    const pollInterval = setInterval(async () => {
      try {
        // En production: SELECT * FROM lumik_generations WHERE created_at > NOW() - INTERVAL '24 hours'
        // Pour démo: simuler stats
        const mockStats = {
          total_processed: Math.floor(Math.random() * 50) + 20,
          successful: Math.floor(Math.random() * 50) + 15,
          failed: Math.floor(Math.random() * 10) + 2,
          avg_generation_time: Math.floor(Math.random() * 3000) + 500,
          last_run: new Date(Date.now() - Math.random() * 86400000),
          next_run: new Date(Date.now() + (2 - (new Date().getHours() % 2)) * 3600000)
        };
        mockStats.success_rate = Math.round(
          (mockStats.successful / mockStats.total_processed) * 100
        );

        setStats(mockStats);

        // Ajouter log
        setLogs(prev => [
          {
            timestamp: new Date(),
            message: `Batch scan: ${mockStats.total_processed} products, ${mockStats.successful} success`,
            level: mockStats.success_rate >= 90 ? 'success' : 'warning'
          },
          ...prev.slice(0, 19)
        ]);
      } catch (error) {
        setLogs(prev => [
          {
            timestamp: new Date(),
            message: `Error: ${error.message}`,
            level: 'error'
          },
          ...prev.slice(0, 19)
        ]);
      }
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [isLiveMode]);

  // Fetchbatch history
  useEffect(() => {
    // En production: SELECT * FROM lumik_generations ORDER BY created_at DESC LIMIT 20
    const mockBatches = Array.from({ length: 5 }, (_, i) => ({
      id: `batch-${i}`,
      timestamp: new Date(Date.now() - i * 86400000),
      processed: Math.floor(Math.random() * 50) + 10,
      success: Math.floor(Math.random() * 45) + 8,
      failed: Math.floor(Math.random() * 5) + 1,
      avg_time: Math.floor(Math.random() * 3000) + 500,
      status: i === 0 ? 'running' : 'completed'
    }));
    setBatches(mockBatches);
  }, []);

  const getStatusColor = (level) => {
    switch (level) {
      case 'success':
        return '#00FF85';
      case 'warning':
        return '#FFB800';
      case 'error':
        return '#FF4444';
      default:
        return '#888';
    }
  };

  const getStatusIcon = (level) => {
    switch (level) {
      case 'success':
        return '✓';
      case 'warning':
        return '⚠';
      case 'error':
        return '✗';
      default:
        return '•';
    }
  };

  return (
    <div className="min-h-screen bg-[#080808] text-white font-mono p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[#00FF85] text-2xl">📊 LUMIK BATCH MONITOR</div>
            <button
              onClick={() => setIsLiveMode(!isLiveMode)}
              className={`px-3 py-1 border-2 text-xs font-bold transition ${
                isLiveMode
                  ? 'border-[#00FF85] bg-[#00FF85] text-black'
                  : 'border-[#333] text-[#888]'
              }`}
            >
              {isLiveMode ? '◉ LIVE' : '○ OFFLINE'}
            </button>
          </div>
          <div className="text-xs text-[#666]">Realtime Supabase sync • Vercel cron triggered</div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {/* Total Processed */}
          <div className="border-2 border-[#00FF85] bg-[#1a1a1a] p-4">
            <div className="text-[#888] text-xs mb-2">PROCESSED</div>
            <div className="text-[#00FF85] text-3xl font-bold">{stats.total_processed}</div>
            <div className="text-[#666] text-xs mt-2">products today</div>
          </div>

          {/* Success Rate */}
          <div className="border-2 border-[#00FF85] bg-[#1a1a1a] p-4">
            <div className="text-[#888] text-xs mb-2">SUCCESS RATE</div>
            <div className={`text-3xl font-bold ${stats.success_rate >= 90 ? 'text-[#00FF85]' : 'text-[#FFB800]'}`}>
              {stats.success_rate}%
            </div>
            <div className="text-[#666] text-xs mt-2">{stats.successful}/{stats.total_processed}</div>
          </div>

          {/* Avg Generation Time */}
          <div className="border-2 border-[#00FF85] bg-[#1a1a1a] p-4">
            <div className="text-[#888] text-xs mb-2">AVG TIME</div>
            <div className="text-[#00FF85] text-3xl font-bold">
              {(stats.avg_generation_time / 1000).toFixed(1)}s
            </div>
            <div className="text-[#666] text-xs mt-2">per image</div>
          </div>

          {/* Next Run */}
          <div className="border-2 border-[#00FF85] bg-[#1a1a1a] p-4">
            <div className="text-[#888] text-xs mb-2">NEXT RUN</div>
            <div className="text-[#00FF85] text-sm font-bold">
              {stats.next_run?.toLocaleTimeString() || '--:--'}
            </div>
            <div className="text-[#666] text-xs mt-2">
              {stats.next_run && Math.round((stats.next_run - new Date()) / 60000)} min
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Batch History */}
          <div className="lg:col-span-2 border-2 border-[#333] bg-[#1a1a1a] p-6">
            <div className="text-[#00FF85] mb-4 flex items-center gap-2">
              <Clock size={16} /> BATCH HISTORY
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {batches.map(batch => (
                <button
                  key={batch.id}
                  onClick={() => setSelectedBatch(batch)}
                  className={`w-full text-left p-3 border-2 transition ${
                    selectedBatch?.id === batch.id
                      ? 'border-[#00FF85] bg-[#0a2a0a]'
                      : 'border-[#333] hover:border-[#00FF85]'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#888]">
                      {batch.timestamp.toLocaleString()}
                    </span>
                    <span className={batch.status === 'running' ? 'text-[#00FF85] animate-pulse' : 'text-[#666]'}>
                      {batch.status === 'running' ? '● RUNNING' : '✓ DONE'}
                    </span>
                  </div>
                  <div className="flex justify-between mt-2 text-sm">
                    <span className="text-[#00FF85]">{batch.processed} processed</span>
                    <span className="text-[#00FF85]">{batch.success} success</span>
                    <span className="text-[#FF6666]">{batch.failed} failed</span>
                  </div>
                  <div className="w-full bg-black h-1 mt-2 border border-[#333]">
                    <div
                      className="h-full bg-[#00FF85]"
                      style={{ width: `${(batch.success / batch.processed) * 100}%` }}
                    />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Logs Panel */}
          <div className="border-2 border-[#333] bg-[#1a1a1a] p-6">
            <div className="text-[#00FF85] mb-4 flex items-center gap-2">
              <TrendingUp size={16} /> LOGS
            </div>
            <div className="space-y-1 max-h-96 overflow-y-auto font-mono text-xs">
              {logs.map((log, i) => (
                <div key={i} className="text-[#666]">
                  <span style={{ color: getStatusColor(log.level) }}>
                    {getStatusIcon(log.level)}
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
          <div className="mt-8 border-2 border-[#00FF85] bg-[#1a1a1a] p-6">
            <div className="text-[#00FF85] mb-4">BATCH DETAILS</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div>
                <div className="text-[#666] mb-1">Timestamp</div>
                <div className="text-[#00FF85]">{selectedBatch.timestamp.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-[#666] mb-1">Processed</div>
                <div className="text-[#00FF85]">{selectedBatch.processed}</div>
              </div>
              <div>
                <div className="text-[#666] mb-1">Success Rate</div>
                <div className="text-[#00FF85]">
                  {Math.round((selectedBatch.success / selectedBatch.processed) * 100)}%
                </div>
              </div>
              <div>
                <div className="text-[#666] mb-1">Avg Time</div>
                <div className="text-[#00FF85]">{selectedBatch.avg_time}ms</div>
              </div>
            </div>

            {/* Detailed breakdown */}
            <div className="mt-6 border-t border-[#333] pt-4">
              <div className="text-[#888] text-xs mb-3">Status Breakdown</div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-[#00FF85]">✓ Generated</span>
                  <span className="text-[#00FF85]">{selectedBatch.processed}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#00FF85]">✓ Uploaded</span>
                  <span className="text-[#00FF85]">{selectedBatch.success}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#FF6666]">✗ Failed</span>
                  <span className="text-[#FF6666]">{selectedBatch.failed}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer Controls */}
        <div className="mt-8 border-t border-[#333] pt-4 flex gap-4">
          <button
            onClick={() => {
              setLogs([]);
              setStats({ ...stats, last_run: new Date() });
            }}
            className="px-4 py-2 border-2 border-[#333] text-[#888] hover:border-[#00FF85] text-xs font-bold transition flex items-center gap-2"
          >
            <RefreshCw size={12} /> CLEAR LOGS
          </button>
          <button
            className="px-4 py-2 border-2 border-[#00FF85] bg-[#00FF85] text-black text-xs font-bold hover:bg-[#00dd77] transition"
          >
            EXPORT REPORT
          </button>
        </div>

        {/* Query example */}
        <div className="mt-8 border border-[#333] bg-black p-4 rounded text-xs text-[#666]">
          <div className="text-[#00FF85] mb-2">Supabase Query (realtime mode)</div>
          <pre className="overflow-x-auto">{`SELECT 
  product_id, nom, image_url,
  generation_time_ms, created_at,
  CASE WHEN image_url IS NOT NULL THEN 'success' ELSE 'failed' END AS status
FROM lumik_generations
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;`}</pre>
        </div>
      </div>
    </div>
  );
};

export default LumikBatchMonitor;
