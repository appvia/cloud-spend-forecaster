import { Component, ComponentOutput, ComputeNode, Interval } from '../module'

export function putComponentsIntoIntervals(components: Component[]) {
  return (interval: Interval): Interval => {
    return { ...interval, components }
  }
}

export function putNodesIntoIntervals(node: ComputeNode) {
  return (interval: Interval): Interval => {
    return { ...interval, nodes: node }
  }
}

export function calculateResourceNeededForRequestsInterval(interval: Interval): Interval {
  const intervalComponents = interval.components.map((component: ComponentOutput): ComponentOutput => {
    return {
      ...component,
      needCpuForRequests: interval.requests * component.requestToCpu,
      needMemoryForRequests: interval.requests * component.requestToMemory,
    }
  })
  return {
    ...interval,
    components: intervalComponents,
  }
}

export function calculateReplicasNeededForInterval(interval: Interval): Interval {
  const intervalComponents = interval.components.map((component: ComponentOutput): ComponentOutput => {
    const needCpuReplica = Math.ceil(component.needCpuForRequests / (component.limitCpu - component.baselineCpu))
    const needMemoryReplica = Math.ceil(
      component.needMemoryForRequests / (component.limitMemory - component.baselineMemory),
    )

    return {
      ...component,
      needCpuReplica,
      needMemoryReplica,
      needReplica: Math.max(needMemoryReplica, needCpuReplica, component.minReplica),
    }
  })
  return {
    ...interval,
    components: intervalComponents,
    needPods: intervalComponents.reduce((accumulator, component) => accumulator + component.needReplica, 0),
  }
}

export function calculateResourceNeededForInterval(interval: Interval): Interval {
  const intervalComponents = interval.components.map((component: ComponentOutput): ComponentOutput => {
    return {
      ...component,
      needCpu: component.needReplica * component.baselineCpu + component.needCpuForRequests,
      needMemory: component.needReplica * component.baselineMemory + component.needMemoryForRequests,
    }
  })
  return {
    ...interval,
    components: intervalComponents,
    needCpu: intervalComponents.reduce((accumulator, component) => accumulator + component.needCpu, 0),
    needMemory: intervalComponents.reduce((accumulator, component) => accumulator + component.needMemory, 0),
  }
}

export function calculateNodesNeededForInterval(interval: Interval): Interval {
  const needNodesByCpu = Math.ceil(interval.needCpu / interval.nodes.availableCpu)
  const needNodesByMemory = Math.ceil(interval.needMemory / interval.nodes.availableMemory)
  const needNodesByPods = Math.ceil(interval.needPods / interval.nodes.maxPods)

  return { ...interval, needNodesByCpu, needNodesByMemory, needNodesByPods }
}

export function calcCapacity(replica: number, limit: number, to_request: number, baseline: number): number {
  return Math.floor(replica * (limit * to_request - baseline))
}

export function withinRange(min: number, max: number, number: number): number {
  return Math.ceil(Math.max(min, Math.min(max, number)))
}

export function calculateDesiredResourceForInterval(interval: Interval): Interval {
  const intervalComponents = interval.components.map((component: ComponentOutput): ComponentOutput => {
    const desiredReplica = withinRange(
      component.minReplica,
      component.maxReplica,
      (100 / component.scalingThresholdCpu) * component.needCpuReplica,
    )
    const desiredCpu = desiredReplica * component.limitCpu
    const desiredMemory = desiredReplica * component.limitMemory
    return {
      ...component,
      desiredReplica,
      desiredCpu,
      desiredMemory,
    }
  })
  return {
    ...interval,
    components: intervalComponents,
    desiredPods: intervalComponents.reduce(
      (accumulator: number, component: ComponentOutput): number => accumulator + component.desiredReplica,
      0,
    ),
    desiredCpu: intervalComponents.reduce(
      (accumulator: number, component: ComponentOutput): number => accumulator + component.desiredCpu,
      0,
    ),
    desiredMemory: intervalComponents.reduce(
      (accumulator: number, component: ComponentOutput): number => accumulator + component.desiredMemory,
      0,
    ),
  }
}

export function calculateNodesDesiredForInterval(interval: Interval): Interval {
  const desiredNodesByCpu = Math.ceil(interval.desiredCpu / interval.nodes.availableCpu)
  const desiredNodesByMemory = Math.ceil(interval.desiredMemory / interval.nodes.availableMemory)
  const desiredNodesByPods = Math.ceil(interval.desiredPods / interval.nodes.maxPods)

  return {
    ...interval,
    desiredNodesByCpu,
    desiredNodesByMemory,
    desiredNodesByPods,
    desiredNodes: withinRange(
      interval.nodes.minNodes,
      interval.nodes.maxNodes,
      Math.max(desiredNodesByCpu, desiredNodesByMemory, desiredNodesByPods),
    ),
  }
}

export function calculateReadyNodes(interval: Interval, index: number, intervals: Interval[]): Interval {
  return {
    ...interval,
    readyNodes:
      index > interval.nodes.scalingIntervals
        ? intervals[index + 1 - interval.nodes.scalingIntervals].desiredNodes
        : interval.nodes.minNodes,
  }
}

export function calculatePendingPods(interval: Interval, index: number, intervals: Interval[]): Interval {
  const intervalComponents = interval.components.map((component: ComponentOutput, cid: number) => {
    let pendingReplica = component.minReplica

    if (index + 1 - component.scalingIntervals > 0) {
      pendingReplica = intervals[index + 1 - component.scalingIntervals].components[cid].desiredReplica
    }

    return {
      ...component,
      pendingReplica,
    }
  })

  return { ...interval, components: intervalComponents }
}

export function calculateReadyPods(interval: Interval): Interval {
  const intervalComponents = interval.components.map((component: ComponentOutput): ComponentOutput => {
    const readyReplica = component.pendingReplica
    return {
      ...component,
      readyReplica,
    }
  })

  let cid = 0
  do {
    intervalComponents[cid].readyReplica = Math.max(
      intervalComponents[cid].readyReplica - 1,
      intervalComponents[cid].minReplica,
    )
    cid = cid === intervalComponents.length - 1 ? 0 : cid + 1
  } while (calculateIfOverSubscribed(intervalComponents, interval.nodes, interval.readyNodes))

  return { ...interval, components: intervalComponents }
}

export function calculateIfOverSubscribed(
  components: ComponentOutput[],
  nodes: ComputeNode,
  readyNodes: number,
): boolean {
  const pendingPodCount = components.reduce(
    (accumulator: number, component: ComponentOutput): number => accumulator + component.readyReplica,
    0,
  )
  if (pendingPodCount > readyNodes * nodes.maxPods) {
    return true
  }
  const pendingCpu = components.reduce(
    (accumulator: number, component: ComponentOutput): number =>
      accumulator + component.readyReplica * component.limitCpu,
    0,
  )

  if (pendingCpu > readyNodes * nodes.availableCpu) {
    return true
  }

  const pendingMemory = components.reduce(
    (accumulator: number, component: ComponentOutput): number =>
      accumulator + component.readyReplica * component.limitMemory,
    0,
  )
  if (pendingMemory > readyNodes * nodes.availableMemory) {
    return true
  }

  return false
}

export function calculateCosts(interval: Interval): Interval {
  return { ...interval, cost: interval.desiredNodes * interval.nodes.cost }
}

export function calculatePenalties(failedRequestPenalty: number) {
  return (interval: Interval): Interval => {
    return {
      ...interval,
      failedRequestPenalty: interval.failedRequests * failedRequestPenalty,
    }
  }
}

export function calculateReadyRequestCapacity(interval: Interval): Interval {
  const intervalComponents = interval.components.map((component) => {
    const cpuCapacity = (component.readyReplica * (component.limitCpu - component.baselineCpu)) / component.requestToCpu

    const memoryCapacity =
      (component.readyReplica * (component.limitMemory - component.baselineMemory)) / component.requestToMemory

    const readyRequestCapacity = Math.floor(Math.min(cpuCapacity, memoryCapacity))
    return { ...component, readyRequestCapacity }
  })
  return {
    ...interval,
    components: intervalComponents,
    readyRequestCapacity: Math.min(...intervalComponents.map((component) => component.readyRequestCapacity)),
  }
}

export function calculateFailedRequests(interval: Interval): Interval {
  const intervalComponents = interval.components.map((component) => {
    return {
      ...component,
      failedRequests: Math.ceil(Math.max(0, interval.requests - component.readyRequestCapacity)),
    }
  })
  return {
    ...interval,
    components: intervalComponents,
    failedRequests: Math.max.apply(
      null,
      intervalComponents.map((component) => component.failedRequests),
    ),
  }
}
