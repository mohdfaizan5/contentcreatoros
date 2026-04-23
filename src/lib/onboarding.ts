import type {
  OnboardingAnswers,
  OnboardingOption,
  OnboardingQuestion,
  OnboardingQuestionStepDefinition,
  OnboardingStepDefinition,
  OnboardingStage,
} from '@/types/onboarding';
import { IoIosPeople } from "react-icons/io";
import { MdOutlineWeb } from "react-icons/md";
import { VscWorkspaceTrusted } from "react-icons/vsc";
import { FaHandshakeAngle } from "react-icons/fa6";
import { TbChartFunnel } from "react-icons/tb";

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
    id: 'source-setup',
    kind: 'questions',
    title: 'Website and X Profile',
    eyebrow: 'Step 1',
    description: 'Add your website first so we can prefill as much as possible, then you only review and refine.',
    questions: [
      {
        key: 'website_url',
        type: 'text',
        inputType: 'url',
        label: 'Add your website URL',
        description: 'We scrape this URL to infer your onboarding answers.',
        placeholder: 'https://yourwebsite.com',
        required: true,
        important: true,
      },
      {
        key: 'x_account',
        type: 'text',
        inputType: 'url',
        label: 'Add your X account',
        description: 'Optional. Paste an @handle or full X profile URL.',
        placeholder: 'https://x.com/yourhandle',
      },
      {
        key: 'site_focus_pages',
        type: 'single-select',
        layout: 'pills',
        label: 'Which pages should we prioritize for context?',
        description: 'Optional. If unknown, leave it blank and we will use what is available.',
        options: [
          { value: 'homepage', label: 'Homepage' },
          { value: 'product_pages', label: 'Product pages' },
          { value: 'pricing_page', label: 'Pricing page' },
          { value: 'docs_or_blog', label: 'Docs / blog' },
          { value: 'all_pages', label: 'All pages' },
        ],
      },
    ],
  },
  {
    id: 'company-basics',
    kind: 'questions',
    title: 'Company Basics',
    eyebrow: 'Step 2',
    description: 'Capture the real problem and stakes so content hooks are specific, not generic.',
    questions: [
      {
        key: 'company_description',
        type: 'textarea',
        label: 'What does your company do in one clear sentence?',
        placeholder: 'We help founders automate social media content planning and execution.',
        required: true,
        important: true,
        rows: 3,
      },
      {
        key: 'user_google_query',
        type: 'textarea',
        label: 'What would someone Google right before needing your product?',
        placeholder: 'How to build a consistent X content strategy for SaaS',
        required: true,
        rows: 3,
      },
      {
        key: 'user_primary_frustration',
        type: 'textarea',
        label: 'What is frustrating your users right now?',
        description: 'Be concrete. What exactly keeps failing or feeling hard?',
        placeholder: 'They keep posting inconsistently and run out of strong content ideas.',
        required: true,
        rows: 4,
      },
      {
        key: 'problem_cost_of_inaction',
        type: 'textarea',
        label: 'What happens if they do not solve this problem?',
        placeholder: 'They lose momentum, visibility, and pipeline growth.',
        required: true,
        rows: 4,
      },
      {
        key: 'problem_solved',
        type: 'textarea',
        label: 'How do you solve it better than a DIY approach?',
        placeholder: 'We provide a clear strategy system so they can execute faster with less guesswork.',
        rows: 3,
      },
    ],
  },
  {
    id: 'audience',
    kind: 'questions',
    title: 'Target Audience',
    eyebrow: 'Step 3',
    description: 'Add deeper audience context so content feels targeted and credible.',
    questions: [
      {
        key: 'target_audience',
        type: 'multi-select',
        layout: 'pills',
        label: 'Who are you trying to reach?',
        description: 'Pick the main audiences you want this plan to attract.',
        required: true,
        important: true,
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
        key: 'audience_stage',
        type: 'single-select',
        layout: 'cards',
        label: 'What stage are they in?',
        required: true,
        options: [
          { value: 'idea_stage', label: 'Idea stage' },
          { value: 'early_startup', label: 'Early startup' },
          { value: 'scaling', label: 'Scaling' },
          { value: 'enterprise', label: 'Enterprise' },
        ],
      },
      {
        key: 'audience_tried_before',
        type: 'textarea',
        label: 'What have they already tried that did not work?',
        placeholder: 'Posting randomly, copying trends, and generic AI prompts.',
        rows: 3,
      },
      {
        key: 'audience_wrong_belief',
        type: 'textarea',
        label: 'What do they currently believe that you think is wrong?',
        placeholder: 'They think consistency means posting more, not posting strategically.',
        rows: 3,
      },
    ],
  },
  {
    id: 'goals',
    kind: 'questions',
    title: 'Goals',
    eyebrow: 'Step 4',
    description: 'Choose what the content should do for the business, not just what it should look like.',
    questions: [
      {
        key: 'content_goals',
        type: 'multi-select',
        layout: 'cards',
        label: 'What do you want from your content?',
        description: 'Select the top outcomes you want the plan to optimize for.',
        required: true,
        important: true,
        minSelections: 1,
        maxSelections: 3,
        otherOption: {
          answerKey: 'content_goals_other',
          label: 'Other goal',
          placeholder: 'Type another content goal',
          optionLabel: 'Other',
        },

        options: [
          { value: 'build_audience', label: 'Build audience', description: 'Grow reach and followers', icon: IoIosPeople },
          { value: 'drive_traffic', label: 'Drive traffic', description: 'Send people to your site or offer', icon: MdOutlineWeb },
          { value: 'generate_leads', label: 'Generate leads', description: 'Turn attention into pipeline', icon: TbChartFunnel },
          { value: 'sell_product', label: 'Sell product', description: 'Support conversion-focused campaigns', icon: FaHandshakeAngle },
          { value: 'build_authority', label: 'Build authority', description: 'Become the trusted voice in your niche', icon: VscWorkspaceTrusted },
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
    eyebrow: 'Step 5',
    description: 'Shape how the content sounds so it feels like your brand, not a random AI voice.',
    questions: [
      {
        key: 'tone',
        type: 'single-select',
        layout: 'cards',
        label: 'What tone should the content use?',
        required: true,
        important: true,
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
        important: true,
        options: [
          { value: 'short_posts', label: 'Short tweets', description: 'Fast, lightweight, and frequent' },
          { value: 'threads', label: 'Threads', description: 'Deeper educational breakdowns' },
          { value: 'mixed', label: 'Mixed', description: 'A blend of short posts and threads' },
        ],
      },
      {
        key: 'wants_strong_opinions',
        type: 'single-select',
        layout: 'pills',
        label: 'Should your content include strong opinions?',
        required: true,
        options: [
          { value: 'yes', label: 'Yes, strong opinions' },
          { value: 'balanced', label: 'Balanced takes' },
          { value: 'no', label: 'No, mostly neutral' },
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
    eyebrow: 'Step 6',
    description: 'Set the rhythm, pillars, and formats so the plan is realistic and repeatable.',
    questions: [
      {
        key: 'posting_frequency',
        type: 'single-select',
        layout: 'cards',
        label: 'How often do you want to post?',
        required: true,
        important: true,
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
        important: true,
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
      // {
      //   key: 'content_formats',
      //   type: 'multi-select',
      //   layout: 'pills',
      //   label: 'What formats can the plan include?',
      //   required: true,
      //   minSelections: 1,
      //   maxSelections: 4,
      //   otherOption: {
      //     answerKey: 'content_formats_other',
      //     label: 'Other format',
      //     placeholder: 'Type another content format',
      //     optionLabel: 'Other',
      //   },
      //   options: [
      //     { value: 'text', label: 'Text' },
      //     { value: 'image_text', label: 'Image + text' },
      //     { value: 'video_text', label: 'Video + text' },
      //     { value: 'motion_graphics', label: 'Motion graphics' },
      //   ],
      // },
    ],
  },
  {
    id: 'product-details',
    kind: 'questions',
    title: 'Product Details',
    eyebrow: 'Step 7',
    description: 'Capture differentiation, outcome, and proof so posts can be sharp and specific.',
    questions: [
      {
        key: 'unique_value_prop',
        type: 'textarea',
        label: 'What makes you different from alternatives?',
        placeholder: 'We turn positioning into distribution-ready content in minutes, not days.',
        required: true,
        important: true,
        rows: 4,
      },
      {
        key: 'alternatives_without_you',
        type: 'textarea',
        label: 'What would users use if you did not exist?',
        placeholder: 'Spreadsheets, generic AI tools, and manual planning workflows.',
        rows: 3,
      },
      {
        key: 'standout_feature',
        type: 'text',
        label: 'What is one feature users love the most?',
        placeholder: 'Auto-generated 30-day content calendar with editing controls.',
      },
      {
        key: 'expected_result_7_30_days',
        type: 'textarea',
        label: 'What result can users expect in 7-30 days?',
        placeholder: 'Higher posting consistency and stronger content quality in the first month.',
        rows: 3,
      },
      {
        key: 'proof_signals',
        type: 'textarea',
        label: 'Any proof signals? (users, revenue, growth, outcomes)',
        description: 'Optional. Keep it factual. Numbers can be rough if real.',
        placeholder: '120+ users, 35% week-over-week increase in published posts.',
        rows: 4,
      },
      {
        key: 'pricing_model',
        type: 'single-select',
        layout: 'pills',
        label: 'What is your pricing model?',
        required: true,
        important: true,
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
          { value: 'enterprise', label: 'Enterprise' },
        ],
      },
      {
        key: 'business_stage',
        type: 'single-select',
        layout: 'pills',
        label: 'What stage is the product in?',
        required: true,
        important: true,
        options: [
          { value: 'got_started', label: 'Got started' },
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
    eyebrow: 'Step 8',
    description: 'Use this to sharpen positioning and comparison angles for content.',
    questions: [
      {
        key: 'competitor_accounts',
        type: 'tag-input',
        label: 'Who are your top competitors?',
        description: 'Add up to 3 competitor handles or URLs.',
        placeholder: '@competitor',
        maxItems: 3,
      },
      {
        key: 'competitor_choose_them',
        type: 'textarea',
        label: 'Why would someone choose them over you?',
        placeholder: 'They are more established and have stronger brand recognition.',
        rows: 3,
      },
      {
        key: 'competitor_choose_you',
        type: 'textarea',
        label: 'Why should someone choose you instead?',
        placeholder: 'Faster setup, clearer workflow, and better strategy quality.',
        rows: 3,
      },
      {
        key: 'competitor_get_wrong',
        type: 'textarea',
        label: 'What do competitors get wrong?',
        placeholder: 'They focus on volume instead of strategic relevance and quality.',
        rows: 3,
      },
    ],
  },
  {
    id: 'beliefs',
    kind: 'questions',
    title: 'Beliefs and Opinions',
    eyebrow: 'Step 9',
    description: 'Add perspective so posts can sound opinionated and distinct, not generic.',
    questions: [
      {
        key: 'industry_belief',
        type: 'textarea',
        label: 'What do you strongly believe about your industry?',
        placeholder: 'Distribution should be treated as a product surface, not just marketing output.',
        rows: 3,
      },
      // {
      //   key: 'common_wrong_practice',
      //   type: 'textarea',
      //   label: 'What is something most people are doing wrong?',
      //   placeholder: 'They optimize for reach before they clarify positioning.',
      //   rows: 3,
      // },
      // {
      //   key: 'agreed_hot_take',
      //   type: 'text',
      //   label: 'What is one hot take you agree with?',
      //   placeholder: 'Most growth issues are positioning problems, not channel problems.',
      // },
      {
        key: 'disagreed_myth',
        type: 'text',
        label: 'What is one common myth you disagree with?',
        placeholder: 'Post more is enough to grow.',
      },
    ],
  },
  {
    id: 'content-seeds',
    kind: 'questions',
    title: 'Recent Content Seeds',
    eyebrow: 'Step 10',
    description: 'Optional. Add recent thoughts so generated content feels current and human.',
    questions: [
      {
        key: 'recent_observations',
        type: 'tag-input',
        label: 'Share up to 3 recent things you noticed or learned',
        placeholder: 'Type one thought and press Enter',
        maxItems: 3,
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

export function getAllOnboardingQuestions() {
  return getQuestionSteps().flatMap((step) => step.questions);
}

export function getImportantQuestions() {
  return getAllOnboardingQuestions().filter((question) => Boolean(question.important));
}

export function getOptionalQuestions() {
  return getAllOnboardingQuestions().filter((question) => !question.important);
}

export function getOnboardingQuestionImportanceAudit() {
  return getQuestionSteps().map((step) => {
    const importantKeys = step.questions
      .filter((question) => Boolean(question.important))
      .map((question) => question.key);
    const optionalKeys = step.questions
      .filter((question) => !question.important)
      .map((question) => question.key);

    return {
      stepId: step.id,
      stepTitle: step.title,
      importantKeys,
      optionalKeys,
    };
  });
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

export function hasAnswerValue(value: unknown) {
  if (Array.isArray(value)) {
    return value.length > 0;
  }

  if (typeof value === 'string') {
    return value.trim().length > 0;
  }

  return Boolean(value);
}

function hasValue(value: unknown) {
  return hasAnswerValue(value);
}

type OnboardingProgressBucket = {
  total: number;
  answeredCount: number;
  remainingCount: number;
  answeredKeys: string[];
  remainingKeys: string[];
};

export type OnboardingImportanceProgress = {
  important: OnboardingProgressBucket;
  optional: OnboardingProgressBucket;
};

function buildProgressBucket(
  questions: OnboardingQuestion[],
  answers: OnboardingAnswers,
): OnboardingProgressBucket {
  const answeredKeys = questions
    .filter((question) => hasAnswerValue(answers[question.key]))
    .map((question) => question.key);

  const answeredKeySet = new Set(answeredKeys);
  const remainingKeys = questions
    .filter((question) => !answeredKeySet.has(question.key))
    .map((question) => question.key);

  return {
    total: questions.length,
    answeredCount: answeredKeys.length,
    remainingCount: remainingKeys.length,
    answeredKeys,
    remainingKeys,
  };
}

export function getOnboardingImportanceProgress(
  answers: OnboardingAnswers,
): OnboardingImportanceProgress {
  const importantQuestions = getImportantQuestions();
  const optionalQuestions = getOptionalQuestions();

  return {
    important: buildProgressBucket(importantQuestions, answers),
    optional: buildProgressBucket(optionalQuestions, answers),
  };
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
      important: Boolean(question.important),
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
