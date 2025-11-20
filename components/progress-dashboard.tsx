'use client';

import { CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface ProgressDashboardProps {
  progress: {
    completed: number;
    total: number;
    currentBatch: number;
    videoUrls: string[];
  };
  isProcessing: boolean;
}

export function ProgressDashboard({
  progress,
  isProcessing,
}: ProgressDashboardProps) {
  const percentage = Math.round((progress.completed / progress.total) * 100);
  const remaining = progress.total - progress.completed;

  return (
    <div className="p-6 bg-slate-800 border border-slate-700 rounded-lg">
      <h3 className="text-lg font-semibold text-white mb-6">Processing Progress</h3>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-slate-300">Overall Progress</span>
          <span className="text-sm font-bold text-cyan-400">{percentage}%</span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-slate-700 rounded-lg border border-slate-600">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle size={16} className="text-green-400" />
            <span className="text-xs text-slate-400">Completed</span>
          </div>
          <p className="text-2xl font-bold text-green-400">{progress.completed}</p>
        </div>

        <div className="p-4 bg-slate-700 rounded-lg border border-slate-600">
          <div className="flex items-center gap-2 mb-1">
            <Clock size={16} className="text-yellow-400" />
            <span className="text-xs text-slate-400">Remaining</span>
          </div>
          <p className="text-2xl font-bold text-yellow-400">{remaining}</p>
        </div>

        <div className="p-4 bg-slate-700 rounded-lg border border-slate-600">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle size={16} className={isProcessing ? 'text-cyan-400' : 'text-slate-400'} />
            <span className="text-xs text-slate-400">Status</span>
          </div>
          <p className="text-2xl font-bold">
            <span className={isProcessing ? 'text-cyan-400' : 'text-slate-400'}>
              {isProcessing ? 'Processing' : 'Ready'}
            </span>
          </p>
        </div>
      </div>

      {/* Status Message */}
      <div className="mt-4 p-3 bg-slate-700 rounded text-sm text-slate-300">
        {progress.completed === 0 && 'Ready to start processing videos'}
        {progress.completed > 0 && progress.completed < progress.total && `Processing batch: ${progress.currentBatch}/${Math.ceil(progress.total / 5)}`}
        {progress.completed === progress.total && progress.total > 0 && 'All scenes processed! Ready to download.'}
      </div>
    </div>
  );
}