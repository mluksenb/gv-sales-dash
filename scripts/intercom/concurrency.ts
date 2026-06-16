/** Run async work over items with a bounded worker pool. */
export async function runWithConcurrency<T>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<void>,
): Promise<void> {
  if (items.length === 0) return

  let nextIndex = 0
  const workerCount = Math.min(concurrency, items.length)

  async function worker(): Promise<void> {
    while (true) {
      const index = nextIndex++
      if (index >= items.length) return
      await fn(items[index])
    }
  }

  await Promise.all(Array.from({ length: workerCount }, () => worker()))
}
