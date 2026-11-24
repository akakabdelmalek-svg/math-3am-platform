import type {
  DifficultyLevel,
  Exercise,
  GeometryExerciseData,
  GeometryShape,
  GeometryTemplateKey,
  Question,
} from '../types/math.ts';

export const GEOMETRY_CANVAS_WIDTH = 480;
export const GEOMETRY_CANVAS_HEIGHT = 320;

export interface GeometryTemplateMeta {
  key: Exclude<GeometryTemplateKey, 'custom'>;
  label: string;
  chapter: string;
  shortDesc: string;
}

export const GEOMETRY_TEMPLATES: GeometryTemplateMeta[] = [
  {
    key: 'pythagoras',
    label: 'نظرية فيثاغورس والمثلث القائم',
    chapter: 'المثلث القائم والدائرة ونظرية فيثاغورس',
    shortDesc: 'إنشاء الوتر وحساب الأطوال باستعمال خاصية فيثاغورس',
  },
  {
    key: 'circumcircle',
    label: 'الدائرة المحيطة بالمثلث القائم',
    chapter: 'المثلث القائم والدائرة ونظرية فيثاغورس',
    shortDesc: 'تعيين منتصف الوتر، المتوسط المتعلق بالوتر، ورسم الدائرة المحيطة',
  },
  {
    key: 'midsegment',
    label: 'خاصية مستقيم المنتصفين',
    chapter: 'المثلثات وتقايس المثلثات ومستقيم المنتصفين',
    shortDesc: 'رسم مستقيم المنتصفين واستنتاج التوازي ونصف الطول',
  },
  {
    key: 'cosine',
    label: 'جيب تمام زاوية حادة (cos)',
    chapter: 'المثلث القائم والدائرة ونظرية فيثاغورس',
    shortDesc: 'تحديد الضلع المجاور والزاوية القائمة وحساب جيب التمام',
  },
  {
    key: 'congruence',
    label: 'تقايس المثلثات',
    chapter: 'المثلثات وتقايس المثلثات ومستقيم المنتصفين',
    shortDesc: 'رسم محور التناظر وإثبات تقايس مثلثين',
  },
];

export interface GeneratedGeometryExercise {
  title: string;
  chapter: string;
  category: 'geometry';
  difficulty: DifficultyLevel;
  durationMinutes: number;
  description: string;
  geometryData: GeometryExerciseData;
  questions: Question[];
}

const PYTH_TRIPLES: ReadonlyArray<{ a: number; b: number; c: number }> = [
  { a: 3, b: 4, c: 5 },
  { a: 6, b: 8, c: 10 },
  { a: 5, b: 12, c: 13 },
  { a: 9, b: 12, c: 15 },
  { a: 8, b: 15, c: 17 },
];

const COSINE_TRIPLES: ReadonlyArray<{ adj: number; opp: number; hyp: number; cosVal: number }> = [
  { adj: 3, opp: 4, hyp: 5, cosVal: 0.6 },
  { adj: 4, opp: 3, hyp: 5, cosVal: 0.8 },
  { adj: 6, opp: 8, hyp: 10, cosVal: 0.6 },
  { adj: 8, opp: 6, hyp: 10, cosVal: 0.8 },
  { adj: 7, opp: 24, hyp: 25, cosVal: 0.28 },
];

function pickVariant<T>(items: readonly T[], variantSeed?: number): T {
  const idx =
    typeof variantSeed === 'number' && Number.isFinite(variantSeed)
      ? Math.abs(Math.floor(variantSeed)) % items.length
      : Math.floor(Math.random() * items.length);
  return items[idx];
}

function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}`;
}

export function generateGeometryExercise(
  templateKey: Exclude<GeometryTemplateKey, 'custom'>,
  variantSeed?: number
): GeneratedGeometryExercise {
  if (templateKey === 'pythagoras') {
    const triple = pickVariant(PYTH_TRIPLES, variantSeed);
    const ax = 120;
    const ay = 250;
    const bx = 120;
    const by = 80;
    const cx = 360;
    const cy = 250;

    const baseShapes: GeometryShape[] = [
      { id: uid('seg'), kind: 'segment', x1: ax, y1: ay, x2: bx, y2: by, color: '#3E1591', label: `${triple.a} cm` },
      { id: uid('seg'), kind: 'segment', x1: ax, y1: ay, x2: cx, y2: cy, color: '#3E1591', label: `${triple.b} cm` },
      { id: uid('ra'), kind: 'rightAngle', vx: ax, vy: ay, ux: bx, uy: by, wx: cx, wy: cy, color: '#E7A33E' },
      { id: uid('pt'), kind: 'point', x: ax, y: ay, label: 'A', color: '#22163F' },
      { id: uid('pt'), kind: 'point', x: bx, y: by, label: 'B', color: '#22163F' },
      { id: uid('pt'), kind: 'point', x: cx, y: cy, label: 'C', color: '#22163F' },
    ];

    const teacherCorrectionShapes: GeometryShape[] = [
      {
        id: uid('cor_seg'),
        kind: 'segment',
        x1: bx,
        y1: by,
        x2: cx,
        y2: cy,
        color: '#059669',
        label: `BC = ${triple.c} cm`,
      },
      {
        id: uid('cor_txt'),
        kind: 'text',
        x: 255,
        y: 138,
        text: `BC² = ${triple.a}² + ${triple.b}² = ${triple.c * triple.c}`,
        color: '#047857',
      },
    ];

    const cosB = Math.round((triple.a / triple.c) * 100) / 100;

    return {
      title: `تمرين تفاعلي هندسة: فيثاغورس (${triple.a}، ${triple.b}، ${triple.c})`,
      chapter: 'المثلث القائم والدائرة ونظرية فيثاغورس',
      category: 'geometry',
      difficulty: 'medium',
      durationMinutes: 15,
      description: `ليكن $ABC$ مثلثاً قائماً في $A$ حيث $AB = ${triple.a}\\text{ cm}$ و$AC = ${triple.b}\\text{ cm}$. نفّذ الإنشاء الهندسي على اللوحة ثم أجب عن الأسئلة.`,
      geometryData: {
        templateKey: 'pythagoras',
        canvasWidth: GEOMETRY_CANVAS_WIDTH,
        canvasHeight: GEOMETRY_CANVAS_HEIGHT,
        baseShapes,
        drawPrompt: `ارسم الوتر $[BC]$ على الشكل لإتمام المثلث القائم $ABC$، ثم احسب طوله $BC$.`,
        teacherCorrectionText: `1) نصل بين النقطتين $B$ و$C$ للحصول على الوتر $[BC]$.\n2) بما أن المثلث $ABC$ قائم في $A$، فحسب نظرية فيثاغورس:\n$BC^2 = AB^2 + AC^2 = ${triple.a}^2 + ${triple.b}^2 = ${triple.a * triple.a} + ${triple.b * triple.b} = ${triple.c * triple.c}$\nومنه $BC = \\sqrt{${triple.c * triple.c}} = ${triple.c}\\text{ cm}$.\n3) $\\cos(\\hat{B}) = \\frac{AB}{BC} = \\frac{${triple.a}}{${triple.c}} = ${cosB}$.`,
        teacherCorrectionShapes,
      },
      questions: [
        {
          id: uid('q'),
          type: 'number',
          prompt: `احسب طول الوتر $BC$ بالسنتيمتر:`,
          correctNumber: triple.c,
          unit: 'cm',
          points: 10,
          explanation: `$BC^2 = ${triple.a}^2 + ${triple.b}^2 = ${triple.c * triple.c} \\Rightarrow BC = ${triple.c}\\text{ cm}$.`,
        },
        {
          id: uid('q'),
          type: 'choice',
          prompt: 'ما هي العلاقة الصحيحة لنظرية فيثاغورس في هذا المثلث القائم في $A$؟',
          choices: [
            '$BC^2 = AB^2 + AC^2$',
            '$AB^2 = BC^2 + AC^2$',
            '$AC^2 = AB^2 + BC^2$',
            '$BC = AB + AC$',
          ],
          correctChoiceIndex: 0,
          points: 5,
          explanation: 'مربع طول الوتر $[BC]$ يساوي مجموع مربعي طولي الضلعين القائمين.',
        },
        {
          id: uid('q'),
          type: 'number',
          prompt: `احسب قيمة $\\cos(\\hat{B})$ (مقرّبة إلى $0.01$ عند الحاجة):`,
          correctNumber: cosB,
          unit: '',
          points: 5,
          explanation: `$\\cos(\\hat{B}) = \\frac{AB}{BC} = \\frac{${triple.a}}{${triple.c}} = ${cosB}$.`,
        },
      ],
    };
  }

  if (templateKey === 'circumcircle') {
    const hypChoices = [8, 10, 12, 14, 16];
    const hyp = pickVariant(hypChoices, variantSeed);
    const radius = hyp / 2;

    const ex = 110;
    const ey = 210;
    const gx = 370;
    const gy = 210;
    const ox = (ex + gx) / 2;
    const oy = (ey + gy) / 2;
    // Pick point F on semicircle above EG so triangle EFG is truly right-angled at F
    const rPx = (gx - ex) / 2;
    const angle = -Math.PI * 0.68;
    const fx = Math.round(ox + rPx * Math.cos(angle));
    const fy = Math.round(oy + rPx * Math.sin(angle));

    const baseShapes: GeometryShape[] = [
      { id: uid('seg'), kind: 'segment', x1: ex, y1: ey, x2: gx, y2: gy, color: '#3E1591', label: `${hyp} cm` },
      { id: uid('seg'), kind: 'segment', x1: ex, y1: ey, x2: fx, y2: fy, color: '#3E1591' },
      { id: uid('seg'), kind: 'segment', x1: fx, y1: fy, x2: gx, y2: gy, color: '#3E1591' },
      { id: uid('ra'), kind: 'rightAngle', vx: fx, vy: fy, ux: ex, uy: ey, wx: gx, wy: gy, color: '#E7A33E' },
      { id: uid('pt'), kind: 'point', x: ex, y: ey, label: 'E', color: '#22163F' },
      { id: uid('pt'), kind: 'point', x: fx, y: fy, label: 'F', color: '#22163F' },
      { id: uid('pt'), kind: 'point', x: gx, y: gy, label: 'G', color: '#22163F' },
    ];

    const teacherCorrectionShapes: GeometryShape[] = [
      { id: uid('cor_pt'), kind: 'point', x: ox, y: oy, label: 'O', color: '#059669' },
      { id: uid('cor_seg'), kind: 'segment', x1: ox, y1: oy, x2: fx, y2: fy, color: '#059669', dashed: true, label: `OF = ${radius} cm` },
      { id: uid('cor_cir'), kind: 'circle', cx: ox, cy: oy, r: rPx, color: '#059669', dashed: true, label: '(C)' },
    ];

    return {
      title: `تمرين تفاعلي هندسة: الدائرة المحيطة بالمثلث القائم (EG = ${hyp} cm)`,
      chapter: 'المثلث القائم والدائرة ونظرية فيثاغورس',
      category: 'geometry',
      difficulty: 'medium',
      durationMinutes: 15,
      description: `$EFG$ مثلث قائم في $F$ طول وتره $EG = ${hyp}\\text{ cm}$، و$O$ منتصف $[EG]$.`,
      geometryData: {
        templateKey: 'circumcircle',
        canvasWidth: GEOMETRY_CANVAS_WIDTH,
        canvasHeight: GEOMETRY_CANVAS_HEIGHT,
        baseShapes,
        drawPrompt: 'عيّن النقطة $O$ منتصف الوتر $[EG]$، ارسم المتوسط $[OF]$، ثم أنشئ الدائرة $(C)$ المحيطة بالمثلث $EFG$.',
        teacherCorrectionText: `1) مركز الدائرة المحيطة بالمثلث القائم هو منتصف الوتر $O$.\n2) نصف قطر الدائرة المحيطة هو $R = \\frac{EG}{2} = \\frac{${hyp}}{2} = ${radius}\\text{ cm}$.\n3) طول المتوسط المتعلق بالوتر يساوي نصف طول الوتر: $OF = ${radius}\\text{ cm}$.`,
        teacherCorrectionShapes,
      },
      questions: [
        {
          id: uid('q'),
          type: 'choice',
          prompt: 'أين يقع مركز الدائرة $(C)$ المحيطة بالمثلث القائم $EFG$؟',
          choices: [
            'في منتصف الوتر $[EG]$',
            'في الرأس القائم $F$',
            'في منتصف الضلع $[EF]$',
            'خارج المثلث دائماً',
          ],
          correctChoiceIndex: 0,
          points: 6,
          explanation: 'مركز الدائرة المحيطة بالمثلث القائم هو دائماً منتصف وتره.',
        },
        {
          id: uid('q'),
          type: 'number',
          prompt: `احسب طول المتوسط المتعلق بالوتر $OF$ بالسنتيمتر:`,
          correctNumber: radius,
          unit: 'cm',
          points: 7,
          explanation: `$OF = \\frac{EG}{2} = \\frac{${hyp}}{2} = ${radius}\\text{ cm}$.`,
        },
        {
          id: uid('q'),
          type: 'number',
          prompt: `ما هو نصف قطر الدائرة $(C)$ المحيطة بالمثلث $EFG$؟`,
          correctNumber: radius,
          unit: 'cm',
          points: 7,
          explanation: 'نصف قطر الدائرة المحيطة يساوي نصف طول الوتر.',
        },
      ],
    };
  }

  if (templateKey === 'midsegment') {
    const baseLengths = [8, 10, 12, 14, 16];
    const bc = pickVariant(baseLengths, variantSeed);
    const mn = bc / 2;

    const ax = 240;
    const ay = 55;
    const bx = 95;
    const by = 265;
    const cx = 385;
    const cy = 265;
    const mx = (ax + bx) / 2;
    const my = (ay + by) / 2;
    const nx = (ax + cx) / 2;
    const ny = (ay + cy) / 2;

    const baseShapes: GeometryShape[] = [
      { id: uid('seg'), kind: 'segment', x1: ax, y1: ay, x2: bx, y2: by, color: '#3E1591' },
      { id: uid('seg'), kind: 'segment', x1: ax, y1: ay, x2: cx, y2: cy, color: '#3E1591' },
      { id: uid('seg'), kind: 'segment', x1: bx, y1: by, x2: cx, y2: cy, color: '#3E1591', label: `BC = ${bc} cm` },
      { id: uid('pt'), kind: 'point', x: ax, y: ay, label: 'A', color: '#22163F' },
      { id: uid('pt'), kind: 'point', x: bx, y: by, label: 'B', color: '#22163F' },
      { id: uid('pt'), kind: 'point', x: cx, y: cy, label: 'C', color: '#22163F' },
      { id: uid('pt'), kind: 'point', x: mx, y: my, label: 'M', color: '#E7A33E' },
      { id: uid('pt'), kind: 'point', x: nx, y: ny, label: 'N', color: '#E7A33E' },
    ];

    const teacherCorrectionShapes: GeometryShape[] = [
      { id: uid('cor_seg'), kind: 'segment', x1: mx, y1: my, x2: nx, y2: ny, color: '#059669', label: `MN = ${mn} cm` },
      { id: uid('cor_txt'), kind: 'text', x: 240, y: 142, text: '(MN) // (BC)', color: '#047857' },
    ];

    return {
      title: `تمرين تفاعلي هندسة: مستقيم المنتصفين (BC = ${bc} cm)`,
      chapter: 'المثلثات وتقايس المثلثات ومستقيم المنتصفين',
      category: 'geometry',
      difficulty: 'easy',
      durationMinutes: 12,
      description: `$ABC$ مثلث فيه $M$ منتصف $[AB]$ و$N$ منتصف $[AC]$، وطول الضلع $BC = ${bc}\\text{ cm}$.`,
      geometryData: {
        templateKey: 'midsegment',
        canvasWidth: GEOMETRY_CANVAS_WIDTH,
        canvasHeight: GEOMETRY_CANVAS_HEIGHT,
        baseShapes,
        drawPrompt: 'ارسم مستقيم المنتصفين $[MN]$ الواصل بين $M$ و$N$ على الشكل، ثم أجب عن الأسئلة.',
        teacherCorrectionText: `بما أن $M$ منتصف $[AB]$ و$N$ منتصف $[AC]$، فحسب خاصية مستقيم المنتصفين:\n1) $(MN) \\parallel (BC)$.\n2) $MN = \\frac{1}{2} BC = \\frac{${bc}}{2} = ${mn}\\text{ cm}$.`,
        teacherCorrectionShapes,
      },
      questions: [
        {
          id: uid('q'),
          type: 'number',
          prompt: `احسب الطول $MN$ بالسنتيمتر:`,
          correctNumber: mn,
          unit: 'cm',
          points: 10,
          explanation: `$MN = \\frac{BC}{2} = \\frac{${bc}}{2} = ${mn}\\text{ cm}$.`,
        },
        {
          id: uid('q'),
          type: 'choice',
          prompt: 'ما هي الوضعية النسبية للمستقيمين $(MN)$ و $(BC)$؟',
          choices: ['متوازيان', 'متعامدان', 'متقاطعان في $A$', 'منطبقان'],
          correctChoiceIndex: 0,
          points: 10,
          explanation: 'المستقيم الذي يشمل منتصفي ضلعين في مثلث يوازي الضلع الثالث.',
        },
      ],
    };
  }

  if (templateKey === 'cosine') {
    const t = pickVariant(COSINE_TRIPLES, variantSeed);
    const kx = 115;
    const ky = 250;
    const lx = 365;
    const ly = 250;
    const mx = 115;
    const my = 80;

    const baseShapes: GeometryShape[] = [
      { id: uid('seg'), kind: 'segment', x1: kx, y1: ky, x2: lx, y2: ly, color: '#3E1591', label: `KL = ${t.adj} cm` },
      { id: uid('seg'), kind: 'segment', x1: lx, y1: ly, x2: mx, y2: my, color: '#3E1591', label: `LM = ${t.hyp} cm` },
      { id: uid('seg'), kind: 'segment', x1: kx, y1: ky, x2: mx, y2: my, color: '#3E1591' },
      { id: uid('pt'), kind: 'point', x: kx, y: ky, label: 'K', color: '#22163F' },
      { id: uid('pt'), kind: 'point', x: lx, y: ly, label: 'L', color: '#22163F' },
      { id: uid('pt'), kind: 'point', x: mx, y: my, label: 'M', color: '#22163F' },
    ];

    const teacherCorrectionShapes: GeometryShape[] = [
      { id: uid('cor_ra'), kind: 'rightAngle', vx: kx, vy: ky, ux: mx, uy: my, wx: lx, wy: ly, color: '#059669' },
      { id: uid('cor_seg'), kind: 'segment', x1: kx, y1: ky, x2: lx, y2: ly, color: '#059669', label: 'المجاور KL' },
      { id: uid('cor_txt'), kind: 'text', x: 318, y: 235, text: 'L̂', color: '#059669' },
    ];

    return {
      title: `تمرين تفاعلي هندسة: جيب تمام زاوية حادة (KL=${t.adj}, LM=${t.hyp})`,
      chapter: 'المثلث القائم والدائرة ونظرية فيثاغورس',
      category: 'geometry',
      difficulty: 'medium',
      durationMinutes: 15,
      description: `$KLM$ مثلث قائم في $K$ حيث $KL = ${t.adj}\\text{ cm}$ و$LM = ${t.hyp}\\text{ cm}$.`,
      geometryData: {
        templateKey: 'cosine',
        canvasWidth: GEOMETRY_CANVAS_WIDTH,
        canvasHeight: GEOMETRY_CANVAS_HEIGHT,
        baseShapes,
        drawPrompt: 'علّم الزاوية القائمة في $K$ على الشكل، وخطّط الضلع المجاور للزاوية $\\hat{L}$.',
        teacherCorrectionText: `1) الزاوية القائمة عند الرأس $K$، والوتر هو $[LM]$.\n2) الضلع المجاور للزاوية الحادة $\\hat{L}$ هو $[KL]$.\n3) $\\cos(\\hat{L}) = \\frac{KL}{LM} = \\frac{${t.adj}}{${t.hyp}} = ${t.cosVal}$.\n4) حسب فيثاغورس: $KM = \\sqrt{${t.hyp}^2 - ${t.adj}^2} = ${t.opp}\\text{ cm}$.`,
        teacherCorrectionShapes,
      },
      questions: [
        {
          id: uid('q'),
          type: 'choice',
          prompt: 'ما هو الضلع المجاور للزاوية الحادة $\\hat{L}$ في المثلث القائم في $K$؟',
          choices: ['$[KL]$', '$[LM]$', '$[KM]$', 'الوتر'],
          correctChoiceIndex: 0,
          points: 6,
          explanation: 'الزاوية $\\hat{L}$ محصورة بين الوتر $[LM]$ والضلع المجاور $[KL]$.',
        },
        {
          id: uid('q'),
          type: 'number',
          prompt: `احسب $\\cos(\\hat{L})$:`,
          correctNumber: t.cosVal,
          unit: '',
          points: 7,
          explanation: `$\\cos(\\hat{L}) = \\frac{KL}{LM} = \\frac{${t.adj}}{${t.hyp}} = ${t.cosVal}$.`,
        },
        {
          id: uid('q'),
          type: 'number',
          prompt: `استنتج طول الضلع القائم الثاني $KM$ بالسنتيمتر:`,
          correctNumber: t.opp,
          unit: 'cm',
          points: 7,
          explanation: `$KM^2 = ${t.hyp}^2 - ${t.adj}^2 = ${t.opp * t.opp} \\Rightarrow KM = ${t.opp}\\text{ cm}$.`,
        },
      ],
    };
  }

  // 'congruence'
  const baseChoices = [6, 8, 10, 12];
  const baseLen = pickVariant(baseChoices, variantSeed);
  const sideLen = baseLen + 3;
  const halfBase = baseLen / 2;

  const ax = 240;
  const ay = 55;
  const bx = 115;
  const by = 260;
  const cx = 365;
  const cy = 260;
  const mx = 240;
  const my = 260;

  const baseShapes: GeometryShape[] = [
    { id: uid('seg'), kind: 'segment', x1: ax, y1: ay, x2: bx, y2: by, color: '#3E1591', label: `${sideLen} cm` },
    { id: uid('seg'), kind: 'segment', x1: ax, y1: ay, x2: cx, y2: cy, color: '#3E1591', label: `${sideLen} cm` },
    { id: uid('seg'), kind: 'segment', x1: bx, y1: by, x2: cx, y2: cy, color: '#3E1591', label: `BC = ${baseLen} cm` },
    { id: uid('pt'), kind: 'point', x: ax, y: ay, label: 'A', color: '#22163F' },
    { id: uid('pt'), kind: 'point', x: bx, y: by, label: 'B', color: '#22163F' },
    { id: uid('pt'), kind: 'point', x: cx, y: cy, label: 'C', color: '#22163F' },
    { id: uid('pt'), kind: 'point', x: mx, y: my, label: 'M', color: '#E7A33E' },
  ];

  const teacherCorrectionShapes: GeometryShape[] = [
    { id: uid('cor_seg'), kind: 'segment', x1: ax, y1: ay, x2: mx, y2: my, color: '#059669', label: 'المتوسط [AM]' },
    { id: uid('cor_ra'), kind: 'rightAngle', vx: mx, vy: my, ux: ax, uy: ay, wx: cx, wy: cy, color: '#059669' },
  ];

  return {
    title: `تمرين تفاعلي هندسة: تقايس المثلثات (AB = AC = ${sideLen} cm)`,
    chapter: 'المثلثات وتقايس المثلثات ومستقيم المنتصفين',
    category: 'geometry',
    difficulty: 'medium',
    durationMinutes: 15,
    description: `$ABC$ مثلث متساوي الساقين رأسه الأساسي $A$ حيث $AB = AC = ${sideLen}\\text{ cm}$ و$BC = ${baseLen}\\text{ cm}$، و$M$ منتصف القاعدة $[BC]$.`,
    geometryData: {
      templateKey: 'congruence',
      canvasWidth: GEOMETRY_CANVAS_WIDTH,
      canvasHeight: GEOMETRY_CANVAS_HEIGHT,
      baseShapes,
      drawPrompt: 'ارسم القطعة $[AM]$ وعلّم الزاوية القائمة عند $M$ لتقسيم الشكل إلى مثلثين متقايسين $ABM$ و$ACM$.',
      teacherCorrectionText: `المثلثان $ABM$ و$ACM$ متقايسان لأن:\n- $AB = AC = ${sideLen}\\text{ cm}$ (معطيات).\n- $BM = CM = ${halfBase}\\text{ cm}$ لأن $M$ منتصف $[BC]$.\n- $[AM]$ ضلع مشترك.\nإذن يتقايسان حسب الحالة الثالثة (الأضلاع الثلاثة متقايسة مثنى مثنى)، ويكون $(AM) \\perp (BC)$ فقياس $\\widehat{AMB} = 90^\\circ$.`,
      teacherCorrectionShapes,
    },
    questions: [
      {
        id: uid('q'),
        type: 'choice',
        prompt: 'ما هي حالة تقايس المثلثين $ABM$ و $ACM$؟',
        choices: [
          'تقايس الأضلاع الثلاثة مثنى مثنى',
          'زاوية محصورة وضلعان غير متساويين',
          'مجموع زوايا المثلث',
          'خاصية مستقيم المنتصفين',
        ],
        correctChoiceIndex: 0,
        points: 8,
        explanation: '$AB=AC$ و $BM=CM$ و $AM$ ضلع مشترك: ثلاثة أضلاع متقايسة.',
      },
      {
        id: uid('q'),
        type: 'number',
        prompt: `احسب طول القطعة $[BM]$ بالسنتيمتر:`,
        correctNumber: halfBase,
        unit: 'cm',
        points: 6,
        explanation: `$M$ منتصف $[BC]$ إذن $BM = \\frac{${baseLen}}{2} = ${halfBase}\\text{ cm}$.`,
      },
      {
        id: uid('q'),
        type: 'number',
        prompt: 'ما هو قيس الزاوية $\\widehat{AMB}$ بالدرجات؟',
        correctNumber: 90,
        unit: '°',
        points: 6,
        explanation: 'المتوسط المتعلق بالقاعدة في مثلث متساوي الساقين هو أيضاً ارتفاع ومحور، إذن $\\widehat{AMB} = 90^\\circ$.',
      },
    ],
  };
}

export function createBlankGeometryData(): GeometryExerciseData {
  return {
    templateKey: 'custom',
    canvasWidth: GEOMETRY_CANVAS_WIDTH,
    canvasHeight: GEOMETRY_CANVAS_HEIGHT,
    baseShapes: [],
    drawPrompt: 'ارسم الشكل الهندسي المطلوب على الشبكة ثم أجب عن الأسئلة.',
    teacherCorrectionText: '',
    teacherCorrectionShapes: [],
  };
}

export function isGeometryExercise(ex: Pick<Exercise, 'category' | 'geometryData'>): boolean {
  return ex.category === 'geometry' || Boolean(ex.geometryData);
}
