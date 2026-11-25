# GitHub security issues

Findings optionally carry `acceptance: { reason, accepted_by, expires_on }` (strings).
Upstream deterministic repository policy supplies acceptance and enforces expiry.
The issue preserves every finding and original severity, adding acceptance details
and separate active/accepted counts when present. Severity counts remain totals.
No acceptance preserves existing output. New acceptance text uses escaped Mustache
tags; existing evidence interpolation is unchanged.

`accepted_by` declares a responsible party, not an authenticated approver.
Repository review governs approval; model content must not authorize acceptance.

Run `npm test` and `./node_modules/.bin/tsc --noEmit --incremental false`.
