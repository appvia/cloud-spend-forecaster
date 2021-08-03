import * as mod from '../src/calculator'

describe('calculator', () => {
  it('calculateResourceNeededForRequestsInterval', () =>
    expect(
      mod.calculateResourceNeededForRequestsInterval({
        requests: 100,
        components: [{ requestToCpu: 3, requestToMemory: 4 }]
      })
    ).toMatchSnapshot())

  it('calculateReplicasNeededForInterval', () =>
    expect(
      mod.calculateReplicasNeededForInterval({
        requests: 100,
        components: [
          {
            needCpuForRequests: 30,
            limitCpu: 40,
            baselineCpu: 4,
            minReplica: 1,
            needMemoryForRequests: 20,
            limitMemory: 200,
            baselineMemory: 500
          }
        ]
      })
    ).toMatchSnapshot())

  it('calculateResourceNeededForInterval', () =>
    expect(
      mod.calculateResourceNeededForInterval({
        components: [
          {
            needReplica: 2,
            baselineCpu: 2,
            needCpuForRequests: 200,
            baselineMemory: 10,
            needMemoryForRequests: 15
          }
        ]
      })
    ).toMatchSnapshot())

  it('calculateNodesNeededForInterval', () =>
    expect(
      mod.calculateNodesNeededForInterval({
        needCpu: 10000,
        needMemory: 200000,
        needPods: 1000,
        nodes: {
          availableCpu: 100,
          availableMemory: 200,
          maxPods: 100
        }
      })
    ).toMatchSnapshot())

  it('calculateNodesDesiredForInterval', () =>
    expect(
      mod.calculateNodesDesiredForInterval({
        desiredCpu: 10000,
        desiredMemory: 200000,
        desiredPods: 1000,
        nodes: {
          availableCpu: 100,
          availableMemory: 200,
          maxPods: 100
        }
      })
    ).toMatchSnapshot())

  it('calculateDesiredResourceForInterval', () =>
    expect(
      mod.calculateDesiredResourceForInterval({
        components: [
          {
            minReplica: 2,
            maxReplica: 200,
            scalingThresholdCpu: 70,
            needCpuReplica: 10,
            limitCpu: 100,
            limitMemory: 200
          }
        ]
      })
    ).toMatchSnapshot())

  it('calculateReadyNodes', () => {
    const arr = [
      { desiredNodes: 10, nodes: { scalingIntervals: 3 } },
      { desiredNodes: 10, nodes: { scalingIntervals: 3 } },
      { desiredNodes: 10, nodes: { scalingIntervals: 3 } },
      { desiredNodes: 5, nodes: { scalingIntervals: 3 } },
      { desiredNodes: 10, nodes: { scalingIntervals: 3 } },
      { desiredNodes: 10, nodes: { scalingIntervals: 3 } },
      { desiredNodes: 10, nodes: { scalingIntervals: 3 } }
    ]
    return expect(arr.map(mod.calculateReadyNodes)).toMatchSnapshot()
  })

  it('calculatePendingPods', () => {
    const arr = [
      {
        components: [{ scalingIntervals: 2, desiredReplica: 3, minReplica: 1 }]
      },
      {
        components: [{ scalingIntervals: 2, desiredReplica: 3, minReplica: 1 }]
      },
      {
        components: [{ scalingIntervals: 2, desiredReplica: 3, minReplica: 1 }]
      },
      {
        components: [{ scalingIntervals: 2, desiredReplica: 3, minReplica: 1 }]
      },
      {
        components: [{ scalingIntervals: 2, desiredReplica: 3, minReplica: 1 }]
      },
      {
        components: [{ scalingIntervals: 2, desiredReplica: 10, minReplica: 1 }]
      },
      {
        components: [{ scalingIntervals: 2, desiredReplica: 4, minReplica: 1 }]
      },
      {
        components: [{ scalingIntervals: 2, desiredReplica: 3, minReplica: 1 }]
      },
      {
        components: [{ scalingIntervals: 2, desiredReplica: 3, minReplica: 1 }]
      }
    ]
    return expect(arr.map(mod.calculatePendingPods)).toMatchSnapshot()
  })

  test.each([
    {
      components: [{ readyReplica: 100 }],
      nodes: { maxPods: 10 },
      readyNodes: 2,
      testing: 'pods',
      expected: true
    },
    {
      components: [{ readyReplica: 20, limitCpu: 1000 }],
      nodes: { maxPods: 100, availableCpu: 1 },
      readyNodes: 1,
      testing: 'cpu',
      expected: true
    },
    {
      components: [{ readyReplica: 20, limitCpu: 1, limitMemory: 100 }],
      nodes: { maxPods: 100, availableCpu: 1000, availableMemory: 1 },
      readyNodes: 1,
      testing: 'memory',
      expected: true
    },
    {
      components: [{ readyReplica: 2, limitCpu: 1, limitMemory: 1 }],
      nodes: { maxPods: 100, availableCpu: 1000, availableMemory: 100 },
      readyNodes: 1,
      testing: 'ok',
      expected: false
    }
  ])(
    'calculateIfOverSubscribed, $testing',
    ({ components, nodes, readyNodes, testing, expected }) =>
      expect(mod.calculateIfOverSubscribed(components, nodes, readyNodes)).toBe(
        expected
      )
  )

  it.todo('calculatePenalties')
  it.todo('calculateReadyRequestCapacity')
  it.todo('calculateFailedRequests')
  it.todo('calculateReadyPods')
  it.todo('calcCapacity')
})
