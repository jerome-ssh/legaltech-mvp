import { MatterProgress } from '@/types/matter';
import { FileText, Briefcase, CheckCircle } from 'lucide-react';

interface ProgressBarProps {
  progress: MatterProgress;
  showDetails?: boolean;
  compact?: boolean;
}

export function ProgressBar({ progress, showDetails = false, compact = false }: ProgressBarProps) {
  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'Intake':
      case 'Billing':
        return '#ec4899'; // Tailwind pink-400
      case 'Active Work':
        return '#facc15'; // Tailwind yellow-400
      case 'Closure':
      case 'Finalization':
        return '#22c55e'; // Tailwind green-500
      default:
        return '#e5e7eb'; // Tailwind gray-200
    }
  };

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case 'Intake':
      case 'Billing':
        return <FileText className="w-4 h-4 text-pink-400" aria-label="Intake/Billing" />;
      case 'Active Work':
        return <Briefcase className="w-4 h-4 text-yellow-400" aria-label="Active Work" />;
      case 'Closure':
      case 'Finalization':
        return <CheckCircle className="w-4 h-4 text-green-500" aria-label="Closure/Finalization" />;
      default:
        return <FileText className="w-4 h-4 text-gray-400" aria-label="Other" />;
    }
  };

  const stageLegend = [
    { color: 'bg-pink-400', label: 'Intake/Billing', icon: <FileText className="w-3 h-3 text-pink-400" /> },
    { color: 'bg-yellow-400', label: 'Active Work', icon: <Briefcase className="w-3 h-3 text-yellow-400" /> },
    { color: 'bg-green-500', label: 'Closure/Finalization', icon: <CheckCircle className="w-3 h-3 text-green-500" /> },
  ];

  const barAnim = 'transition-all duration-700 ease-in-out';

  // Define fixed weights for each stage (total should sum to 100)
  const stageWeights: Record<string, number> = {
    Intake: 20,
    'Active Work': 60,
    Closure: 20,
  };

  // For demo: if all values are 0, simulate Intake as 100%
  let byStage = progress?.by_stage || {};
  const allStages = Object.keys(stageWeights);
  const allZero = allStages.every(stage => !byStage[stage] || byStage[stage] === 0);
  if (allZero) {
    byStage = { Intake: 100, 'Active Work': 0, Closure: 0 };
  } else {
    // Ensure all stages are present for consistent rendering
    allStages.forEach(stage => { if (!(stage in byStage)) byStage[stage] = 0; });
  }

  // Use the overall progress from the database
  let overall = progress?.overall || 0;
  overall = (overall % 1 === 0) ? Math.round(overall) : Math.round(overall * 10) / 10;

  // Helper to format percent for display
  const formatPercent = (value: number) => {
    return value % 1 === 0 ? Math.round(value) : value.toFixed(1);
  };

  // Use custom color for Intake and handle gradient transitions
  const intakeColor = 'rgba(240, 105, 177, 0.7)'; // #f069b1 with reduced opacity
  const activeWorkColor = '#facc15'; // yellow
  const closureColor = '#22c55e'; // green

  // Determine the color or gradient for the completed segment
  let completedColor = intakeColor;
  let backgroundStyle: React.CSSProperties = {};
  if (byStage['Closure'] > 0 && byStage['Active Work'] > 0 && byStage['Intake'] > 0) {
    // All three stages have progress: gradient from pink to yellow to green
    backgroundStyle.background = `linear-gradient(90deg, ${intakeColor} 0%, ${activeWorkColor} 50%, ${closureColor} 100%)`;
  } else if (byStage['Active Work'] > 0 && byStage['Intake'] > 0) {
    // Intake and Active Work: gradient from pink to yellow
    backgroundStyle.background = `linear-gradient(90deg, ${intakeColor} 0%, ${activeWorkColor} 100%)`;
  } else if (byStage['Closure'] > 0) {
    completedColor = closureColor;
    backgroundStyle.background = closureColor;
  } else if (byStage['Active Work'] > 0) {
    completedColor = activeWorkColor;
    backgroundStyle.background = activeWorkColor;
  } else {
    backgroundStyle.background = intakeColor;
  }

  return (
    <div className={compact ? 'space-y-2' : 'space-y-4'}>
      {!compact && (
        <div className="flex gap-3 items-center mb-1">
          {stageLegend.map((s, i) => (
            <div key={i} className="flex items-center gap-1 text-xs" aria-label={s.label} title={s.label}>
              {s.icon}
              <span className="hidden sm:inline" style={{ color: s.color }}>{s.label}</span>
            </div>
          ))}
        </div>
      )}
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <h3 className={compact ? "text-[11px] font-medium text-blue-600 opacity-70" : "text-xs font-medium text-blue-700"}>Overall Progress</h3>
          <span className={compact ? "text-[11px] text-gray-400 font-mono" : "text-xs text-gray-500 font-mono"}>{formatPercent(overall)}%</span>
        </div>
        <div
          className={compact ? "h-2 rounded-full overflow-hidden shadow bg-gray-200 flex" : "h-3 bg-gray-300 rounded-full overflow-hidden shadow-sm flex"}
          style={{
            background: '#e5e7eb',
            boxShadow: compact ? '0 1px 6px 0 rgba(60, 120, 200, 0.10)' : undefined,
          }}
        >
          <div
            className={compact ? `h-full transition-all duration-700 ease-in-out` : `h-full ${barAnim}`}
            style={{
              width: `${overall}%`,
              ...backgroundStyle,
              borderTopLeftRadius: 999,
              borderBottomLeftRadius: 999,
              borderTopRightRadius: overall === 100 ? 999 : 0,
              borderBottomRightRadius: overall === 100 ? 999 : 0,
              transition: 'width 0.7s cubic-bezier(0.4,0,0.2,1)',
            }}
            aria-label={`Completed progress: ${formatPercent(overall)}%`}
          >
            <span className="sr-only">Completed {formatPercent(overall)}%</span>
          </div>
          <div
            className={compact ? `h-full transition-all duration-700 ease-in-out` : `h-full ${barAnim}`}
            style={{
              width: `${100 - overall}%`,
              background: '#e5e7eb',
              borderTopRightRadius: 999,
              borderBottomRightRadius: 999,
              transition: 'width 0.7s cubic-bezier(0.4,0,0.2,1)',
            }}
            aria-label={`Remaining progress: ${formatPercent(100 - overall)}%`}
          >
            <span className="sr-only">Remaining {formatPercent(100 - overall)}%</span>
          </div>
        </div>
      </div>
      {showDetails && byStage && (
        <div className="space-y-2">
          {Object.entries(byStage).map(([stage, value]) => (
            <div key={stage} className="space-y-1">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1">
                  {getStageIcon(stage)}
                  <span title={stage} className="text-xs font-medium text-gray-700 cursor-help">{stage}</span>
                </div>
                <span className="text-xs text-gray-500 font-mono">{typeof value === 'number' && !isNaN(value) ? formatPercent(value) : 0}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden shadow-sm">
                <div
                  className={`h-full ${barAnim} rounded-full`}
                  style={{ width: `${typeof value === 'number' && !isNaN(value) ? value : 0}%` }}
                  aria-label={`${stage} progress: ${formatPercent(value)}%`}
                />
              </div>
            </div>
          ))}
        </div>
      )}
      {showDetails && (
        <div className="grid grid-cols-2 gap-4 text-xs mt-2">
          <div>
            <p className="text-gray-400">Tasks</p>
            <p className="font-medium">{progress.completed_tasks} / {progress.total_tasks}</p>
          </div>
          <div>
            <p className="text-gray-400">Weight</p>
            <p className="font-medium">{progress.completed_weight} / {progress.total_weight}</p>
          </div>
        </div>
      )}
    </div>
  );
} 