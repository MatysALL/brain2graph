import React, { useMemo, useState } from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { BranchData, DisplaySettings } from '../types';
import { Settings2, Trash2 } from 'lucide-react';

interface RadarVisualizerProps {
  branches: BranchData[];
  settings: DisplaySettings;
  onLabelClick?: (branchId: string) => void;
  onRemove?: (branchId: string) => void;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="glass-panel p-3 border border-gray-700 shadow-xl z-50 relative pointer-events-none">
        <p className="font-bold text-white mb-1" style={{ color: data.color }}>{label}</p>
        <p className="text-sm text-gray-300">
          Value: <span className="font-mono text-white">{data.originalValue}</span>
        </p>
        <p className="text-xs text-gray-500">
          Bounds: [{data.min}, {data.max}]
        </p>
      </div>
    );
  }
  return null;
};

// Custom Axis Tick to handle clicks and render popups
const renderCustomTick = (props: any) => {
  const { x, y, payload, chartData, settings, activePopup, setActivePopup, onLabelClick, onRemove } = props;
  const branch = chartData.find((d: any) => d.subject === payload.value);

  if (!branch) return null;

  const isPopupActive = activePopup === branch.id;

  // Decide label color based on mode
  let labelColor = '#a0a0a0';
  if (settings.colorMode === 'multi') labelColor = branch.color;
  if (settings.colorMode === 'custom') labelColor = settings.customColor;

  return (
    <g transform={`translate(${x},${y})`}>
      <text
        dy={4}
        textAnchor="middle"
        fill={labelColor}
        className="font-bold tracking-wider cursor-pointer hover:opacity-80 transition-opacity select-none"
        style={{
          fontSize: 'var(--tick-size, 12px)',
          textShadow: settings.colorMode !== 'default' ? `0 0 10px ${labelColor}80` : 'none'
        }}
        onClick={(e) => {
          e.stopPropagation();
          setActivePopup(isPopupActive ? null : branch.id);
        }}
      >
        {payload.value}
      </text>

      {/* Floating HTML Popup rendered inside a foreignObject so it exists in the SVG tree */}
      {isPopupActive && (
        <foreignObject x="-60" y="15" width="120" height="40" className="overflow-visible z-50">
          <div
            className="flex items-center justify-center gap-1 bg-black/80 backdrop-blur-md border border-white/20 rounded-md p-1 shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              title="Scroll to Branch Settings"
              className="p-1.5 text-cyan-400 hover:bg-cyan-900/50 rounded transition-colors"
              onClick={() => {
                onLabelClick?.(branch.id);
                setActivePopup(null);
              }}
            >
              <Settings2 size={14} />
            </button>
            <div className="w-px h-4 bg-white/20 mx-1"></div>
            <button
              title={branch.isDeletable ? "Delete Branch" : "Core branches cannot be deleted"}
              disabled={!branch.isDeletable}
              className="p-1.5 text-gray-400 hover:text-pink-500 hover:bg-pink-900/30 rounded disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              onClick={() => {
                if (branch.isDeletable) {
                  onRemove?.(branch.id);
                  setActivePopup(null);
                }
              }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </foreignObject>
      )}
    </g>
  );
};

export const RadarVisualizer: React.FC<RadarVisualizerProps> = ({
  branches,
  settings,
  onLabelClick,
  onRemove
}) => {
  const [activePopup, setActivePopup] = useState<string | null>(null);

  // Normalize values between 0 and 100 based on their individual min/max
  const chartData = useMemo(() => {
    return branches.map((b) => {
      const range = b.max - b.min;
      const safeRange = range === 0 ? 1 : range;
      const clampedValue = Math.max(b.min, Math.min(b.max, b.value));
      const normalizedValue = ((clampedValue - b.min) / safeRange) * 100;

      return {
        id: b.id,
        subject: b.name || 'Unnamed',
        normalizedValue,
        originalValue: b.value,
        min: b.min,
        max: b.max,
        color: b.color,
        isDeletable: b.isDeletable
      };
    });
  }, [branches]);

  // Determine stroke/fill base colors
  let primaryColor = "rgba(0, 240, 255, 0.8)";
  let fillColor = "rgba(0, 240, 255, 0.2)";

  if (settings.colorMode === 'custom') {
    primaryColor = settings.customColor;
    fillColor = `${settings.customColor}40`; // Add transparency hex
  } else if (settings.colorMode === 'default') {
    primaryColor = "rgba(255, 255, 255, 0.8)";
    fillColor = "rgba(255, 255, 255, 0.1)";
  }

  return (
    <div
      className="w-full h-full min-h-[400px] flex items-center justify-center relative p-2 md:p-8 glass-panel overflow-hidden"
      onClick={() => setActivePopup(null)} // Click outside to close popups
    >
      {/* Background glow base */}
      {settings.colorMode !== 'default' && (
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 blur-[100px] rounded-full point-events-none opacity-20 transition-colors duration-500"
          style={{ backgroundColor: primaryColor }}
        />
      )}

      <ResponsiveContainer width="100%" height="100%">
        <RadarChart
          cx="50%"
          cy="50%"
          outerRadius="70%"
          data={chartData}
          className="overflow-visible"
        >
          <PolarGrid
            stroke={settings.showThresholds ? "rgba(255, 255, 255, 0.15)" : "transparent"}
          />

          <PolarAngleAxis
            dataKey="subject"
            tick={(props: any) => renderCustomTick({
              ...props,
              chartData,
              settings,
              activePopup,
              setActivePopup,
              onLabelClick,
              onRemove
            })}
          />

          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={settings.showThresholds ? { fill: 'rgba(255,255,255,0.3)', fontSize: 10 } : false}
            tickCount={5} // 0, 25, 50, 75, 100
            axisLine={false}
          />

          <Radar
            name="Radar"
            dataKey="normalizedValue"
            stroke={settings.colorMode === 'multi' ? "url(#colorGradient)" : primaryColor}
            strokeWidth={3}
            fill={settings.colorMode === 'multi' ? "rgba(255,255,255,0.05)" : fillColor}
            fillOpacity={settings.colorMode === 'multi' ? 1 : 0.6}
            dot={{
              r: 4,
              fillOpacity: 1,
              strokeWidth: 0
            }}
            activeDot={{ r: 8, strokeWidth: 2 }}
          />

          {/* We define a linear gradient just to give the radar shape a multi-color look when in multi mode,
              since Recharts doesn't natively support mapping colors per data point to the fill shape area itself easily without D3 */}
          {settings.colorMode === 'multi' && (
            <defs>
              <linearGradient id="colorGradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={chartData[0]?.color || '#00f0ff'} />
                <stop offset="50%" stopColor={chartData[1]?.color || '#ff007f'} />
                <stop offset="100%" stopColor={chartData[2]?.color || '#b026ff'} />
              </linearGradient>
            </defs>
          )}

          <Tooltip content={<CustomTooltip />} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};
