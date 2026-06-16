import { describe, expect, it } from 'vitest'
import { extractGenerateContentText } from './gemini-batch.ts'

describe('extractGenerateContentText', () => {
  it('reads text from a generateContent response shape', () => {
    const text = extractGenerateContentText({
      candidates: [{ content: { parts: [{ text: '  Bonjour  ' }] } }],
    })

    expect(text).toBe('Bonjour')
  })

  it('returns null when no candidate text exists', () => {
    expect(extractGenerateContentText({ candidates: [] })).toBeNull()
  })
})

describe('collectBatchResults', () => {
  it('reads nested metadata.output.inlinedResponses.inlinedResponses', async () => {
    const { collectBatchResults } = await import('./gemini-batch.ts')
    const { results } = await collectBatchResults(
      {
        name: 'batches/test',
        state: 'BATCH_STATE_SUCCEEDED',
        dest: {
          inlinedResponses: [
            {
              metadata: { key: 'abc::summarize' },
              response: {
                candidates: [{ content: { parts: [{ text: 'Résumé test' }] } }],
                usageMetadata: {
                  promptTokenCount: 900,
                  candidatesTokenCount: 25,
                  totalTokenCount: 925,
                },
              },
            },
          ],
        },
      },
      'fake-key',
    )

    expect(results.get('abc::summarize')?.text).toBe('Résumé test')
    expect(results.get('abc::summarize')?.usage).toEqual({
      promptTokenCount: 900,
      candidatesTokenCount: 25,
      totalTokenCount: 925,
    })
  })

  it('aggregates usage totals across inline responses', async () => {
    const { collectBatchResults } = await import('./gemini-batch.ts')
    const { results, usage } = await collectBatchResults(
      {
        name: 'batches/test',
        state: 'BATCH_STATE_SUCCEEDED',
        dest: {
          inlinedResponses: [
            {
              metadata: { key: 'a::summarize' },
              response: {
                candidates: [{ content: { parts: [{ text: 'One' }] } }],
                usageMetadata: {
                  promptTokenCount: 100,
                  candidatesTokenCount: 10,
                  totalTokenCount: 110,
                },
              },
            },
            {
              metadata: { key: 'b::summarize' },
              response: {
                candidates: [{ content: { parts: [{ text: 'Two' }] } }],
                usageMetadata: {
                  promptTokenCount: 200,
                  candidatesTokenCount: 20,
                  totalTokenCount: 220,
                },
              },
            },
          ],
        },
      },
      'fake-key',
    )

    expect(results.size).toBe(2)
    expect(usage.promptTokenCount).toBe(300)
    expect(usage.candidatesTokenCount).toBe(30)
    expect(usage.totalTokenCount).toBe(330)
    expect(usage.responseCount).toBe(2)
  })
})

describe('batch job states', () => {
  it('recognizes BATCH_STATE_* and JOB_STATE_* terminal success', async () => {
    const { isSuccessfulBatchState } = await import('./gemini-batch.ts')
    expect(isSuccessfulBatchState('BATCH_STATE_SUCCEEDED')).toBe(true)
    expect(isSuccessfulBatchState('JOB_STATE_SUCCEEDED')).toBe(true)
    expect(isSuccessfulBatchState('BATCH_STATE_RUNNING')).toBe(false)
  })
})

