import React, { useMemo } from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { BranchData } from '../types';

interface RadarVisualizerProps {
  branches: BranchData[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    // We expect payload to match original data
    return (
      <div className="glass-panel p-3 border border-gray-700 shadow-xl">
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

export const RadarVisualizer: React.FC<RadarVisualizerProps> = ({ branches }) => {
  // Normalize values between 0 and 100 based on their individual min/max
  const chartData = useMemo(() => {
    return branches.map((b) => {
      const range = b.max - b.min;
      const safeRange = range === 0 ? 1 : range;
      // Clamp the value between min and max before normalizing
      const clampedValue = Math.max(b.min, Math.min(b.max, b.value));
      const normalizedValue = ((clampedValue - b.min) / safeRange) * 100;
      
      return {
        subject: b.name || 'Unnamed',
        normalizedValue, 
        originalValue: b.value,
        min: b.min,
        max: b.max,
        color: b.color,
      };
    });
  }, [branches]);

  // For defining dynamic gradients or SVG defs
  return (
    <div className="w-full h-full min-h-[400px] flex items-center justify-center relative p-8 glass-panel overflow-hidden">
      {/* Background glow base */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-cyan-900/10 blur-[100px] rounded-full point-events-none" />
      
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart 
          cx="50%" 
          cy="50%" 
          outerRadius="75%" 
          data={chartData}
        >
          <PolarGrid stroke="rgba(255, 255, 255, 0.1)" />
          
          <PolarAngleAxis 
            dataKey="subject" 
            tick={(props: any) => {
              const { x, y, payload } = props;
              const branch = chartData.find(d => d.subject === payload.value);
              return (
                <text 
                  x={x} 
                  y={y} 
                  dy={4}
                  textAnchor="middle" 
                  fill={branch?.color || '#a0a0a0'}
                  className="text-xs md:text-sm font-bold tracking-wider"
                  style={{
                    textShadow: `0 0 10px ${branch?.color}80`
                  }}
                >
                  {payload.value}
                </text>
              );
            }} 
          />
          
          <PolarRadiusAxis 
            angle={90} 
            domain={[0, 100]} 
            tick={false} 
            axisLine={false} 
          />
          
          <Radar
            name="Radar"
            dataKey="normalizedValue"
            stroke="rgba(0, 240, 255, 0.8)"
            strokeWidth={3}
            fill="rgba(0, 240, 255, 0.2)"
            fillOpacity={0.6}
            dot={{
              r: 5,
              fillOpacity: 1,
            }}
            activeDot={{ r: 8, strokeWidth: 2 }}
          />
          
          {/* Render customized dots manually so they can be individually colored 
              Recharts natively applies the same dot color across the series, but we can override this
              by using a custom shape wrapper, but for simplicity we rely on the axis labels to carry the color
              weight and tooltips to show the true color context. */}
          
          <Tooltip content={<CustomTooltip />} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};
