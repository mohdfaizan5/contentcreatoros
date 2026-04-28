Rule 3: No “magic imports”

Bad:

import { something } from '@/lib/utils';

Good:

import { formatDate } from '@/features/onboarding/onboarding.utils';

👉 Makes dependencies explicit.

Rule 4: Avoid default exports

They destroy readability at scale.

Rule 5: Naming matters

Bad:

helpers.ts
utils.ts
stuff.ts

Good:

onboarding-validator.ts
user-permissions.ts
ai-response-parser.ts