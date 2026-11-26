import type { AcademySettings, Course, EventItem, Exercise } from '../types/math';
import { generateGeometryExercise } from '../utils/geometryGenerator';

export const DEFAULT_SETTINGS: AcademySettings = {
  announcement:
    'مرحباً بتلاميذ السنة الثالثة متوسط! راجعوا دروس القوى ونظرية فيثاغورس وأنجزوا التمارين التفاعلية لتثبيت العلامة الكاملة 20/20.',
  targetDate: '2027-06-07',
  targetLabel: 'العد التنازلي لاختبارات نهاية السنة',
};

export const SEED_COURSES: Omit<Course, 'createdBy' | 'createdAt' | 'updatedAt'>[] = [
  {
    id: 'course_3am_rational_ops',
    title: 'العمليات على الأعداد الناطقة والكسور',
    chapter: 'الأعداد النسبية والكسور والأعداد الناطقة',
    chapterOrder: 1,
    durationMin: 25,
    summary:
      'يتعلم التلميذ قاعدة الإشارات في جداء وحاصل قسمة عددين نسبيين، وتوحيد المقامات لجمع وطرح الأعداد الناطقة، وضرب وقسمة كسرين مع الاختزال.',
    keyRules:
      'جداء عددين نسبيين من نفس الإشارة موجب، ومن إشارتين مختلفتين سالب.\nجمع كسرين: $\\frac{a}{c} + \\frac{b}{c} = \\frac{a+b}{c}$\nقسمة كسرين: $\\frac{a}{b} \\div \\frac{c}{d} = \\frac{a}{b} \\times \\frac{d}{c}$ حيث $b, c, d \\neq 0$',
    videoUrl: '',
    pdfUrl: '',
    published: true,
  },
  {
    id: 'course_3am_triangles_midline',
    title: 'تقايس المثلثات ومستقيم المنتصفين',
    chapter: 'المثلثات وتقايس المثلثات ومستقيم المنتصفين',
    chapterOrder: 2,
    durationMin: 30,
    summary:
      'التعرف على حالات تقايس المثلثات الثلاث (ضلعان وزاوية، زاويتان وضلع، ثلاثة أضلاع)، وخاصية مستقيم المنتصفين التي تربط بين منتصفي ضلعين في مثلث.',
    keyRules:
      'إذا كان $I$ منتصف $[AB]$ و$J$ منتصف $[AC]$ فإن المستقيم $(IJ)$ يوازي $(BC)$ ويكون الطول $IJ = \\frac{1}{2} BC$.\nخاصية التوازي والمنتصف: إذا شمل مستقيم منتصف ضلع ووازى ضلعاً ثانياً فإنه يقطع الضلع الثالث في منتصفه.',
    videoUrl: '',
    pdfUrl: '',
    published: true,
  },
  {
    id: 'course_3am_powers_10',
    title: 'قوى العدد 10 والكتابة العلمية',
    chapter: 'القوى ذات أسس نسبية صحيحة',
    chapterOrder: 3,
    durationMin: 25,
    summary:
      'حساب قوى العدد $10$ ذات أس موجب أو سالب، قواعد الحساب على القوى، وكتابة أي عدد عشري على الشكل العلمي $a \\times 10^n$ وحصره بين قوتين متتاليتين للعدد 10.',
    keyRules:
      '$10^n \\times 10^m = 10^{n+m}$ ، $\\frac{10^n}{10^m} = 10^{n-m}$ ، $(10^n)^m = 10^{n \\times m}$\nالكتابة العلمية: $a \\times 10^n$ حيث $1 \\leq |a| < 10$ و$n$ عدد صحيح نسبي.',
    videoUrl: '',
    pdfUrl: '',
    published: true,
  },
  {
    id: 'course_3am_literal_equations',
    title: 'الحساب الحرفي، النشر والتبسيط وحل المعادلات',
    chapter: 'الحساب الحرفي والمعادلات',
    chapterOrder: 4,
    durationMin: 30,
    summary:
      'تبسيط العبارات الحرفية، نشر عبارة من الشكل $(a+b)(c+d)$، وحل معادلات من الدرجة الأولى بمجهول واحد $ax + b = cx + d$ وتوظيفها في ترييض المشكلات.',
    keyRules:
      'الخاصية التوزيعية المضاعفة: $(a+b)(c+d) = ac + ad + bc + bd$\nلحل معادلة $ax + b = c$ نجمع الحدود المتشابهة ونقسم الطرفين على $a \\neq 0$.',
    videoUrl: '',
    pdfUrl: '',
    published: true,
  },
  {
    id: 'course_3am_pythagoras_cos',
    title: 'خاصية فيثاغورس وجيب تمام زاوية حادة',
    chapter: 'المثلث القائم والدائرة ونظرية فيثاغورس',
    chapterOrder: 5,
    durationMin: 35,
    summary:
      'استعمال نظرية فيثاغورس لحساب طول ضلع في مثلث قائم، والنظرية العكسية لإثبات تعامد ضلعين، وحساب $\\cos(\\hat{A})$ باستعمال المجاور والوتر.',
    keyRules:
      'في المثلث $ABC$ القائم في $A$: $BC^2 = AB^2 + AC^2$\nجيب تمام زاوية حادة: $\\cos(\\hat{B}) = \\frac{AB}{BC} = \\text{المجاور} \\div \\text{الوتر}$',
    videoUrl: '',
    pdfUrl: '',
    published: true,
  },
  {
    id: 'course_3am_proportionality_stats',
    title: 'التناسبية، النسبة المئوية وتنظيم المعطيات',
    chapter: 'التناسبية وتنظيم المعطيات',
    chapterOrder: 6,
    durationMin: 20,
    summary:
      'التمثيل البياني لوضعية تناسبية، حساب السرعة المتوسطة، حساب النسب المئوية والزيادات والتخفيضات، وحساب التكرارات والوسط الحسابي لسلسلة إحصائية.',
    keyRules:
      'يمثَّل التناسب الطردي بيانياً بمستقيم يمر بمبدأ المعلم.\nالسرعة المتوسطة: $v = \\frac{d}{t}$',
    videoUrl: '',
    pdfUrl: '',
    published: true,
  },
];

const SEED_GEOM_PYTH = generateGeometryExercise('pythagoras', 1);
const SEED_GEOM_CIRC = generateGeometryExercise('circumcircle', 1);

export const SEED_EXERCISES: Omit<Exercise, 'createdBy' | 'createdAt' | 'updatedAt'>[] = [
  {
    id: 'ex_3am_geom_pyth_1',
    ...SEED_GEOM_PYTH,
    published: true,
  },
  {
    id: 'ex_3am_geom_circ_1',
    ...SEED_GEOM_CIRC,
    published: true,
  },
  {
    id: 'ex_3am_rational_daily_1',
    title: 'تطبيق سريع: العمليات على الأعداد النسبية والكسور',
    chapter: 'الأعداد النسبية والكسور والأعداد الناطقة',
    category: 'daily',
    difficulty: 'easy',
    durationMinutes: 10,
    description: 'أجب على الأسئلة التالية بدقة مع الانتباه لقاعدة الإشارات وأولوية العمليات.',
    questions: [
      {
        id: 'q1',
        type: 'choice',
        prompt: 'احسب الجداء التالي: $(-4) \\times (+6)$',
        choices: ['$-24$', '$+24$', '$-10$', '$+2$'],
        correctChoiceIndex: 0,
        points: 5,
        explanation: 'جداء عددين مختلفين في الإشارة هو عدد سالب: $4 \\times 6 = 24$ بإشارة سالبة.',
      },
      {
        id: 'q2',
        type: 'choice',
        prompt: 'ما ناتج الجمع: $\\frac{-3}{5} + \\frac{7}{5}$ ؟',
        choices: ['$\\frac{10}{5}$', '$\\frac{4}{5}$', '$\\frac{-4}{5}$', '$\\frac{4}{10}$'],
        correctChoiceIndex: 1,
        points: 5,
        explanation: 'المقام مشترك وهو $5$، نجمع البسطين: $-3 + 7 = 4$ فيكون الناتج $\\frac{4}{5}$.',
      },
      {
        id: 'q3',
        type: 'choice',
        prompt: 'احسب حاصل القسمة: $\\frac{2}{3} \\div \\frac{4}{9}$ في أبسط شكل:',
        choices: ['$\\frac{8}{27}$', '$\\frac{3}{2}$', '$\\frac{2}{3}$', '$\\frac{6}{12}$'],
        correctChoiceIndex: 1,
        points: 5,
        explanation: 'نضرب الكسر الأول في مقلوب الثاني: $\\frac{2}{3} \\times \\frac{9}{4} = \\frac{18}{12} = \\frac{3}{2}$.',
      },
      {
        id: 'q4',
        type: 'number',
        prompt: 'احسب قيمة العبارة: $(-3) \\times (-5) + (-3)$',
        correctNumber: 12,
        unit: '',
        points: 5,
        explanation: 'أولوية الضرب: $(-3)\\times(-5)=+15$، ثم $15 + (-3) = 12$.',
      },
    ],
    published: true,
  },
  {
    id: 'ex_3am_powers_scientific_1',
    title: 'تمرين تفاعلي: قوى العدد 10 والكتابة العلمية',
    chapter: 'القوى ذات أسس نسبية صحيحة',
    category: 'interactive',
    difficulty: 'medium',
    durationMinutes: 15,
    description: 'اختبر تمكنك من قواعد القوى وتحويل الأعداد إلى الكتابة العلمية.',
    questions: [
      {
        id: 'q1',
        type: 'choice',
        prompt: 'بسط العبارة التالية: $10^5 \\times 10^{-2}$',
        choices: ['$10^{-10}$', '$10^7$', '$10^3$', '$10^{-3}$'],
        correctChoiceIndex: 2,
        points: 5,
        explanation: 'نجمع الأسين: $5 + (-2) = 3$، إذن النتيجة $10^3$.',
      },
      {
        id: 'q2',
        type: 'choice',
        prompt: 'ما هي الكتابة العلمية للعدد $0.0045$ ؟',
        choices: ['$45 \\times 10^{-4}$', '$4.5 \\times 10^{-3}$', '$4.5 \\times 10^3$', '$0.45 \\times 10^{-2}$'],
        correctChoiceIndex: 1,
        points: 5,
        explanation: 'العدد العشري المحصور بين $1$ و$10$ هو $4.5$، وأزحنا الفاصلة $3$ مراتب نحو اليمين فيكون الأس $-3$.',
      },
      {
        id: 'q3',
        type: 'choice',
        prompt: 'احسب قيمة العبارة: $\\frac{10^6}{(10^2)^2}$',
        choices: ['$10^2$', '$10^{10}$', '$10^4$', '$10^0$'],
        correctChoiceIndex: 0,
        points: 5,
        explanation: '$(10^2)^2 = 10^4$ ثم $\\frac{10^6}{10^4} = 10^{6-4} = 10^2$.',
      },
      {
        id: 'q4',
        type: 'number',
        prompt: 'ما قيمة العدد $2^4 - 3^2$ ؟',
        correctNumber: 7,
        unit: '',
        points: 5,
        explanation: '$2^4 = 16$ و $3^2 = 9$، إذن $16 - 9 = 7$.',
      },
    ],
    published: true,
  },
  {
    id: 'ex_3am_pythagoras_devoir_1',
    title: 'فرض محروس: نظرية فيثاغورس والمثلث القائم',
    chapter: 'المثلث القائم والدائرة ونظرية فيثاغورس',
    category: 'devoir',
    difficulty: 'medium',
    durationMinutes: 20,
    description: 'وضعية تطبيقية شاملة لحساب الأطوال وجيب تمام الزاوية في المثلث القائم.',
    questions: [
      {
        id: 'q1',
        type: 'number',
        prompt: 'ليكن $ABC$ مثلثاً قائماً في $A$ حيث $AB = 6\\text{ cm}$ و $AC = 8\\text{ cm}$. احسب طول الوتر $BC$ بالسنتيمتر:',
        correctNumber: 10,
        unit: 'cm',
        points: 6,
        explanation: 'حسب فيثاغورس: $BC^2 = AB^2 + AC^2 = 36 + 64 = 100$ ومنه $BC = \\sqrt{100} = 10\\text{ cm}$.',
      },
      {
        id: 'q2',
        type: 'choice',
        prompt: 'في نفس المثلث القائم في $A$ ($AB=6, BC=10$)، ما قيمة $\\cos(\\hat{B})$ ؟',
        choices: ['$0.8$', '$0.6$', '$1.25$', '$0.5$'],
        correctChoiceIndex: 1,
        points: 5,
        explanation: '$\\cos(\\hat{B}) = \\frac{AB}{BC} = \\frac{6}{10} = 0.6$.',
      },
      {
        id: 'q3',
        type: 'choice',
        prompt: 'مثلث $EFG$ أطوال أضلاعه $5\\text{ cm}, 12\\text{ cm}, 13\\text{ cm}$. هل هذا المثلث قائم؟',
        choices: [
          'نعم، قائم لأن $5^2 + 12^2 = 13^2$',
          'لا، ليس قائماً لأن $5 + 12 \\neq 13$',
          'متساوي الساقين فقط',
          'لا يمكن التحقق',
        ],
        correctChoiceIndex: 0,
        points: 5,
        explanation: '$5^2 + 12^2 = 25 + 144 = 169 = 13^2$، وحسب الخاصية العكسية لفيثاغورس فالمثلث قائم.',
      },
      {
        id: 'q4',
        type: 'number',
        prompt: 'إذا كان طول وتر مثلث قائم هو $12\\text{ cm}$، فما طول المتوسط المتعلق بهذا الوتر؟',
        correctNumber: 6,
        unit: 'cm',
        points: 4,
        explanation: 'في المثلث القائم، طول المتوسط المتعلق بالوتر يساوي نصف طول الوتر: $12 \\div 2 = 6\\text{ cm}$.',
      },
    ],
    published: true,
  },
  {
    id: 'ex_3am_equations_exam_1',
    title: 'اختبار الفصل: الحساب الحرفي وحل المعادلات',
    chapter: 'الحساب الحرفي والمعادلات',
    category: 'exam',
    difficulty: 'hard',
    durationMinutes: 25,
    description: 'تمرين نموذجي يجمع بين النشر والتبسيط وحل المعادلات من الدرجة الأولى.',
    questions: [
      {
        id: 'q1',
        type: 'choice',
        prompt: 'انشر وبسط العبارة: $(x + 3)(x + 2)$',
        choices: ['$x^2 + 5x + 6$', '$x^2 + 6x + 5$', '$x^2 + 5$', '$2x + 5$'],
        correctChoiceIndex: 0,
        points: 5,
        explanation: '$(x+3)(x+2) = x^2 + 2x + 3x + 6 = x^2 + 5x + 6$.',
      },
      {
        id: 'q2',
        type: 'number',
        prompt: 'حل المعادلة التالية وأوجد قيمة $x$: $3x - 5 = 16$',
        correctNumber: 7,
        unit: '',
        points: 5,
        explanation: '$3x = 16 + 5 = 21$ ومنه $x = \\frac{21}{3} = 7$.',
      },
      {
        id: 'q3',
        type: 'number',
        prompt: 'حل المعادلة: $5x + 2 = 2x + 14$. ما قيمة $x$ ؟',
        correctNumber: 4,
        unit: '',
        points: 5,
        explanation: '$5x - 2x = 14 - 2 \\Rightarrow 3x = 12 \\Rightarrow x = 4$.',
      },
      {
        id: 'q4',
        type: 'choice',
        prompt: 'محيط مستطيل طوله $(x+4)$ وعرضه $3$ يساوي $26$. ما المعادلة المعبِّرة؟',
        choices: ['$2(x + 4 + 3) = 26$', '$3(x + 4) = 26$', '$x + 4 + 3 = 26$', '$2x + 4 = 26$'],
        correctChoiceIndex: 0,
        points: 5,
        explanation: 'محيط المستطيل هو ضعف مجموع الطول والعرض: $2(x+4+3)=26$.',
      },
    ],
    published: true,
  },
];

export const SEED_EVENTS: Omit<EventItem, 'createdBy' | 'createdAt' | 'updatedAt'>[] = [
  {
    id: 'event_3am_live_pyth',
    title: 'حصة مراجعة مباشرة: نظرية فيثاغورس وجيب التمام',
    eventType: 'live',
    eventDate: '2026-12-02',
    eventTime: '18:30',
    description:
      'حل تمارين نموذجية في الهندسة وبراهين المثلث القائم والدائرة المحيطة به في حصة تفاعلية مباشرة.',
    link: '',
    published: true,
  },
  {
    id: 'event_3am_devoir_trimester',
    title: 'موعد الفرض الإلكتروني الشامل للفصل الأول',
    eventType: 'devoir',
    eventDate: '2026-12-08',
    eventTime: '17:00',
    description:
      'يشمل الفرض محوري الأعداد الناطقة وتقايس المثلثات. يُنصح بمراجعة جميع الدروس وحل التمارين اليومية قبل الموعد.',
    link: '',
    published: true,
  },
  {
    id: 'event_3am_announce_honor',
    title: 'لوحة الشرف الشهرية لمتفوقي السنة الثالثة متوسط',
    eventType: 'announcement',
    eventDate: '2026-12-15',
    eventTime: '20:00',
    description:
      'سيتم تتويج التلاميذ الأوائل في الترتيب العام ممن حافظوا على معدل يفوق 17/20 في التمارين التفاعلية.',
    link: '',
    published: true,
  },
];

export interface LevelSeedBundle {
  settings: AcademySettings;
  courses: Omit<Course, 'createdBy' | 'createdAt' | 'updatedAt'>[];
  exercises: Omit<Exercise, 'createdBy' | 'createdAt' | 'updatedAt'>[];
  events: Omit<EventItem, 'createdBy' | 'createdAt' | 'updatedAt'>[];
}

export const SEED_BY_LEVEL: Record<'1AM' | '2AM' | '3AM' | '4AM', LevelSeedBundle> = {
  '1AM': {
    settings: {
      announcement:
        'مرحباً بتلاميذ السنة الأولى متوسط! ركّزوا على الأعداد العشرية، القسمة الإقليدية، والتناظر المحوري مع إنجاز التمارين التفاعلية.',
      targetDate: '2027-06-07',
      targetLabel: 'العد التنازلي لاختبارات السنة 1 متوسط',
    },
    courses: [
      {
        id: 'course_1am_decimals_1',
        title: 'الأعداد الطبيعية والأعداد العشرية',
        chapter: 'الأعداد الطبيعية والأعداد العشرية',
        chapterOrder: 1,
        durationMin: 20,
        summary:
          'قراءة وكتابة الأعداد العشرية، الانتقال من الكتابة الكسرية إلى العشرية، ومقارنة وترتيب الأعداد العشرية على نصف مستقيم مدرّج.',
        keyRules:
          'كل عدد عشري يمكن كتابته على شكل كسر عشري مقامه $10, 100, 1000$.\nمثال: $3.45 = 3 + \\frac{4}{10} + \\frac{5}{100} = \\frac{345}{100}$',
        videoUrl: '',
        pdfUrl: '',
        published: true,
      },
      {
        id: 'course_1am_symmetry_1',
        title: 'التناظر المحوري وإنشاء الأشكال البسيطة',
        chapter: 'التناظر المحوري، المحيطات والمساحات والتناسبية',
        chapterOrder: 6,
        durationMin: 25,
        summary:
          'إنشاء نظير نقطة، قطعة مستقيم، مستقيم ودائرة بالنسبة إلى محور تناظر، وحفظ الأطوال والأقياس والزوايا.',
        keyRules:
          'يكون $(d)$ محور القطعة $[AB]$ إذا كان عمودياً عليها في منتصفها.\nالتناظر المحوري يحفظ الأطوال والأقياس والمساحات.',
        videoUrl: '',
        pdfUrl: '',
        published: true,
      },
    ],
    exercises: [
      {
        id: 'ex_1am_geom_1',
        title: 'تمرين تفاعلي هندسة: محور قطعة مستقيم والزاوية القائمة',
        chapter: 'الإنشاءات الهندسية والزوايا والمضلعات',
        category: 'geometry',
        difficulty: 'easy',
        durationMinutes: 15,
        description: 'ليكن $[AB]$ قطعة مستقيم طولها $8\\text{ cm}$ ومنتصفها $M$. أنجز المطلوب على الشبكة ثم أجب.',
        geometryData: {
          templateKey: 'custom',
          canvasWidth: 480,
          canvasHeight: 320,
          drawPrompt: 'ارسم المستقيم العمودي على $[AB]$ في منتصفها $M$ وحدد الزاوية القائمة.',
          baseShapes: [
            { id: 'b1', kind: 'segment', x1: 100, y1: 170, x2: 380, y2: 170, color: '#22163F', label: '8 cm' },
            { id: 'b2', kind: 'point', x: 100, y: 170, label: 'A', color: '#22163F' },
            { id: 'b3', kind: 'point', x: 240, y: 170, label: 'M', color: '#3E1591' },
            { id: 'b4', kind: 'point', x: 380, y: 170, label: 'B', color: '#22163F' },
          ],
          teacherCorrectionShapes: [
            { id: 'c1', kind: 'segment', x1: 240, y1: 60, x2: 240, y2: 270, color: '#059669' },
            { id: 'c2', kind: 'rightAngle', vx: 240, vy: 170, ux: 380, uy: 170, wx: 240, wy: 60, color: '#059669' },
          ],
          teacherCorrectionText: 'محور القطعة $[AB]$ يمر بالمنتصف $M$ ويعامد $(AB)$ فيكوّن زاوية قائمة قياسها $90^\\circ$.',
        },
        questions: [
          {
            id: 'q1',
            type: 'number',
            prompt: 'إذا كان $AB = 8\\text{ cm}$ و $M$ منتصفها، فما طول القطعة $AM$ بالسنتيمتر؟',
            correctNumber: 4,
            unit: 'cm',
            points: 10,
            explanation: 'المنتصف يقسم القطعة إلى نصفين متقايسين: $8 \\div 2 = 4\\text{ cm}$.',
          },
          {
            id: 'q2',
            type: 'choice',
            prompt: 'ما قيس الزاوية التي يصنعها محور قطعة مستقيم معها؟',
            choices: ['$45^\\circ$', '$90^\\circ$', '$180^\\circ$', '$60^\\circ$'],
            correctChoiceIndex: 1,
            points: 10,
            explanation: 'المحور عمودي على القطعة المستقيمة إذن الزاوية قائمة ($90^\\circ$).',
          },
        ],
        published: true,
      },
      {
        id: 'ex_1am_decimals_1',
        title: 'تطبيق سريع: الأعداد العشرية والكسور العشرية',
        chapter: 'الأعداد الطبيعية والأعداد العشرية',
        category: 'daily',
        difficulty: 'easy',
        durationMinutes: 10,
        description: 'تمرين تطبيقي حول التفكيك والمقارنة والحساب الذهني للأعداد العشرية.',
        questions: [
          {
            id: 'q1',
            type: 'number',
            prompt: 'احسب ناتج: $4.5 + 3.25$',
            correctNumber: 7.75,
            points: 10,
            explanation: '$4.50 + 3.25 = 7.75$.',
          },
          {
            id: 'q2',
            type: 'choice',
            prompt: 'ما هي الكتابة العشرية للكسر $\\frac{47}{10}$ ؟',
            choices: ['$0.47$', '$4.7$', '$470$', '$4.07$'],
            correctChoiceIndex: 1,
            points: 10,
            explanation: 'القسمة على $10$ تزيح الفاصلة مرتبة واحدة نحو اليسار: $4.7$.',
          },
        ],
        published: true,
      },
    ],
    events: [
      {
        id: 'event_1am_start',
        title: 'حصة تأسيسية: الحساب على الأعداد العشرية (1 متوسط)',
        eventType: 'live',
        eventDate: '2026-12-03',
        eventTime: '17:30',
        description: 'مراجعة مبسطة للجمع والطرح والضرب والقسمة على $10, 100, 1000$.',
        link: '',
        published: true,
      },
    ],
  },
  '2AM': {
    settings: {
      announcement:
        'مرحباً بتلاميذ السنة الثانية متوسط! راجعوا أولويات العمليات، الكسور، والأعداد النسبية والتناظر المركزي لتحقيق التفوق.',
      targetDate: '2027-06-07',
      targetLabel: 'العد التنازلي لاختبارات السنة 2 متوسط',
    },
    courses: [
      {
        id: 'course_2am_ops_1',
        title: 'سلسلة عمليات دون أقواس وبأقواس',
        chapter: 'سلسلة العمليات على الأعداد الطبيعية والعشرية',
        chapterOrder: 1,
        durationMin: 25,
        summary:
          'تطبيق قواعد أولوية الضرب والقسمة على الجمع والطرح، وحساب سلاسل العمليات المتضمنة أقواساً متداخلة.',
        keyRules:
          'الأولوية أولاً للأقواس، ثم للضرب والقسمة قبل الجمع والطرح، ومن اليسار إلى اليمين عند تساوي الأولوية.',
        videoUrl: '',
        pdfUrl: '',
        published: true,
      },
      {
        id: 'course_2am_rel_2',
        title: 'جمع وطرح عددين نسبيين ومقارنتهما',
        chapter: 'الأعداد النسبية: المقارنة والجمع والطرح',
        chapterOrder: 3,
        durationMin: 25,
        summary:
          'تمثيل الأعداد النسبية على مستقيم مدرج، حساب المسافة إلى الصفر، وجمع وطرح عددين نسبيين.',
        keyRules:
          'طرح عدد نسبي هو إضافة معاكسه: $a - b = a + (-b)$.\nمثال: $(+5) - (-3) = (+5) + (+3) = +8$.',
        videoUrl: '',
        pdfUrl: '',
        published: true,
      },
    ],
    exercises: [
      {
        id: 'ex_2am_geom_1',
        title: 'تمرين تفاعلي هندسة: التناظر المركزي ومتوازي الأضلاع',
        chapter: 'التناظر المركزي والزوايا والتوازي',
        category: 'geometry',
        difficulty: 'medium',
        durationMinutes: 15,
        description: 'ليكن $O$ مركز تناظر للقطعة $[AB]$، ارسم النظير وأجب عن الأسئلة.',
        geometryData: {
          templateKey: 'custom',
          canvasWidth: 480,
          canvasHeight: 320,
          drawPrompt: 'ارسم القطرين المتقاطعين في مركز التناظر $O$ لإتمام متوازي الأضلاع $ABCD$.',
          baseShapes: [
            { id: 'b1', kind: 'segment', x1: 130, y1: 110, x2: 310, y2: 110, color: '#22163F' },
            { id: 'b2', kind: 'segment', x1: 130, y1: 110, x2: 170, y2: 220, color: '#22163F' },
            { id: 'b3', kind: 'point', x: 130, y: 110, label: 'A', color: '#22163F' },
            { id: 'b4', kind: 'point', x: 310, y: 110, label: 'B', color: '#22163F' },
            { id: 'b5', kind: 'point', x: 170, y: 220, label: 'D', color: '#22163F' },
            { id: 'b6', kind: 'point', x: 240, y: 165, label: 'O', color: '#3E1591' },
          ],
          teacherCorrectionShapes: [
            { id: 'c1', kind: 'segment', x1: 170, y1: 220, x2: 350, y2: 220, color: '#059669' },
            { id: 'c2', kind: 'segment', x1: 310, y1: 110, x2: 350, y2: 220, color: '#059669' },
            { id: 'c3', kind: 'point', x: 350, y: 220, label: 'C', color: '#059669' },
          ],
          teacherCorrectionText: 'في متوازي الأضلاع $ABCD$، القطران $[AC]$ و$[BD]$ متناصفان في مركز التناظر $O$.',
        },
        questions: [
          {
            id: 'q1',
            type: 'choice',
            prompt: 'نقطة تقاطع قطري متوازي الأضلاع تمثل:',
            choices: ['مركز تناظره', 'رأساً قائماً', 'محيطه', 'ارتفاعه'],
            correctChoiceIndex: 0,
            points: 10,
            explanation: 'قطرا متوازي الأضلاع يتقاطعان في منتصف كل منهما وهو مركز تناظره.',
          },
          {
            id: 'q2',
            type: 'number',
            prompt: 'إذا كان محيط متوازي أضلاع هو $26\\text{ cm}$ وطول أحد ضلعيه $8\\text{ cm}$، فما طول الضلع المجاور بالسنتيمتر؟',
            correctNumber: 5,
            unit: 'cm',
            points: 10,
            explanation: 'نصف المحيط يساوي $13\\text{ cm}$، إذن الضلع المجاور $13 - 8 = 5\\text{ cm}$.',
          },
        ],
        published: true,
      },
      {
        id: 'ex_2am_ops_1',
        title: 'تطبيق سريع: أولوية العمليات والأعداد النسبية',
        chapter: 'سلسلة العمليات على الأعداد الطبيعية والعشرية',
        category: 'daily',
        difficulty: 'easy',
        durationMinutes: 10,
        description: 'تمرين تفاعلي لتثبيت الأولوية في الحساب وحساب المجاميع الجبرية.',
        questions: [
          {
            id: 'q1',
            type: 'number',
            prompt: 'احسب: $3 + 4 \\times 5$',
            correctNumber: 23,
            points: 10,
            explanation: 'الأولوية للضرب: $4 \\times 5 = 20$ ثم $3 + 20 = 23$.',
          },
          {
            id: 'q2',
            type: 'number',
            prompt: 'احسب: $(-7) + (+12)$',
            correctNumber: 5,
            points: 10,
            explanation: 'العددان مختلفان في الإشارة: نطرح $12 - 7 = 5$ ونأخذ إشارة الأكبر مسافة (+).',
          },
        ],
        published: true,
      },
    ],
    events: [
      {
        id: 'event_2am_live',
        title: 'مراجعة فرض الفصل الأول — السنة 2 متوسط',
        eventType: 'devoir',
        eventDate: '2026-12-06',
        eventTime: '18:00',
        description: 'حل تمارين شاملة في سلاسل العمليات والكسور والتناظر المركزي.',
        link: '',
        published: true,
      },
    ],
  },
  '3AM': {
    settings: DEFAULT_SETTINGS,
    courses: SEED_COURSES,
    exercises: SEED_EXERCISES,
    events: SEED_EVENTS,
  },
  '4AM': {
    settings: {
      announcement:
        'مرحباً بمترشحي شهادة التعليم المتوسط (4AM BEM)! تدربوا يومياً على PGCD، الجذور، المتطابقات الشهيرة، طالس والدوال لضمان العلامة الكاملة.',
      targetDate: '2027-06-14',
      targetLabel: 'العد التنازلي لشهادة التعليم المتوسط (BEM)',
    },
    courses: [
      {
        id: 'course_4am_pgcd_roots',
        title: 'القاسم المشترك الأكبر (PGCD) والجذور التربيعية',
        chapter: 'الأعداد الطبيعية والأعداد الناطقة والجذور التربيعية',
        chapterOrder: 1,
        durationMin: 30,
        summary:
          'حساب القاسم المشترك الأكبر لعددين طبيعيين باستعمال خوارزمية إقليدس، اختزال الكسور، وتبسيط العبارات التي تتضمن جذوراً تربيعية.',
        keyRules:
          'لأجل $a \\ge 0$ و $b > 0$: $\\sqrt{a \\times b} = \\sqrt{a} \\times \\sqrt{b}$ و $\\sqrt{\\frac{a}{b}} = \\frac{\\sqrt{a}}{\\sqrt{b}}$.\nالعدد الأولي فيما بينهما قاسمهما المشترك الأكبر هو $1$.',
        videoUrl: '',
        pdfUrl: '',
        published: true,
      },
      {
        id: 'course_4am_thales_trig',
        title: 'خاصية طالس والنسب المثلثية في المثلث القائم',
        chapter: 'خاصية طالس والنسب المثلثية في المثلث القائم',
        chapterOrder: 5,
        durationMin: 35,
        summary:
          'حساب الأطوال بخاصية طالس، إثبات التوازي بالخاصية العكسية لطالس، وحساب $\\sin$ و $\\cos$ و $\\tan$ لزاوية حادة.',
        keyRules:
          'إذا تقاطع $(BM)$ و $(CN)$ في $A$ وكان $(MN) \\parallel (BC)$ فإن: $\\frac{AM}{AB} = \\frac{AN}{AC} = \\frac{MN}{BC}$.\n$\\cos^2 x + \\sin^2 x = 1$ ، $\\tan x = \\frac{\\sin x}{\\cos x}$.',
        videoUrl: '',
        pdfUrl: '',
        published: true,
      },
    ],
    exercises: [
      {
        id: 'ex_4am_geom_thales_1',
        title: 'تمرين تفاعلي هندسة: خاصية طالس والنسب المثلثية',
        chapter: 'خاصية طالس والنسب المثلثية في المثلث القائم',
        category: 'geometry',
        difficulty: 'medium',
        durationMinutes: 20,
        description: 'في المثلث $ABC$، لدينا $M \\in [AB]$ و $N \\in [AC]$ حيث $(MN) \\parallel (BC)$ و $AM=3, AB=6, BC=8$.',
        geometryData: {
          templateKey: 'custom',
          canvasWidth: 480,
          canvasHeight: 320,
          drawPrompt: 'ارسم المستقيم الموازي لـ $(BC)$ الذي يشمل $M$ ويقطع $[AC]$ في $N$.',
          baseShapes: [
            { id: 'b1', kind: 'segment', x1: 240, y1: 50, x2: 110, y2: 260, color: '#22163F' },
            { id: 'b2', kind: 'segment', x1: 240, y1: 50, x2: 370, y2: 260, color: '#22163F' },
            { id: 'b3', kind: 'segment', x1: 110, y1: 260, x2: 370, y2: 260, color: '#22163F', label: '8 cm' },
            { id: 'b4', kind: 'point', x: 240, y: 50, label: 'A', color: '#22163F' },
            { id: 'b5', kind: 'point', x: 110, y: 260, label: 'B', color: '#22163F' },
            { id: 'b6', kind: 'point', x: 370, y: 260, label: 'C', color: '#22163F' },
            { id: 'b7', kind: 'point', x: 175, y: 155, label: 'M', color: '#3E1591' },
          ],
          teacherCorrectionShapes: [
            { id: 'c1', kind: 'segment', x1: 175, y1: 155, x2: 305, y2: 155, color: '#059669' },
            { id: 'c2', kind: 'point', x: 305, y: 155, label: 'N', color: '#059669' },
          ],
          teacherCorrectionText: 'حسب خاصية طالس: $\\frac{AM}{AB} = \\frac{MN}{BC} \\Rightarrow \\frac{3}{6} = \\frac{MN}{8} \\Rightarrow MN = 4\\text{ cm}$.',
        },
        questions: [
          {
            id: 'q1',
            type: 'number',
            prompt: 'باستعمال خاصية طالس ($AM=3, AB=6, BC=8$)، احسب الطول $MN$ بالسنتيمتر:',
            correctNumber: 4,
            unit: 'cm',
            points: 10,
            explanation: '$MN = \\frac{3 \\times 8}{6} = 4\\text{ cm}$.',
          },
          {
            id: 'q2',
            type: 'choice',
            prompt: 'ما قيمة $\\cos^2(\\alpha) + \\sin^2(\\alpha)$ لأي زاوية حادة $\\alpha$ ؟',
            choices: ['$0$', '$1$', '$2$', '$0.5$'],
            correctChoiceIndex: 1,
            points: 10,
            explanation: 'العلاقة الأساسية في المثلث القائم هي $\\cos^2(\\alpha) + \\sin^2(\\alpha) = 1$.',
          },
        ],
        published: true,
      },
      {
        id: 'ex_4am_pgcd_identities_1',
        title: 'موضوع BEM نموذجي: PGCD والمتطابقات الشهيرة',
        chapter: 'الحساب الحرفي والمتطابقات الشهيرة والتحليل',
        category: 'exam',
        difficulty: 'hard',
        durationMinutes: 20,
        description: 'تدرب على النشر والتحليل وحساب القاسم المشترك الأكبر.',
        questions: [
          {
            id: 'q1',
            type: 'number',
            prompt: 'احسب القاسم المشترك الأكبر $\\text{PGCD}(48 ; 36)$:',
            correctNumber: 12,
            points: 10,
            explanation: 'بخوارزمية إقليدس: $48 = 36\\times 1 + 12$ و $36 = 12\\times 3 + 0$، إذن $\\text{PGCD}=12$.',
          },
          {
            id: 'q2',
            type: 'choice',
            prompt: 'ما تحليل العبارة $x^2 - 9$ باستعمال المتطابقة الشهيرة؟',
            choices: ['$(x-3)^2$', '$(x+3)^2$', '$(x-3)(x+3)$', '$(x-9)(x+1)$'],
            correctChoiceIndex: 2,
            points: 10,
            explanation: 'فرق مربعين: $a^2 - b^2 = (a-b)(a+b) \\Rightarrow x^2 - 3^2 = (x-3)(x+3)$.',
          },
        ],
        published: true,
      },
    ],
    events: [
      {
        id: 'event_4am_bem_mock',
        title: 'امتحان تجريبي تحضيري لشهادة BEM (4 متوسط)',
        eventType: 'exam',
        eventDate: '2026-12-12',
        eventTime: '18:30',
        description: 'موضوع شامل يغطي الجذور، المتطابقات الشهيرة، طالس والنسب المثلثية.',
        link: '',
        published: true,
      },
    ],
  },
};

export function getSeedDataForLevel(level: '1AM' | '2AM' | '3AM' | '4AM'): LevelSeedBundle {
  return SEED_BY_LEVEL[level] || SEED_BY_LEVEL['3AM'];
}
