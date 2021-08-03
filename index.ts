import { generate } from './src/generate_request_data'
import * as calc from './src/calculator'
import { Component, ComputeNode, Puller, Interval } from './module'

export function calculate(
  pullers: Puller[],
  units: number,
  components: Component[],
  node: ComputeNode,
  failedRequestPenalty: number,
): Interval[] {
  return generate(pullers, units)
    .map(calc.putComponentsIntoIntervals(components))
    .map(calc.putNodesIntoIntervals(node))
    .map(calc.calculateResourceNeededForRequestsInterval)
    .map(calc.calculateReplicasNeededForInterval)
    .map(calc.calculateResourceNeededForInterval)
    .map(calc.calculateDesiredResourceForInterval)
    .map(calc.calculateNodesNeededForInterval)
    .map(calc.calculateNodesDesiredForInterval)
    .map(calc.calculateReadyNodes)
    .map(calc.calculatePendingPods)
    .map(calc.calculateReadyPods)
    .map(calc.calculateReadyRequestCapacity)
    .map(calc.calculateFailedRequests)
    .map(calc.calculateCosts)
    .map(calc.calculatePenalties(failedRequestPenalty))
}
