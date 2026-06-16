import { describe, expect, it } from 'vitest'
import { runWithConcurrency } from './concurrency.ts'

describe('runWithConcurrency', () => {
  it('runs all items with bounded parallelism', async () => {
    const order: number[] = []
    let inFlight = 0
    let maxInFlight = 0

    await runWithConcurrency([1, 2, 3, 4, 5, 6], 2, async (item) => {
      inFlight += 1
      maxInFlight = Math.max(maxInFlight, inFlight)
      await new Promise((resolve) => setTimeout(resolve, 10))
      order.push(item)
      inFlight -= 1
    })

    expect(order.sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6])
    expect(maxInFlight).toBeLessThanOrEqual(2)
    expect(maxInFlight).toBeGreaterThan(1)
  })
})
