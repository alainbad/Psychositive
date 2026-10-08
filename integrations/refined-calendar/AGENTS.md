<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Prototype architecture
- Scheduling uses the dedicated Supabase project. Clearly distinguish saved reservation requests from confirmed clinical appointments. Never store clinical intake in ordinary scheduling records.
- Keep all shareable pages as leaf file routes with route-specific metadata and shared site chrome around the root Outlet.
- Define visual roles and responsive compositions in the global design system; use reusable controls and content primitives for later porting.
- Keep session configuration shared; validate reservations and prevent overlaps in the database.

