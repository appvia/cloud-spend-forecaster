import { Puller, Interval } from '../module'

export function generate (pullers: Puller[], units: number): Interval[] {
  const data = []
  pullers.forEach((from: Puller, i: number) => {
    if (i + 1 == pullers.length) return
    const next: Puller = pullers[i + 1]

    const toCreate = (next.time - from.time) / units
    for (let i = 0; i < toCreate; i++) {
      const foo =
        ((next.requests - from.requests) / toCreate) * i + from.requests
      data.push({
        time: i * units + from.time,
        requests: Math.ceil(foo)
      })
    }
  })
  return data
}
