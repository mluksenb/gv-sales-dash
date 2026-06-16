# Intercom conversation exports

Normalized, PII-stripped Intercom conversations for downstream AI use cases.

## Layout

- `conversations/{id}.json` — one normalized record per conversation (gitignored)
- `manifest.jsonl` — index of exported conversation IDs (gitignored)
- `export-ids.json` — optional list of conversation IDs to export
- `taxonomy.md` — full category definitions (human reference)
- `taxonomy-prompt.md` — compact taxonomy for Gemini classification

## Setup

1. Create an Intercom access token in [Developer Hub](https://app.intercom.com/a/apps/_/developer-hub) → Authentication.
2. Copy `.env.example` to `.env` and set your tokens:

```bash
cp .env.example .env
# Edit .env and set INTERCOM_ACCESS_TOKEN and GEMINI_API_KEY
```

## Export via REST API (recommended)

```bash
# Search for the 200 most recent closed conversations (all channels, by created_at), then export
npm run intercom:export

# Next 200 by created_at (ranked 201–400)
npm run intercom:export:next

# Custom offset/limit/concurrency search (re-scans from today; slow for large offsets)
npm run intercom:export -- --search --offset 400 --limit 200 --concurrency 10

# Next batch older than what is already exported (anchored on recent manifest edge; date sense check; Gemini batch API)
npm run intercom:export:continue

# Inline Gemini (real-time, full price) instead of batch
npm run intercom:export -- --continue --limit 600 --concurrency 10

# Replace out-of-range exports and refill backward from a cutoff (prune + validate + export)
npm run intercom:refill-gap -- --before 2026-05-07T00:00:00.000Z --limit 803

# Export a custom ID list without searching
npm run intercom:export -- data/intercom/export-ids.json
```

The export script:

- Loads `INTERCOM_ACCESS_TOKEN` and `GEMINI_API_KEY` from `.env` or the shell environment
- **Skips known IDs** already listed in `manifest.jsonl` (no fetch, normalize, or summarize)
- For new IDs: fetches from `GET /conversations/{id}`, normalizes, summarizes, classifies topics with Gemini 2.5 Flash Lite, writes `conversations/{id}.json`, appends to `manifest.jsonl`
- Processes pending IDs in parallel (`--concurrency`, default 10); known manifest IDs are skipped so reruns resume where they left off
- **`--batch`** submits summarize + classify via the [Gemini Batch API](https://ai.google.dev/gemini-api/docs/batch-api) (50% cheaper, async — typically minutes, up to 24h). Intercom fetch stays parallel; Gemini runs as two batch jobs after all conversations are downloaded
- **`--continue`** uses the oldest `createdAt` among recent manifest entries (ignores ancient outliers), searches backward, runs a **date sense check** before fetch/summarize/classify, and aborts if the batch looks wrong (e.g. pre-2026 historical conversations)
- **`intercom:refill-gap`** prunes conversations before a cutoff, searches the gap below the remaining anchor, validates dates, then exports

Each stored record includes:

- `issueSummary` — one French sentence for the customer's initial need
- `topic`, `topicCategory`, `secondaryTopics` (0–2), `secondaryTopicCategories`, `topicConfidence`, `isSupportTicket` — Gemini classification (rule-based overrides for security incident, prospection, and marketing newsletters). Parent categories are derived automatically from subcategory labels.

Rule-based non-support mail (prospection, marketing newsletters, recruitment) skips both Gemini summarization and classification.

### Backfill summaries for existing exports

```bash
npm run intercom:summarize-backfill
```

Only fills conversations **missing** `issueSummary`. Uses the Gemini Batch API by default (50% cheaper). Pass `--inline` for real-time API. When the summarization prompt is updated, **do not** wipe existing summaries and rerun — that would re-call Gemini for every conversation. The updated prompt applies automatically to **new exports** only; already-summarized records keep their existing text unless you deliberately clear `issueSummary` on specific files.

### Backfill topic classification for existing exports

```bash
npm run intercom:classify-backfill
```

Only fills conversations **missing** `topic`, `topicConfidence`, or `isSupportTicket`. Uses Gemini Batch API by default; pass `--inline` for real-time. Requires `issueSummary` on each file needing Gemini classification. Security incident and obvious prospection/spam are classified by rules without calling Gemini.

### Backfill parent categories for existing exports

```bash
npm run intercom:backfill-topic-categories
```

Sets `topicCategory` and `secondaryTopicCategories` from existing `topic` / `secondaryTopics` (no Gemini). Run after taxonomy changes or when older exports lack parent categories.

## Normalize a single conversation

```bash
cat raw.json | npm run intercom:normalize
```

## Batch write from a raw JSON array

If you already have raw `get_conversation` responses (e.g. from MCP):

```bash
npm run intercom:write-batch -- /path/to/raw-conversations.json
```

## Verify

```bash
npm run test:intercom
```

Spot-check a few transcripts against Intercom UI. Confirm:

- No customer names or emails in output files
- Email records include `subject`
- Chat records include `aiTitle` when Fin tagged them
- Attachment-only emails show `[Attachment: ...]` lines

## Normalized record shape

See `scripts/intercom/types.ts` for the `StoredConversation` interface.

## Transform logic

Implemented in `scripts/intercom/`:

- `fetch-export.ts` — REST API search + export + summarize
- `summarize.ts` — Gemini issue summary generation
- `summarize-backfill.ts` — backfill `issueSummary` on existing files
- `topic-classify.ts` — Gemini topic classification (structured JSON)
- `topic-rules.ts` — rule-based overrides (security incident, prospection, marketing newsletters)
- `classify-backfill.ts` — backfill classification fields on existing files
- `normalize.ts` — main transform
- `classify.ts` — resolution and channel mapping
- `stripHtml.ts` — HTML to plain text
