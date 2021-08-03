import { Component, ComponentOutput, ComputeNode, Interval } from '../module'
import * as mod from '../src/calculator'

const makeComponent = (myComponent: Object): ComponentOutput => {
  return {
    name: 'foo',
    requestToCpu: 0,
    requestToMemory: 0,
    baselineCpu: 0,
    baselineMemory: 0,
    limitMemory: 0,
    limitCpu: 0,
    minReplica: 0,
    maxReplica: 0,
    scalingThresholdCpu: 0,
    scalingIntervals: 0,
    ...myComponent,
  }
}

const makeNode = (myNode: Object): ComputeNode => {
  return {
    maxPods: 0,
    availableCpu: 0,
    availableMemory: 0,
    cost: 0,
    scalingIntervals: 0,
    maxNodes: 0,
    minNodes: 0,
    ...myNode,
  }
}

const makeInterval = (myInterval: Object): Interval => {
  return { time: 1, requests: 1, ...myInterval }
}

describe('calculator', () => {
  it('calculateResourceNeededForRequestsInterval', () =>
    expect(
      mod.calculateResourceNeededForRequestsInterval(
        makeInterval({
          requests: 100,
          components: [makeComponent({ requestToCpu: 3, requestToMemory: 4 })],
        }),
      ),
    ).toMatchSnapshot())

  it('calculateReplicasNeededForInterval', () =>
    expect(
      mod.calculateReplicasNeededForInterval(
        makeInterval({
          components: [
            makeComponent({
              needCpuForRequests: 30,
              limitCpu: 40,
              baselineCpu: 4,
              minReplica: 1,
              needMemoryForRequests: 20,
              limitMemory: 200,
              baselineMemory: 500,
            }),
          ],
        }),
      ),
    ).toMatchSnapshot())

  it('calculateResourceNeededForInterval', () =>
    expect(
      mod.calculateResourceNeededForInterval(
        makeInterval({
          components: [
            makeComponent({
              needReplica: 2,
              baselineCpu: 2,
              needCpuForRequests: 200,
              baselineMemory: 10,
              needMemoryForRequests: 15,
            }),
          ],
        }),
      ),
    ).toMatchSnapshot())

  it('calculateNodesNeededForInterval', () =>
    expect(
      mod.calculateNodesNeededForInterval(
        makeInterval({
          needCpu: 10000,
          needMemory: 200000,
          needPods: 1000,
          nodes: {
            availableCpu: 100,
            availableMemory: 200,
            maxPods: 100,
          },
        }),
      ),
    ).toMatchSnapshot())

  it('calculateNodesDesiredForInterval', () =>
    expect(
      mod.calculateNodesDesiredForInterval(
        makeInterval({
          desiredCpu: 10000,
          desiredMemory: 200000,
          desiredPods: 1000,
          nodes: makeNode({
            availableCpu: 100,
            availableMemory: 200,
            maxPods: 100,
            minNodes: 30,
            maxNodes: 1000,
          }),
        }),
      ),
    ).toMatchSnapshot())

  it('calculateDesiredResourceForInterval', () =>
    expect(
      mod.calculateDesiredResourceForInterval(
        makeInterval({
          components: [
            makeComponent({
              minReplica: 2,
              maxReplica: 200,
              scalingThresholdCpu: 70,
              needCpuReplica: 10,
              limitCpu: 100,
              limitMemory: 200,
            }),
          ],
        }),
      ),
    ).toMatchSnapshot())

  it('calculateReadyNodes', () => {
    const arr = [
      { desiredNodes: 10, nodes: { scalingIntervals: 3 } },
      { desiredNodes: 10, nodes: { scalingIntervals: 3 } },
      { desiredNodes: 10, nodes: { scalingIntervals: 3 } },
      { desiredNodes: 5, nodes: { scalingIntervals: 3 } },
      { desiredNodes: 10, nodes: { scalingIntervals: 3 } },
      { desiredNodes: 10, nodes: { scalingIntervals: 3 } },
      { desiredNodes: 10, nodes: { scalingIntervals: 3 } },
    ]
    return expect(arr.map(makeInterval).map(mod.calculateReadyNodes)).toMatchSnapshot()
  })

  it('calculatePendingPods', () => {
    const arr = [
      {
        components: [{ scalingIntervals: 2, desiredReplica: 3, minReplica: 1 }],
      },
      {
        components: [{ scalingIntervals: 2, desiredReplica: 3, minReplica: 1 }],
      },
      {
        components: [{ scalingIntervals: 2, desiredReplica: 3, minReplica: 1 }],
      },
      {
        components: [{ scalingIntervals: 2, desiredReplica: 3, minReplica: 1 }],
      },
      {
        components: [{ scalingIntervals: 2, desiredReplica: 3, minReplica: 1 }],
      },
      {
        components: [{ scalingIntervals: 2, desiredReplica: 10, minReplica: 1 }],
      },
      {
        components: [{ scalingIntervals: 2, desiredReplica: 4, minReplica: 1 }],
      },
      {
        components: [{ scalingIntervals: 2, desiredReplica: 3, minReplica: 1 }],
      },
      {
        components: [{ scalingIntervals: 2, desiredReplica: 3, minReplica: 1 }],
      },
    ]
    return expect(arr.map(makeInterval).map(mod.calculatePendingPods)).toMatchSnapshot()
  })

  test.each([
    {
      components: [{ readyReplica: 100, limitCpu: 1000, limitMemory: 1 }],
      nodes: { maxPods: 10 },
      readyNodes: 2,
      testing: 'pods',
      expected: true,
    },
    {
      components: [{ readyReplica: 20, limitCpu: 1000, limitMemory: 1 }],
      nodes: { maxPods: 100, availableCpu: 1 },
      readyNodes: 1,
      testing: 'cpu',
      expected: true,
    },
    {
      components: [{ readyReplica: 20, limitCpu: 1, limitMemory: 100 }],
      nodes: { maxPods: 100, availableCpu: 1000, availableMemory: 1 },
      readyNodes: 1,
      testing: 'memory',
      expected: true,
    },
    {
      components: [{ readyReplica: 2, limitCpu: 1, limitMemory: 1 }],
      nodes: { maxPods: 100, availableCpu: 1000, availableMemory: 100 },
      readyNodes: 1,
      testing: 'ok',
      expected: false,
    },
  ])('calculateIfOverSubscribed, $testing', ({ components, nodes, readyNodes, testing, expected }) =>
    expect(mod.calculateIfOverSubscribed(components.map(makeComponent), makeNode(nodes), readyNodes)).toBe(expected),
  )

  it.todo('calculatePenalties')
  it.todo('calculateReadyRequestCapacity')
  it.todo('calculateFailedRequests')
  it.todo('calculateReadyPods')
  it.todo('calcCapacity')
  it.todo('putNodesIntoIntervals')
  it.todo('putComponentsIntoIntervals')
})
