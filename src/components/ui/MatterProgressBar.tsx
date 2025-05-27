import React from 'react';

interface MatterProgressBarProps {
  progress: number; // 0-100
  showLabel?: boolean;
}

const getStage = (progress: number) => {
  if (progress <= 50) return { label: 'Intake & Setup', color: 'bg-green-500' };
  if (progress <= 87.5) return { label: 'Active Work', color: 'bg-yellow-500' };
  return { label: 'Closure & Billing', color: 'bg-red-500' };
};

const MatterProgressBar: React.FC<MatterProgressBarProps> = ({ progress, showLabel = true }) => {
  const { label, color } = getStage(progress);
  return (
    <div className="w-full flex flex-col gap-1">
      <div className="relative w-full h-4 rounded-full bg-gray-200 overflow-hidden">
        <div
          className={`absolute left-0 top-0 h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${progress}%` }}
        />
        {showLabel && (
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-semibold text-white drop-shadow">
            {progress}%
          </span>
        )}
      </div>
      {showLabel && (
        <div className="text-xs text-gray-500 text-center mt-0.5">{label}</div>
      )}
    </div>
  );
};

export default MatterProgressBar; 