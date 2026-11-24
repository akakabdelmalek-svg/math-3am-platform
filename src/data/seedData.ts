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
      'حل تمارين نموذجية في الهندسة وبراهين المثلث القائم والدائرة المحيطة به مع الأستاذ دقيش علي.',
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
