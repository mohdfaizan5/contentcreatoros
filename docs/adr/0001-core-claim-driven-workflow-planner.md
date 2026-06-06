# Core-claim-driven workflow planner freshness

The workflow planner currently stores `pillar`, `contentType`, `angle`, and `suggestedPost`, but repetition still shows up because those fields do not act as real planning constraints. We decided to make `Core Claim` a first-class planning field, use it as the primary anti-repetition control, and treat `Content Angle` as a secondary control so weekly content stays strategically fresh without becoming mechanically template-driven.
