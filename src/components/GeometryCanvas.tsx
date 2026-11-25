import { useId, useRef, useState, type PointerEvent } from 'react';
import {
  Circle as CircleIcon,
  Compass,
  Dot,
  Eraser,
  Eye,
  EyeOff,
  Minus,
  PenTool,
  RotateCcw,
  Square,
} from 'lucide-react';
import type { GeometryShape } from '../types/math';

export type GeometryTool = 'segment' | 'circle' | 'point' | 'rightAngle' | 'freehand';

interface GeometryCanvasProps {
  width?: number;
  height?: number;
  baseShapes: GeometryShape[];
  shapes: GeometryShape[];
  onChange?: (next: GeometryShape[]) => void;
  teacherCorrectionShapes?: GeometryShape[];
  showTeacherCorrection?: boolean;
  onToggleTeacherCorrection?: () => void;
  readOnly?: boolean;
  drawColor?: string;
  accentLabel?: string;
  testId?: string;
}

const POINT_LABELS = ['O', 'M', 'N', 'H', 'P', 'I', 'J', 'K', 'D', 'E'];

function renderShapeSvg(s: GeometryShape, keyPrefix: string, idx: number, overrideOpacity = 1) {
  const k = `${keyPrefix}_${s.id || idx}`;
  if (s.kind === 'segment') {
    const mx = (s.x1 + s.x2) / 2;
    const my = (s.y1 + s.y2) / 2;
    return (
      <g key={k} opacity={overrideOpacity}>
        <line
          x1={s.x1}
          y1={s.y1}
          x2={s.x2}
          y2={s.y2}
          stroke={s.color || '#3E1591'}
          strokeWidth={2.6}
          strokeLinecap="round"
          strokeDasharray={s.dashed ? '6 5' : undefined}
        />
        {s.label && (
          <g transform={`translate(${mx}, ${my - 9})`}>
            <rect
              x={-28}
              y={-11}
              width={56}
              height={16}
              rx={5}
              fill="rgba(255,255,255,0.9)"
              stroke={s.color || '#D6C9F3'}
              strokeWidth={0.8}
            />
            <text
              x={0}
              y={0}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="11"
              fontWeight="700"
              fill={s.color || '#22163F'}
              direction="ltr"
            >
              {s.label}
            </text>
          </g>
        )}
      </g>
    );
  }

  if (s.kind === 'circle') {
    return (
      <g key={k} opacity={overrideOpacity}>
        <circle
          cx={s.cx}
          cy={s.cy}
          r={Math.max(4, s.r)}
          fill="none"
          stroke={s.color || '#059669'}
          strokeWidth={2.2}
          strokeDasharray={s.dashed ? '6 4' : undefined}
        />
        {s.label && (
          <text
            x={s.cx + s.r * 0.72}
            y={s.cy - s.r * 0.72}
            fontSize="12"
            fontWeight="700"
            fill={s.color || '#059669'}
          >
            {s.label}
          </text>
        )}
      </g>
    );
  }

  if (s.kind === 'point') {
    return (
      <g key={k} opacity={overrideOpacity}>
        <circle cx={s.x} cy={s.y} r={4.2} fill={s.color || '#22163F'} stroke="#fff" strokeWidth={1.4} />
        {s.label && (
          <text
            x={s.x + 8}
            y={s.y - 8}
            fontSize="13"
            fontWeight="800"
            fill={s.color || '#22163F'}
          >
            {s.label}
          </text>
        )}
      </g>
    );
  }

  if (s.kind === 'rightAngle') {
    const size = 14;
    const dx1 = s.ux - s.vx;
    const dy1 = s.uy - s.vy;
    const len1 = Math.hypot(dx1, dy1) || 1;
    const dx2 = s.wx - s.vx;
    const dy2 = s.wy - s.vy;
    const len2 = Math.hypot(dx2, dy2) || 1;
    const p1x = s.vx + (dx1 / len1) * size;
    const p1y = s.vy + (dy1 / len1) * size;
    const p2x = s.vx + (dx2 / len2) * size;
    const p2y = s.vy + (dy2 / len2) * size;
    const p3x = p1x + (dx2 / len2) * size;
    const p3y = p1y + (dy2 / len2) * size;
    return (
      <path
        key={k}
        opacity={overrideOpacity}
        d={`M ${p1x} ${p1y} L ${p3x} ${p3y} L ${p2x} ${p2y}`}
        fill="rgba(231,163,62,0.16)"
        stroke={s.color || '#E7A33E'}
        strokeWidth={2}
      />
    );
  }

  if (s.kind === 'freehand') {
    if (!s.points || s.points.length < 2) return null;
    const d = s.points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    return (
      <path
        key={k}
        opacity={overrideOpacity}
        d={d}
        fill="none"
        stroke={s.color || '#6D28D9'}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    );
  }

  if (s.kind === 'text') {
    return (
      <text
        key={k}
        opacity={overrideOpacity}
        x={s.x}
        y={s.y}
        textAnchor="middle"
        fontSize="12"
        fontWeight="700"
        fill={s.color || '#047857'}
        direction="ltr"
      >
        {s.text}
      </text>
    );
  }

  return null;
}

export function GeometryCanvas({
  width = 480,
  height = 320,
  baseShapes,
  shapes,
  onChange,
  teacherCorrectionShapes = [],
  showTeacherCorrection = false,
  onToggleTeacherCorrection,
  readOnly = false,
  drawColor = '#2563EB',
  accentLabel,
  testId = 'geometry-canvas',
}: GeometryCanvasProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const patternPrefix = useId().replace(/:/g, '_');
  const smallGridId = `mathGridSmall_${patternPrefix}`;
  const largeGridId = `mathGridLarge_${patternPrefix}`;
  const [tool, setTool] = useState<GeometryTool>('segment');
  const [draftShape, setDraftShape] = useState<GeometryShape | null>(null);
  const [snapPoints, setSnapPoints] = useState<{ x: number; y: number } | null>(null);
  const startPtRef = useRef<{ x: number; y: number } | null>(null);

  const allPoints = [...baseShapes, ...shapes]
    .filter((s): s is Extract<GeometryShape, { kind: 'point' }> => s.kind === 'point')
    .map((p) => ({ x: p.x, y: p.y }));

  function toSvgCoords(e: PointerEvent<SVGSVGElement>): { x: number; y: number } {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const rawX = ((e.clientX - rect.left) / Math.max(1, rect.width)) * width;
    const rawY = ((e.clientY - rect.top) / Math.max(1, rect.height)) * height;
    const clampedX = Math.max(4, Math.min(width - 4, Math.round(rawX)));
    const clampedY = Math.max(4, Math.min(height - 4, Math.round(rawY)));

    // Snap to existing vertex within 14px for crisp geometric construction
    for (const pt of allPoints) {
      if (Math.hypot(pt.x - clampedX, pt.y - clampedY) <= 14) {
        return { x: pt.x, y: pt.y };
      }
    }
    return { x: clampedX, y: clampedY };
  }

  function handlePointerDown(e: PointerEvent<SVGSVGElement>) {
    if (readOnly || !onChange) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const pt = toSvgCoords(e);

    if (tool === 'point') {
      const existingPointCount = shapes.filter((s) => s.kind === 'point').length;
      const label = POINT_LABELS[existingPointCount % POINT_LABELS.length];
      const next: GeometryShape = {
        id: `pt_${Date.now()}`,
        kind: 'point',
        x: pt.x,
        y: pt.y,
        label,
        color: drawColor,
      };
      onChange([...shapes, next]);
      return;
    }

    if (tool === 'rightAngle') {
      const next: GeometryShape = {
        id: `ra_${Date.now()}`,
        kind: 'rightAngle',
        vx: pt.x,
        vy: pt.y,
        ux: pt.x,
        uy: pt.y - 40,
        wx: pt.x + 40,
        wy: pt.y,
        color: drawColor,
      };
      onChange([...shapes, next]);
      return;
    }

    startPtRef.current = pt;

    if (tool === 'segment') {
      setDraftShape({
        id: 'draft',
        kind: 'segment',
        x1: pt.x,
        y1: pt.y,
        x2: pt.x,
        y2: pt.y,
        color: drawColor,
      });
    } else if (tool === 'circle') {
      setDraftShape({
        id: 'draft',
        kind: 'circle',
        cx: pt.x,
        cy: pt.y,
        r: 8,
        color: drawColor,
        dashed: true,
      });
    } else if (tool === 'freehand') {
      setDraftShape({
        id: 'draft',
        kind: 'freehand',
        points: [pt],
        color: drawColor,
      });
    }
  }

  function handlePointerMove(e: PointerEvent<SVGSVGElement>) {
    const pt = toSvgCoords(e);
    const snapped = allPoints.some((p) => p.x === pt.x && p.y === pt.y);
    setSnapPoints(snapped ? pt : null);

    if (!draftShape || !startPtRef.current) return;
    const start = startPtRef.current;

    if (draftShape.kind === 'segment') {
      setDraftShape({ ...draftShape, x2: pt.x, y2: pt.y });
    } else if (draftShape.kind === 'circle') {
      const r = Math.max(8, Math.round(Math.hypot(pt.x - start.x, pt.y - start.y)));
      setDraftShape({ ...draftShape, r });
    } else if (draftShape.kind === 'freehand') {
      setDraftShape({
        ...draftShape,
        points: [...draftShape.points.slice(-80), pt],
      });
    }
  }

  function handlePointerUp() {
    if (!draftShape || !onChange) {
      setDraftShape(null);
      startPtRef.current = null;
      return;
    }
    const valid =
      (draftShape.kind === 'segment' &&
        Math.hypot(draftShape.x2 - draftShape.x1, draftShape.y2 - draftShape.y1) >= 8) ||
      (draftShape.kind === 'circle' && draftShape.r >= 10) ||
      (draftShape.kind === 'freehand' && draftShape.points.length >= 3);

    if (valid) {
      onChange([...shapes, { ...draftShape, id: `sh_${Date.now()}` }]);
    }
    setDraftShape(null);
    startPtRef.current = null;
  }

  const tools: { id: GeometryTool; label: string; icon: typeof Minus }[] = [
    { id: 'segment', label: 'قطعة مستقيمة', icon: Minus },
    { id: 'circle', label: 'دائرة / قوس', icon: CircleIcon },
    { id: 'point', label: 'نقطة', icon: Dot },
    { id: 'rightAngle', label: 'زاوية قائمة', icon: Square },
    { id: 'freehand', label: 'قلم حر', icon: PenTool },
  ];

  return (
    <div className="space-y-2.5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#E6DEF8] bg-[#FAF8FF] p-2">
        {!readOnly ? (
          <div className="flex flex-wrap items-center gap-1.5">
            {tools.map((t) => {
              const Icon = t.icon;
              const active = tool === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTool(t.id)}
                  className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold transition ${
                    active
                      ? 'bg-[#6D28D9] text-white shadow-xs'
                      : 'border border-[#E6DEF8] bg-white text-[#22163F] hover:border-[#6D28D9]'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-2 text-xs font-bold text-[#3E1591]">
            <Compass className="h-4 w-4" />
            <span>{accentLabel || 'لوحة الشكل الهندسي'}</span>
          </div>
        )}

        <div className="flex items-center gap-1.5">
          {teacherCorrectionShapes.length > 0 && onToggleTeacherCorrection && (
            <button
              type="button"
              onClick={onToggleTeacherCorrection}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold transition ${
                showTeacherCorrection
                  ? 'bg-emerald-600 text-white'
                  : 'border border-emerald-300 bg-emerald-50 text-emerald-800'
              }`}
            >
              {showTeacherCorrection ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              <span>{showTeacherCorrection ? 'إخفاء تصحيح الأستاذ' : 'عرض تصحيح الأستاذ'}</span>
            </button>
          )}

          {!readOnly && onChange && (
            <>
              <button
                type="button"
                disabled={shapes.length === 0}
                onClick={() => onChange(shapes.slice(0, -1))}
                className="flex items-center gap-1 rounded-lg border border-[#D6C9F3] bg-white px-2.5 py-1.5 text-xs font-bold text-[#3E1591] disabled:opacity-40"
                title="تراجع عن آخر خطوة"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>تراجع</span>
              </button>
              <button
                type="button"
                disabled={shapes.length === 0}
                onClick={() => onChange([])}
                className="flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-bold text-rose-700 disabled:opacity-40"
                title="مسح كل الرسم"
              >
                <Eraser className="h-3.5 w-3.5" />
                <span>مسح</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Interactive SVG Grid Notebook Surface */}
      <div className="overflow-hidden rounded-2xl border-2 border-[#D6C9F3] bg-white shadow-xs">
        <svg
          ref={svgRef}
          data-testid={testId}
          viewBox={`0 0 ${width} ${height}`}
          className={`block w-full select-none touch-none ${readOnly ? 'cursor-default' : 'cursor-crosshair'}`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          <defs>
            <pattern id={smallGridId} width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(109,40,217,0.09)" strokeWidth="1" />
            </pattern>
            <pattern id={largeGridId} width="100" height="100" patternUnits="userSpaceOnUse">
              <rect width="100" height="100" fill={`url(#${smallGridId})`} />
              <path d="M 100 0 L 0 0 0 100" fill="none" stroke="rgba(109,40,217,0.16)" strokeWidth="1.2" />
            </pattern>
          </defs>

          <rect x={0} y={0} width={width} height={height} fill="#FAF8FF" />
          <rect x={0} y={0} width={width} height={height} fill={`url(#${largeGridId})`} />

          {/* Base problem figure */}
          {baseShapes.map((s, idx) => renderShapeSvg(s, 'base', idx))}

          {/* User/Student or Teacher active drawing */}
          {shapes.map((s, idx) => renderShapeSvg(s, 'usr', idx))}

          {/* Live drag draft */}
          {draftShape && renderShapeSvg(draftShape, 'draft', 0, 0.75)}

          {/* Teacher correction overlay */}
          {showTeacherCorrection &&
            teacherCorrectionShapes.map((s, idx) => renderShapeSvg(s, 'tcor', idx, 0.95))}

          {/* Vertex snap indicator */}
          {!readOnly && snapPoints && (
            <circle
              cx={snapPoints.x}
              cy={snapPoints.y}
              r={8}
              fill="rgba(231,163,62,0.28)"
              stroke="#E7A33E"
              strokeWidth={1.8}
            />
          )}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-[11px] font-semibold text-[#6E6390]">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#3E1591]" />
            معطيات الشكل
          </span>
          {!readOnly && (
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: drawColor }} />
              رسمك ({shapes.length})
            </span>
          )}
          {showTeacherCorrection && teacherCorrectionShapes.length > 0 && (
            <span className="inline-flex items-center gap-1.5 text-emerald-700">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-600" />
              تصحيح الأستاذ المرسوم
            </span>
          )}
        </div>
        {!readOnly && <span>اسحب بالماوس أو الإصبع على الشبكة للرسم (يلتقط النقاط تلقائياً)</span>}
      </div>
    </div>
  );
}
