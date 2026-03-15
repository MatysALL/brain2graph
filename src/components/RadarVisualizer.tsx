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

// Custom Axis Tick with Hover & Description Support
const renderCustomTick = (props: any) => {
  const { x, y, payload, chartData, settings, hoveredPopup, setHoveredPopup, onLabelClick, onRemove, cx, cy } = props;
  const branch = chartData.find((d: any) => d.subject === payload.value);

  if (!branch) return null;

  const isPopupActive = hoveredPopup === branch.id;

  // Decide label color based on mode
  let labelColor = '#a0a0a0';
  if (settings.colorMode === 'multi') labelColor = branch.color;
  if (settings.colorMode === 'custom') labelColor = settings.customColor;

  // Calculate the angle to push the popup slightly outward from the text center
  const angle = Math.atan2(y - cy, x - cx);
  const offsetDistance = 20; // Distance to push popup outwards
  const hoverX = x + Math.cos(angle) * offsetDistance;
  const hoverY = y + Math.sin(angle) * offsetDistance;

  // Generate Radial Ticks if threshold mode is ON
  // Recharts PolarAngleAxis trick: rendering custom SVG geometry inside the label hook to mimic radius ticks across every spoke.
  const tickPercents = [25, 50, 75, 100];
  const radiusRange = props.radius || 150; // Approximated fallback if radius missing

  return (
    <g 
      onMouseEnter={() => setHoveredPopup(branch.id)}
      onMouseLeave={() => setHoveredPopup(null)}
    >
      {/* Invisible bridge to maintain hover state between text and popup */}
      <circle cx={x} cy={y} r={40} fill="transparent" />

      {/* Ticks rendered along this specific axis if Guides are ON */}
      {settings.showThresholds && tickPercents.map((pct) => {
        const tickRadius = (pct / 100) * radiusRange;
        const tickX = cx + tickRadius * Math.cos(angle);
        const tickY = cy + tickRadius * Math.sin(angle);
        
        const realValue = branch.min + (branch.max - branch.min) * (pct / 100);
        
        return (
          <text
            key={`${branch.id}-tick-${pct}`}
            x={tickX}
            y={tickY}
            fill="rgba(255,255,255,0.3)"
            fontSize="10"
            textAnchor="middle"
            dy={4}
            className="pointer-events-none select-none"
          >
            {Number.isInteger(realValue) ? realValue : realValue.toFixed(1)}
          </text>
        );
      })}
      
      {/* Base Zero Tick */}
      {settings.showThresholds && (
         <text x={cx} y={cy} dy={4} fill="rgba(255,255,255,0.3)" fontSize="10" textAnchor="middle" className="pointer-events-none select-none">{branch.min}</text>
      )}

      {/* Primary Axis Label */}
      <text
        x={x}
        y={y}
        dy={4}
        textAnchor="middle"
        fill={labelColor}
        className="font-bold tracking-wider cursor-default transition-opacity select-none"
        style={{
          fontSize: 'var(--tick-size, 12px)',
          textShadow: settings.colorMode !== 'default' ? `0 0 10px ${labelColor}80` : 'none'
        }}
      >
        {payload.value}
      </text>

      {/* Floating Hover Tooltip rendered inside a foreignObject */}
      {isPopupActive && (
        <foreignObject 
          x={hoverX - 75} 
          y={hoverY} 
          width="150" 
          height="120" 
          className="overflow-visible z-50 pointer-events-auto"
        >
          <div
            className="flex flex-col gap-2 bg-black/95 backdrop-blur-xl border border-white/20 rounded-md p-3 shadow-2xl animate-in fade-in duration-100"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-1">
              <span className="font-bold text-xs" style={{ color: labelColor }}>{branch.subject}</span>
              <button
                title={branch.isDeletable ? "Delete Branch" : "Core branches cannot be deleted"}
                disabled={!branch.isDeletable}
                className="p-1 text-gray-400 hover:text-pink-500 hover:bg-pink-900/30 rounded disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  if (branch.isDeletable) {
                    onRemove?.(branch.id);
                    setHoveredPopup(null);
                  }
                }}
              >
                <Trash2 size={12} />
              </button>
            </div>
            
            <p className="text-[10px] text-gray-300 font-mono leading-relaxed line-clamp-4 break-words custom-scrollbar overflow-y-auto max-h-[60px]">
              {branch.description || <span className="text-gray-600 italic">No description provided.</span>}
            </p>
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
  const [hoveredPopup, setHoveredPopup] = useState<string | null>(null);

  // Normalize values between 0 and 100 based on their individual min/max
  const chartData = useMemo(() => {
    return branches.map((b) => {
      const range = b.max - b.min;
      const safeRange = range === 0 ? 1 : range;
      // Ensure we don't exceed min/max for charting bounds
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
        description: b.description,
        isDeletable: b.isDeletable
      };
    });
  }, [branches]);

  // Determine global stroke/fill base colors
  let primaryColor = "rgba(0, 240, 255, 0.8)";
  let fillColor = "rgba(0, 240, 255, 0.2)";

  if (settings.colorMode === 'custom') {
    primaryColor = settings.customColor;
    fillColor = `${settings.customColor}40`;
  } else if (settings.colorMode === 'default') {
    primaryColor = "rgba(255, 255, 255, 0.8)";
    fillColor = "rgba(255, 255, 255, 0.1)";
  }

  // Custom Shape renderer to draw multi-colored slices for the Radar.
  // We use the 'Radar' component's shape prop to override its entire rendering logic.
  const renderCustomRadarShape = (props: any) => {
    const { points } = props;
    if (!points || points.length === 0) return <g></g>;

    const cx = props.cx || 0;
    const cy = props.cy || 0;

    return (
      <g>
        {points.map((point: any, index: number) => {
          const nextIndex = (index + 1) % points.length;
          const nextPoint = points[nextIndex];
          const branchData = chartData[index];

          // Determine specific slice color
          const pathData = `M ${cx},${cy} L ${point.x},${point.y} L ${nextPoint.x},${nextPoint.y} Z`;
          let sliceFillContent = <path d={pathData} fill={fillColor} stroke="transparent" className="transition-all duration-500" />;
          let sliceStrokeContent = <line x1={point.x} y1={point.y} x2={nextPoint.x} y2={nextPoint.y} stroke={primaryColor} strokeWidth={3} />;
          let dotColor = primaryColor;
          
          if (settings.colorMode === 'multi') {
            const gradId = `gradient-${index}-${nextIndex}`;
            sliceFillContent = (
              <>
                <defs>
                  <linearGradient id={gradId} x1={point.x} y1={point.y} x2={nextPoint.x} y2={nextPoint.y} gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor={branchData.color} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={chartData[nextIndex].color} stopOpacity={0.4} />
                  </linearGradient>
                  <linearGradient id={`${gradId}-stroke`} x1={point.x} y1={point.y} x2={nextPoint.x} y2={nextPoint.y} gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor={branchData.color} />
                    <stop offset="100%" stopColor={chartData[nextIndex].color} />
                  </linearGradient>
                </defs>
                <path d={pathData} fill={`url(#${gradId})`} stroke="transparent" className="transition-all duration-500" />
              </>
            );
            sliceStrokeContent = (
              <line x1={point.x} y1={point.y} x2={nextPoint.x} y2={nextPoint.y} stroke={`url(#${gradId}-stroke)`} strokeWidth={3} />
            );
            dotColor = branchData.color;
          }

          return (
            <g key={`slice-${index}`}>
              {sliceFillContent}
              {sliceStrokeContent}
              {/* Draw dot */}
              <circle
                cx={point.x}
                cy={point.y}
                r={4}
                fill={dotColor}
                stroke="rgba(0,0,0,0.5)"
                strokeWidth={1}
              />
            </g>
          );
        })}
      </g>
    );
  };

  return (
    <div className="w-full h-full min-h-[400px] flex items-center justify-center relative p-2 md:p-8 glass-panel overflow-hidden">
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
          className="overflow-visible !pointer-events-none" // Make chart not gobble unhandled mouse events
        >
          <PolarGrid
            stroke="rgba(255, 255, 255, 0.15)"
          />

          <PolarAngleAxis
            dataKey="subject"
            tick={(props: any) => renderCustomTick({
              ...props,
              chartData,
              settings,
              hoveredPopup,
              setHoveredPopup,
              onRemove
            })}
          />

          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={false}
            tickCount={5} // 0, 25, 50, 75, 100
            axisLine={false}
          />

          <Radar
            name="Radar"
            dataKey="normalizedValue"
            shape={renderCustomRadarShape}
          />

          <Tooltip content={<CustomTooltip />} wrapperStyle={{ pointerEvents: 'none', zIndex: 100 }} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};
