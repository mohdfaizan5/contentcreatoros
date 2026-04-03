import type {
  OnboardingAnswers,
  OnboardingOption,
  OnboardingQuestion,
  OnboardingQuestionStepDefinition,
  OnboardingStepDefinition,
  OnboardingStage,
} from '@/types/onboarding';

export const OTHER_OPTION_VALUE = '__other';
export const ONBOARDING_FLOW_KEY = 'x_content_strategy_v2';

export const CONTENT_ONBOARDING_STEPS: OnboardingStepDefinition[] = [
  {
    id: 'welcome',
    kind: 'screen',
    title: 'Create your 30-day X content plan in 2 minutes',
    eyebrow: '30-day X planning',
    description: 'No strategy skills needed. AI will handle everything.',
    screen: {
      variant: 'entry',
      ctaLabel: 'Start',
      estimatedTimeLabel: 'Takes about 2 minutes',
      highlights: [
        'Minimum friction',
        'Smart inputs',
        'AI-ready structure',
        'Fast guided setup',
      ],
      previewItems: [
        {
          title: 'Structured content brief',
          description: 'Audience, goals, tone, pillars, and capability in one place.',
        },
        {
          title: 'Reusable schema',
          description: 'Future updates should mostly be data changes, not UI rewrites.',
        },
        {
          title: 'AI-ready output',
          description: 'Saved answers stay structured for plan generation later.',
        },
      ],
    },
  },
  {
    id: 'company-basics',
    kind: 'questions',
    title: 'Company Basics',
    eyebrow: 'Step 1',
    description: 'Give the system enough context to understand what you sell and why it matters.',
    questions: [
      {
        key: 'company_description',
        type: 'textarea',
        label: 'What does your company do?',
        placeholder: 'We help founders automate social media content.',
        required: true,
        rows: 4,
      },
      {
        key: 'problem_solved',
        type: 'textarea',
        label: 'What problem do you solve?',
        description: 'What pain point are you making easier, faster, or cheaper?',
        placeholder: 'Founders know content matters, but they do not have time to plan and ship consistently.',
        required: true,
        rows: 4,
      },
      {
        key: 'x_account',
        type: 'text',
        inputType: 'url',
        label: 'Add your X account',
        description: 'Optional. Paste an @handle or full X profile URL.',
        placeholder: 'https://x.com/yourhandle',
      },
    ],
  },
  {
    id: 'audience',
    kind: 'questions',
    title: 'Target Audience',
    eyebrow: 'Step 2',
    description: 'Tell us who you want to reach so the content feels specific instead of generic.',
    questions: [
      {
        key: 'target_audience',
        type: 'multi-select',
        layout: 'pills',
        label: 'Who are you trying to reach?',
        description: 'Pick the main audiences you want this plan to attract.',
        required: true,
        maxSelections: 4,
        otherOption: {
          answerKey: 'target_audience_other',
          label: 'Other audience',
          placeholder: 'Type another audience',
          optionLabel: 'Other',
        },
        options: [
          { value: 'founders', label: 'Founders' },
          { value: 'developers', label: 'Developers' },
          { value: 'designers', label: 'Designers' },
          { value: 'marketers', label: 'Marketers' },
          { value: 'students', label: 'Students' },
          { value: 'creators', label: 'Creators' },
        ],
      },
      {
        key: 'audience_experience',
        type: 'single-select',
        layout: 'pills',
        label: 'What is their experience level?',
        required: true,
        options: [
          { value: 'beginner', label: 'Beginner' },
          { value: 'intermediate', label: 'Intermediate' },
          { value: 'advanced', label: 'Advanced' },
        ],
      },
      {
        key: 'audience_priorities',
        type: 'multi-select',
        layout: 'pills',
        label: 'What do they care about most?',
        description: 'This helps shape the hooks, examples, and CTA angle.',
        required: true,
        minSelections: 1,
        maxSelections: 3,
        otherOption: {
          answerKey: 'audience_priorities_other',
          label: 'Other priority',
          placeholder: 'Type another audience priority',
          optionLabel: 'Other',
        },
        options: [
          { value: 'growing_audience', label: 'Growing audience' },
          { value: 'making_money', label: 'Making money' },
          { value: 'learning_skills', label: 'Learning skills' },
          { value: 'saving_time', label: 'Saving time' },
          { value: 'staying_updated', label: 'Staying updated' },
        ],
      },
    ],
  },
  {
    id: 'goals',
    kind: 'questions',
    title: 'Goals',
    eyebrow: 'Step 3',
    description: 'Choose what the content should do for the business, not just what it should look like.',
    questions: [
      {
        key: 'content_goals',
        type: 'multi-select',
        layout: 'cards',
        label: 'What do you want from your content?',
        description: 'Select the top outcomes you want the plan to optimize for.',
        required: true,
        minSelections: 1,
        maxSelections: 3,
        otherOption: {
          answerKey: 'content_goals_other',
          label: 'Other goal',
          placeholder: 'Type another content goal',
          optionLabel: 'Other',
        },
        options: [
          { value: 'build_audience', label: 'Build audience', description: 'Grow reach and followers' },
          { value: 'drive_traffic', label: 'Drive traffic', description: 'Send people to your site or offer' },
          { value: 'generate_leads', label: 'Generate leads', description: 'Turn attention into pipeline' },
          { value: 'sell_product', label: 'Sell product', description: 'Support conversion-focused campaigns' },
          { value: 'build_authority', label: 'Build authority', description: 'Become the trusted voice in your niche' },
        ],
      },
      {
        key: 'cta_style',
        type: 'single-select',
        layout: 'cards',
        label: 'What CTA style fits best?',
        required: true,
        options: [
          { value: 'no_cta', label: 'No CTA', description: 'Pure value, no ask' },
          { value: 'soft_cta', label: 'Soft CTA', description: 'Follow, like, reply, or bookmark' },
          { value: 'hard_cta', label: 'Hard CTA', description: 'Sign up, buy, or book a call' },
        ],
      },
    ],
  },
  {
    id: 'style',
    kind: 'questions',
    title: 'Style & Personality',
    eyebrow: 'Step 4',
    description: 'Shape how the content sounds so it feels like your brand, not a random AI voice.',
    questions: [
      {
        key: 'tone',
        type: 'single-select',
        layout: 'cards',
        label: 'What tone should the content use?',
        required: true,
        options: [
          { value: 'professional', label: 'Professional', description: 'Polished and credible' },
          { value: 'casual', label: 'Casual', description: 'Friendly and relaxed' },
          { value: 'witty', label: 'Witty', description: 'Sharp and memorable' },
          { value: 'bold', label: 'Bold', description: 'Opinionated and punchy' },
          { value: 'educational', label: 'Educational', description: 'Useful, clear, and practical' },
        ],
      },
      {
        key: 'writing_style',
        type: 'single-select',
        layout: 'cards',
        label: 'What writing style do you want most?',
        required: true,
        options: [
          { value: 'short_posts', label: 'Short tweets', description: 'Fast, lightweight, and frequent' },
          { value: 'threads', label: 'Threads', description: 'Deeper educational breakdowns' },
          { value: 'mixed', label: 'Mixed', description: 'A blend of short posts and threads' },
        ],
      },
      {
        key: 'inspiration_accounts',
        type: 'tag-input',
        label: 'Paste 1-2 X accounts you like',
        description: 'Optional. These help guide voice and structure.',
        placeholder: '@account or https://x.com/account',
        maxItems: 2,
      },
    ],
  },
  {
    id: 'strategy',
    kind: 'questions',
    title: 'Content Strategy',
    eyebrow: 'Step 5',
    description: 'Set the rhythm, pillars, and formats so the plan is realistic and repeatable.',
    questions: [
      {
        key: 'posting_frequency',
        type: 'single-select',
        layout: 'cards',
        label: 'How often do you want to post?',
        required: true,
        options: [
          { value: '2_per_week', label: '2/week', description: 'Easy mode' },
          { value: '3_per_week', label: '3/week', description: 'Balanced pace' },
          { value: '5_per_week', label: '5/week', description: 'Recommended' },
          { value: 'daily', label: 'Daily', description: 'Highest volume' },
        ],
      },
      {
        key: 'content_pillars',
        type: 'multi-select',
        layout: 'cards',
        label: 'Which content pillars should anchor the plan?',
        description: 'Pick three to five categories you want to post about repeatedly.',
        required: true,
        minSelections: 3,
        maxSelections: 5,
        options: [
          { value: 'educational', label: 'Educational', description: 'Teach useful ideas and frameworks' },
          { value: 'product', label: 'Product', description: 'Show what the product does and why it matters' },
          { value: 'industry_insights', label: 'Industry insights', description: 'Comment on market shifts and lessons' },
          { value: 'entertaining', label: 'Entertaining', description: 'Keep the feed lively and human' },
          { value: 'behind_the_scenes', label: 'Behind-the-scenes', description: 'Build trust with process and progress' },
          { value: 'case_studies', label: 'Case studies', description: 'Use proof and examples' },
          { value: 'trends', label: 'Trends', description: 'React to timely moments' },
          { value: 'memes', label: 'Memes', description: 'Lightweight culture-driven content' },
        ],
      },
      {
        key: 'content_formats',
        type: 'multi-select',
        layout: 'pills',
        label: 'What formats can the plan include?',
        required: true,
        minSelections: 1,
        maxSelections: 4,
        otherOption: {
          answerKey: 'content_formats_other',
          label: 'Other format',
          placeholder: 'Type another content format',
          optionLabel: 'Other',
        },
        options: [
          { value: 'text', label: 'Text' },
          { value: 'image_text', label: 'Image + text' },
          { value: 'video_text', label: 'Video + text' },
          { value: 'motion_graphics', label: 'Motion graphics' },
        ],
      },
    ],
  },
  {
    id: 'product-details',
    kind: 'questions',
    title: 'Product Details',
    eyebrow: 'Step 6',
    description: 'Give the planner proof points so the content is grounded in a real offer.',
    questions: [
      {
        key: 'key_features',
        type: 'tag-input',
        label: 'Key features',
        description: 'Add short bullet-style feature points.',
        placeholder: 'Type a feature and press Enter',
        maxItems: 6,
      },
      {
        key: 'unique_value_prop',
        type: 'textarea',
        label: 'What makes you different?',
        description: 'Describe the core differentiator or USP.',
        placeholder: 'We turn messy content ideas into a structured 30-day X plan in minutes.',
        rows: 4,
      },
      {
        key: 'pricing_model',
        type: 'single-select',
        layout: 'pills',
        label: 'What is your pricing model?',
        required: true,
        otherOption: {
          answerKey: 'pricing_model_other',
          label: 'Other pricing model',
          placeholder: 'Type another pricing model',
          optionLabel: 'Other',
        },
        options: [
          { value: 'free', label: 'Free' },
          { value: 'freemium', label: 'Freemium' },
          { value: 'paid', label: 'Paid' },
        ],
      },
      {
        key: 'business_stage',
        type: 'single-select',
        layout: 'pills',
        label: 'What stage is the product in?',
        required: true,
        options: [
          { value: 'just_launched', label: 'Just launched' },
          { value: 'growing', label: 'Growing' },
          { value: 'established', label: 'Established' },
        ],
      },
    ],
  },
  {
    id: 'competitors',
    kind: 'questions',
    title: 'Competitors',
    eyebrow: 'Step 7',
    description: 'Optional context that helps the system avoid generic messaging and identify your angle.',
    questions: [
      {
        key: 'competitor_accounts',
        type: 'tag-input',
        label: 'Add competitor X accounts',
        description: 'Optional. Use handles or profile URLs.',
        placeholder: '@competitor',
        maxItems: 5,
      },
      {
        key: 'competitor_notes',
        type: 'textarea',
        label: 'What do you like about them?',
        description: 'Optional. Note anything you want to learn from or avoid.',
        placeholder: 'They explain complex ideas clearly and their product posts feel useful, not salesy.',
        rows: 3,
      },
    ],
  },
  {
    id: 'capability',
    kind: 'questions',
    title: 'Content Capability',
    eyebrow: 'Step 8',
    description: 'This keeps the final plan realistic instead of asking you to produce assets you cannot make yet.',
    questions: [
      {
        key: 'content_capability',
        type: 'single-select',
        layout: 'cards',
        label: 'What can you realistically create?',
        required: true,
        options: [
          { value: 'text_only', label: 'Only text', description: 'Keep the plan simple and fast' },
          { value: 'simple_graphics', label: 'Simple graphics', description: 'Basic designed assets are doable' },
          { value: 'high_quality_visuals', label: 'High-quality visuals', description: 'Polished visual content is realistic' },
          { value: 'videos', label: 'Videos', description: 'You can support video-heavy content' },
        ],
      },
    ],
  },
];

function normalizeSelectionLabels(
  value: string | string[],
  options: OnboardingOption[] | undefined,
) {
  const selectedValues = Array.isArray(value) ? value : [value];

  return selectedValues
    .filter((item) => item && item !== OTHER_OPTION_VALUE)
    .map((item) => options?.find((option) => option.value === item)?.label ?? item);
}

export function getQuestionSteps() {
  return CONTENT_ONBOARDING_STEPS.filter(
    (step): step is OnboardingQuestionStepDefinition => step.kind === 'questions',
  );
}

export function getInitialOnboardingAnswers() {
  return getQuestionSteps().reduce<OnboardingAnswers>((accumulator, step) => {
    step.questions.forEach((question) => {
      accumulator[question.key] =
        question.type === 'multi-select' || question.type === 'tag-input' ? [] : '';

      if ('otherOption' in question && question.otherOption) {
        accumulator[question.otherOption.answerKey] = '';
      }
    });

    return accumulator;
  }, {});
}

export type PersistedOnboardingAnswerRow = {
  question_key: string;
  answer: unknown;
};

export function getAnswersFromPersistedRows(rows: PersistedOnboardingAnswerRow[]) {
  const answers = getInitialOnboardingAnswers();
  const questionsByKey = new Map(
    getQuestionSteps().flatMap((step) => step.questions.map((question) => [question.key, question])),
  );

  for (const row of rows) {
    const question = questionsByKey.get(row.question_key);

    if (!question) {
      continue;
    }

    const value = row.answer;

    if (
      (question.type === 'single-select' || question.type === 'multi-select') &&
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      'value' in value
    ) {
      const structuredValue = value as { value?: unknown; otherText?: unknown };

      if (typeof structuredValue.value === 'string' || Array.isArray(structuredValue.value)) {
        answers[question.key] = structuredValue.value as string | string[];
      }

      if ('otherOption' in question && question.otherOption) {
        answers[question.otherOption.answerKey] =
          typeof structuredValue.otherText === 'string' ? structuredValue.otherText : '';
      }

      continue;
    }

    if (question.type === 'tag-input') {
      answers[question.key] = Array.isArray(value)
        ? value.filter((item): item is string => typeof item === 'string')
        : typeof value === 'string' && value.trim().length > 0
          ? [value]
          : [];
      continue;
    }

    if (Array.isArray(value)) {
      answers[question.key] = value.filter((item): item is string => typeof item === 'string');
      continue;
    }

    if (typeof value === 'string') {
      answers[question.key] = value;
    }
  }

  return answers;
}

function hasValue(value: unknown) {
  if (Array.isArray(value)) {
    return value.length > 0;
  }

  if (typeof value === 'string') {
    return value.trim().length > 0;
  }

  return Boolean(value);
}

export function isOtherOptionSelected(question: OnboardingQuestion, answers: OnboardingAnswers) {
  if (!('otherOption' in question) || !question.otherOption) {
    return false;
  }

  const value = answers[question.key];

  if (question.type === 'single-select') {
    return value === OTHER_OPTION_VALUE;
  }

  if (question.type === 'multi-select') {
    return Array.isArray(value) && value.includes(OTHER_OPTION_VALUE);
  }

  return false;
}

export function isQuestionComplete(question: OnboardingQuestion, answers: OnboardingAnswers) {
  if (!question.required) {
    return true;
  }

  const value = answers[question.key];

  if (!hasValue(value)) {
    return false;
  }

  if (
    question.type === 'multi-select' &&
    Array.isArray(value) &&
    question.minSelections &&
    value.length < question.minSelections
  ) {
    return false;
  }

  if (
    isOtherOptionSelected(question, answers) &&
    'otherOption' in question &&
    question.otherOption &&
    !hasValue(answers[question.otherOption.answerKey])
  ) {
    return false;
  }

  return true;
}

export function isStepComplete(step: OnboardingQuestionStepDefinition, answers: OnboardingAnswers) {
  return step.questions.every((question) => isQuestionComplete(question, answers));
}

export function isStepSkippable(step: OnboardingQuestionStepDefinition) {
  return step.questions.every((question) => !question.required);
}

export function getQuestionSummaryValue(
  question: OnboardingQuestion,
  answers: OnboardingAnswers,
) {
  const value = answers[question.key];

  if (!hasValue(value)) {
    return 'Skipped';
  }

  if (question.type === 'single-select' || question.type === 'multi-select') {
    const labels = normalizeSelectionLabels(value as string | string[], question.options);

    if (
      isOtherOptionSelected(question, answers) &&
      'otherOption' in question &&
      question.otherOption &&
      hasValue(answers[question.otherOption.answerKey])
    ) {
      labels.push(String(answers[question.otherOption.answerKey]));
    }

    return labels.join(', ');
  }

  if (Array.isArray(value)) {
    return value.join(', ');
  }

  return value;
}

function getLabelsForQuestion(key: string, answers: OnboardingAnswers) {
  const question = getQuestionSteps()
    .flatMap((step) => step.questions)
    .find((item) => item.key === key);

  if (!question) {
    return [];
  }

  const rawValue = answers[key];

  if (!hasValue(rawValue)) {
    return [];
  }

  if (question.type === 'single-select' || question.type === 'multi-select') {
    const labels = normalizeSelectionLabels(rawValue as string | string[], question.options);

    if (
      isOtherOptionSelected(question, answers) &&
      'otherOption' in question &&
      question.otherOption &&
      hasValue(answers[question.otherOption.answerKey])
    ) {
      labels.push(String(answers[question.otherOption.answerKey]));
    }

    return labels;
  }

  return Array.isArray(rawValue) ? rawValue : [rawValue];
}

export function getPersistedQuestionDefinitions() {
  return getQuestionSteps().flatMap((step) =>
    step.questions.map((question) => ({
      flowKey: ONBOARDING_FLOW_KEY,
      questionKey: question.key,
      question: question.label,
    })),
  );
}

export function getPersistedAnswerEntries(answers: OnboardingAnswers) {
  return getQuestionSteps().flatMap((step) =>
    step.questions.flatMap((question) => {
      const rawValue = answers[question.key];

      if (!hasValue(rawValue)) {
        return [];
      }

      const answer =
        (question.type === 'single-select' || question.type === 'multi-select') &&
        'otherOption' in question &&
        question.otherOption
          ? {
              value: rawValue,
              otherText: isOtherOptionSelected(question, answers)
                ? String(answers[question.otherOption.answerKey] ?? '').trim() || null
                : null,
            }
          : rawValue;

      return [
        {
          questionKey: question.key,
          answer,
        },
      ];
    }),
  );
}

export function hydrateOnboardingAnswersFromStoredRows(
  rows: Array<{ question_key: string; answer: unknown }>,
) {
  const answers = getInitialOnboardingAnswers();
  const questionsByKey = new Map(
    getQuestionSteps().flatMap((step) => step.questions.map((question) => [question.key, question])),
  );

  rows.forEach((row) => {
    const question = questionsByKey.get(row.question_key);

    if (!question) {
      return;
    }

    const answer = row.answer;

    if (
      answer &&
      typeof answer === 'object' &&
      !Array.isArray(answer) &&
      'value' in answer
    ) {
      const complexAnswer = answer as {
        otherText?: string | null;
        value: string | string[];
      };

      answers[row.question_key] = complexAnswer.value;

      if (
        question.type !== 'text' &&
        question.type !== 'textarea' &&
        question.type !== 'tag-input' &&
        question.otherOption &&
        complexAnswer.otherText
      ) {
        answers[question.otherOption.answerKey] = complexAnswer.otherText;
      }

      return;
    }

    if (typeof answer === 'string' || Array.isArray(answer)) {
      answers[row.question_key] = answer;
    }
  });

  return answers;
}

export function mapAnswersToLegacyStage(answers: OnboardingAnswers): OnboardingStage {
  switch (answers.business_stage) {
    case 'just_launched':
      return 'launched_no_revenue';
    case 'growing':
      return 'making_revenue';
    case 'established':
      return 'fulltime';
    default:
      return 'building_mvp';
  }
}

export function getAIPersonasFromAnswers(answers: OnboardingAnswers) {
  const personas = ['X Content Strategist'];
  const goals = new Set(getLabelsForQuestion('content_goals', answers));
  const formats = new Set(getLabelsForQuestion('content_formats', answers));
  const pillars = new Set(getLabelsForQuestion('content_pillars', answers));

  if (goals.has('Generate leads') || goals.has('Sell product')) {
    personas.push('Growth Strategist');
  }

  if (pillars.has('Educational') || pillars.has('Industry insights')) {
    personas.push('Thought Leadership Editor');
  }

  if (formats.has('Video + text') || formats.has('Motion graphics')) {
    personas.push('Creative Producer');
  }

  return [...new Set(personas)];
}

export function getFocusAreasFromAnswers(answers: OnboardingAnswers) {
  const pillars = getLabelsForQuestion('content_pillars', answers);
  const goals = getLabelsForQuestion('content_goals', answers);
  const audience = getLabelsForQuestion('target_audience', answers);

  return [...new Set([...pillars, ...goals, ...audience])].slice(0, 6);
}
