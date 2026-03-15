import React, { useMemo, useState, useEffect, useRef } from 'react';
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
  recenterTrigger?: number;
}

// Custom Tooltip specifically for Data Points (Radar hover)
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-black/95 backdrop-blur-xl border border-white/20 rounded-md p-3 shadow-2xl pointer-events-none">
        <p className="font-bold text-[13px] mb-1" style={{ color: data.color || '#fff' }}>
          {data.subject}
        </p>
        <p className="text-gray-300 font-mono text-xs mb-1">
          Valeur : <span className="text-cyan-400 font-bold text-[14px]">{data.originalValue}</span>
        </p>
        <p className="text-gray-500 font-mono text-[10px]">
          Min: {data.min} | Max: {data.max}
        </p>
      </div>
    );
  }
  return null;
};


// Custom Axis Tick with Hover & Description Support
const renderCustomTick = (props: any) => {
  const { x, y, payload, chartData, settings, hoveredPopup, setHoveredPopup, onLabelClick, onRemove, cx, cy } = props;
  const branch = chartData?.find((d: any) => d.subject === payload.value);

  if (!branch) return null; // Defensive crash prevention if branch was just removed

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
          className="overflow-visible"
          style={{ pointerEvents: 'all', zIndex: 9999 }}
        >
          <div
            className="flex flex-col gap-2 bg-black/95 backdrop-blur-xl border border-white/20 rounded-md p-3 shadow-2xl animate-in fade-in duration-100"
            style={{ pointerEvents: 'all' }}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-1">
              <span className="font-bold text-xs" style={{ color: labelColor }}>{branch.subject}</span>
              <button
                title={branch.isDeletable ? "Supprimer la compétence" : "Les compétences de base ne peuvent pas être supprimées"}
                disabled={!branch.isDeletable}
                className="radar-delete-button p-1 text-gray-400 hover:text-pink-500 hover:bg-pink-900/30 rounded disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                style={{ zIndex: 100000, position: 'relative' }}
                data-branch-id={branch.id}
              >
                <Trash2 size={12} />
              </button>
            </div>

            <p className="text-[10px] text-gray-300 font-mono leading-relaxed line-clamp-4 break-words custom-scrollbar overflow-y-auto max-h-[60px]">
              {branch.description || <span className="text-gray-600 italic">Aucune description fournie.</span>}
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
  onRemove,
  recenterTrigger
}) => {
  const [hoveredPopup, setHoveredPopup] = useState<string | null>(null);

  // Pan and Zoom states
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startDragPos, setStartDragPos] = useState({ x: 0, y: 0 });

  // Recenter trigger
  useEffect(() => {
    if (recenterTrigger && recenterTrigger > 0) {
      setScale(1);
      setPan({ x: 0, y: 0 });
    }
  }, [recenterTrigger]);

  // Global Event Listener Bypass for SVG Synthetic Bug Interception
  useEffect(() => {
    const handleGlobalInteraction = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement;
      const deleteBtn = target.closest('.radar-delete-button') as HTMLElement | null;

      if (deleteBtn) {
        // We caught a physical click on the trash button!
        e.preventDefault();
        e.stopPropagation();

        const branchId = deleteBtn.getAttribute('data-branch-id');
        if (branchId) {
          console.log('Suppression lancée pour la branche:', branchId);
          setIsDragging(false); // Disable map panning
          setHoveredPopup(null); // Clear tooltip
          setTimeout(() => onRemove?.(branchId), 0); // Destroy branch
        }
      }
    };

    // Use capture phase to seize the event before the SVG or Recharts Canvas eats it
    window.addEventListener('mousedown', handleGlobalInteraction, { capture: true });
    window.addEventListener('touchstart', handleGlobalInteraction, { capture: true });

    return () => {
      window.removeEventListener('mousedown', handleGlobalInteraction, { capture: true });
      window.removeEventListener('touchstart', handleGlobalInteraction, { capture: true });
    };
  }, [onRemove]);

  // Safe clearance of hovered popups if the branch is deleted while hovered
  useEffect(() => {
    if (hoveredPopup && !branches.find(b => b.id === hoveredPopup)) {
      setHoveredPopup(null);
    }
  }, [branches, hoveredPopup]);

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
        subject: b.name || 'Sans nom',
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

    // Generate unified polygon points string for the global fill
    const polygonPoints = points.map((p: any) => `${p.x},${p.y}`).join(' ');

    return (
      <g>
        {/* Global smooth radial fill (replaces hard triangular edges) */}
        <defs>
          <radialGradient id="globalRadialFill" cx="50%" cy="50%" r="50%">
            {settings.colorMode === 'multi' ? (
              <>
                <stop offset="0%" stopColor="rgba(255,255,255,0.1)" />
                <stop offset="100%" stopColor="rgba(0,0,0,0)" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor={primaryColor} stopOpacity={0.4} />
                <stop offset="100%" stopColor={primaryColor} stopOpacity={0.05} />
              </>
            )}
          </radialGradient>
        </defs>
        <polygon points={polygonPoints} fill="url(#globalRadialFill)" stroke="transparent" className="transition-all duration-500 pointer-events-none" />

        {/* Iterate edges to draw Multi-Color linear gradient perimeters */}
        {points.map((point: any, index: number) => {
          const nextIndex = (index + 1) % points.length;
          const nextPoint = points[nextIndex];
          const branchData = chartData[index];
          const nextBranchData = chartData[nextIndex];

          if (!branchData || !nextBranchData) return null; // Safe rendering fallback if deleting exactly during frame tick

          // Determine specific slice perimeter color
          const pathData = `M ${cx},${cy} L ${point.x},${point.y} L ${nextPoint.x},${nextPoint.y} Z`;
          let sliceStrokeContent = <line x1={point.x} y1={point.y} x2={nextPoint.x} y2={nextPoint.y} stroke={primaryColor} strokeWidth={3} className="transition-all duration-500 pointer-events-none" />;
          let dotColor = primaryColor;

          if (settings.colorMode === 'multi') {
            const gradId = `gradient-${index}-${nextIndex}`;
            sliceStrokeContent = (
              <>
                <defs>
                  <linearGradient id={`${gradId}-stroke`} x1={point.x} y1={point.y} x2={nextPoint.x} y2={nextPoint.y} gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor={branchData.color} />
                    <stop offset="100%" stopColor={nextBranchData.color} />
                  </linearGradient>
                </defs>
                <line x1={point.x} y1={point.y} x2={nextPoint.x} y2={nextPoint.y} stroke={`url(#${gradId}-stroke)`} strokeWidth={3} className="transition-all duration-500 pointer-events-none" />
              </>
            );
            dotColor = branchData.color;
          }

          return (
            <g key={`slice-${index}`}>
              {sliceStrokeContent}
              {/* Draw dot */}
              <circle
                cx={point.x}
                cy={point.y}
                r={4}
                fill={dotColor}
                stroke="rgba(0,0,0,0.5)"
                strokeWidth={1}
                className="pointer-events-none"
              />
            </g>
          );
        })}
      </g>
    );
  };

  // Interaction handlers for Pan and Zoom
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    // Determine zoom direction
    const zoomDelta = e.deltaY < 0 ? 0.1 : -0.1;
    let newScale = scale + zoomDelta;

    // constrain scaling limits
    newScale = Math.max(0.3, Math.min(newScale, 3));
    setScale(newScale);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only capture primary click for panning
    if (e.button !== 0) return;
    setIsDragging(true);
    setStartDragPos({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - startDragPos.x,
      y: e.clientY - startDragPos.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div
      className={`w-full h-full min-h-[400px] flex items-center justify-center relative p-2 md:p-8 glass-panel overflow-hidden ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Background glow base */}
      {settings.colorMode !== 'default' && (
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 blur-[100px] rounded-full pointer-events-none opacity-20 transition-colors duration-500"
          style={{ backgroundColor: primaryColor }}
        />
      )}

      {/* Spatial wrapper allowing Canvas panning/zooming */}
      <div
        className="w-full h-full flex items-center justify-center transition-transform duration-75 origin-center"
        style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})` }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart
            cx="50%"
            cy="50%"
            outerRadius="70%"
            data={chartData}
            className="overflow-visible" // Ensure pointer-events aren't blocked globally so CustomTicks can hover!
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

            <Tooltip 
              content={<CustomTooltip />} 
              wrapperStyle={{ pointerEvents: 'none', zIndex: 9999 }}
              isAnimationActive={false}
            />

            <Radar
              name="Radar"
              dataKey="normalizedValue"
              shape={renderCustomRadarShape}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
