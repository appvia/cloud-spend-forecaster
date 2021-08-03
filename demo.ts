import { calculate } from './'
import * as fs from 'fs'

export const units = 1 * 60 * 1000 // 1 minute in milliseconds

export const pullers = [
  { time: Date.parse('01 Jan 2021 00:00:00 GMT'), requests: 500 },
  { time: Date.parse('02 Jan 2021 00:00:00 GMT'), requests: 100 },
  { time: Date.parse('02 Jan 2021 13:00:00 GMT'), requests: 25000 },
  { time: Date.parse('03 Jan 2021 00:00:00 GMT'), requests: 250 },
  { time: Date.parse('05 Jan 2021 00:00:00 GMT'), requests: 150 },
  { time: Date.parse('05 Jan 2021 03:00:00 GMT'), requests: 25000 },
  { time: Date.parse('06 Jan 2021 00:00:00 GMT'), requests: 1500 },
  { time: Date.parse('06 Jan 2021 23:59:00 GMT'), requests: 500 },
]
export const failedRequestPenalty = 0.02

export const node = {
  // m5.8xlarge
  maxPods: 234,
  availableCpu: 31750,
  availableMemory: 124971,
  cost: 1.536 / 60,
  scalingIntervals: 5,
  maxNodes: 1000,
  minNodes: 30,
}

const components = [
  {
    name: 'backend',
    requestToCpu: 10,
    requestToMemory: 43,
    baselineCpu: 110,
    baselineMemory: 700,
    limitMemory: 1024,
    limitCpu: 900,
    minReplica: 5,
    maxReplica: 1000,
    scalingThresholdCpu: 75,
    scalingIntervals: 2,
  },
  {
    name: 'frontend',
    requestToCpu: 5,
    requestToMemory: 0.2,
    baselineCpu: 38,
    baselineMemory: 48,
    limitMemory: 512,
    limitCpu: 800,
    minReplica: 50,
    maxReplica: 2000,
    scalingThresholdCpu: 99,
    scalingIntervals: 2,
  },
  {
    name: 'database',
    requestToCpu: 32,
    requestToMemory: 1.5,
    baselineCpu: 2500,
    baselineMemory: 2048,
    limitMemory: 4096,
    limitCpu: 15000,
    minReplica: 8,
    maxReplica: 50,
    scalingThresholdCpu: 25,
    scalingIntervals: 120,
  },
]

const output = calculate(pullers, units, components, node, failedRequestPenalty)

console.log(output[100])

fs.writeFileSync('./output.json', JSON.stringify(output))

console.log(
  `totalCost: ${output.reduce((accumulator, interval) => (accumulator = accumulator + (interval.cost || 0)), 0)}`,
  `totalFailedRequests: ${output.reduce(
    (accumulator, interval) => (accumulator = accumulator + interval.failedRequests),
    0,
  )}`,
  `totalFailedRequestPenalties: ${output.reduce(
    (accumulator, interval) => (accumulator = accumulator + interval.failedRequestPenalty),
    0,
  )}`,
)
