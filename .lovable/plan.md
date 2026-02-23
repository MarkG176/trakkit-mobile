

## Dynamic Help & FAQ by Team Type

### Overview
Update the Help & FAQ dialog to show different questions based on the agent's `team_type`. All team types share a common set of questions, plus a team-specific first question with placeholder answers.

### Changes

**1. `src/components/profile/HelpFAQDialog.tsx`**
- Accept `teamType` as a prop
- Restructure FAQ data: define shared questions (common to all types) and a team-specific first question
- Shared questions (kept for all types):
  - "How to install?" (new, with install instructions referencing trakkit-mobile.lovable.app)
  - "How do I check in?" (existing answer)
  - "My selfie won't upload -- what do I do?" (existing answer)
  - "The app feels slow or is stuck" (existing answer)
  - "How do I view my stats?" (existing answer)
- Remove the other questions that are no longer needed (recording sales, giveaways, add location, evening report, data not showing)
- First question is always: "How to use TraKKiT for [team_type display name] activations?" with a placeholder answer per type (e.g., "Guide coming soon for [type] activations.")
- Map internal team_type values (e.g., `sales_activation`) to readable display names (e.g., "Sales Activation")

**2. `src/components/profile/ProfileHeader.tsx`**
- Import and render `HelpFAQDialog`, passing the `teamType` prop
- Add a help icon button in the top-right corner of the header
- Accept `teamType` as a prop from the parent

**3. `src/pages/Profile.tsx`**
- Remove `HelpFAQDialog` from the Account card
- Pass `currentTeamType` to `ProfileHeader` so it can forward it to the FAQ dialog

### Question Order (final)
1. "How to use TraKKiT for [Type] activations?" -- placeholder answer per team type
2. "How to install?" -- fixed install instructions
3. "How do I check in?" -- existing answer
4. "My selfie won't upload -- what do I do?" -- existing answer
5. "The app feels slow or is stuck" -- existing answer
6. "How do I view my stats?" -- existing answer

