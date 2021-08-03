import { components } from '../components'
import { _ } from 'lodash'
import { node } from '../play'
import { failedRequestPenalty } from '../scenario'

export function putComponentsIntoIntervals (interval) {
  return { ...interval, components }
}

export function putNodesIntoIntervals (interval) {
  return { ...interval, nodes: node }
}

export function calculateResourceNeededForRequestsInterval (interval) {
  const intervalComponents = interval.components.map(component => {
    return {
      ...component,
      needCpuForRequests: interval.requests * component.requestToCpu,
      needMemoryForRequests: interval.requests * component.requestToMemory
    }
  })
  return {
    ...interval,
    components: intervalComponents
  }
}

export function calculateReplicasNeededForInterval (interval) {
  const intervalComponents = interval.components.map(component => {
    const needCpuReplica = Math.ceil(
      component.needCpuForRequests /
        (component.limitCpu - component.baselineCpu)
    )
    const needMemoryReplica = Math.ceil(
      component.needMemoryForRequests /
        (component.limitMemory - component.baselineMemory)
    )

    return {
      ...component,
      needCpuReplica,
      needMemoryReplica,
      needReplica: Math.max(
        needMemoryReplica,
        needCpuReplica,
        component.minReplica
      )
    }
  })
  return {
    ...interval,
    components: intervalComponents,
    needPods: intervalComponents.reduce(
      (accumulator, component) => accumulator + component.needReplica,
      0
    )
  }
}

export function calculateResourceNeededForInterval (interval) {
  const intervalComponents = interval.components.map(component => {
    return {
      ...component,
      needCpu:
        component.needReplica * component.baselineCpu +
        component.needCpuForRequests,
      needMemory:
        component.needReplica * component.baselineMemory +
        component.needMemoryForRequests
    }
  })
  return {
    ...interval,
    components: intervalComponents,
    needCpu: intervalComponents.reduce(
      (accumulator, component) => accumulator + component.needCpu,
      0
    ),
    needMemory: intervalComponents.reduce(
      (accumulator, component) => accumulator + component.needMemory,
      0
    )
  }
}

export function calculateNodesNeededForInterval (interval) {
  const needNodesByCpu = Math.ceil(
    interval.needCpu / interval.nodes.availableCpu
  )
  const needNodesByMemory = Math.ceil(
    interval.needMemory / interval.nodes.availableMemory
  )
  const needNodesByPods = Math.ceil(interval.needPods / interval.nodes.maxPods)

  return { ...interval, needNodesByCpu, needNodesByMemory, needNodesByPods }
}

export function calcCapacity (replica, limit, to_request, baseline) {
  return Math.floor(replica * (limit * to_request - baseline))
}

export function withinRange (min, max, number) {
  return Math.ceil(Math.max(min, Math.min(max, number)))
}

export function calculateDesiredResourceForInterval (interval) {
  const intervalComponents = interval.components.map((component, cid) => {
    const desiredReplica = withinRange(
      component.minReplica,
      component.maxReplica,
      (100 / component.scalingThresholdCpu) * component.needCpuReplica
    )
    const desiredCpu = desiredReplica * component.limitCpu
    const desiredMemory = desiredReplica * component.limitMemory
    return {
      ...component,
      desiredReplica,
      desiredCpu,
      desiredMemory
    }
  })
  return {
    ...interval,
    components: intervalComponents,
    desiredPods: intervalComponents.reduce(
      (accumulator, component) => accumulator + component.desiredReplica,
      0
    ),
    desiredCpu: intervalComponents.reduce(
      (accumulator, component) => accumulator + component.desiredCpu,
      0
    ),
    desiredMemory: intervalComponents.reduce(
      (accumulator, component) => accumulator + component.desiredMemory,
      0
    )
  }
}

export function calculateNodesDesiredForInterval (interval) {
  const desiredNodesByCpu = Math.ceil(
    interval.desiredCpu / interval.nodes.availableCpu
  )
  const desiredNodesByMemory = Math.ceil(
    interval.desiredMemory / interval.nodes.availableMemory
  )
  const desiredNodesByPods = Math.ceil(
    interval.desiredPods / interval.nodes.maxPods
  )

  return {
    ...interval,
    desiredNodesByCpu,
    desiredNodesByMemory,
    desiredNodesByPods,
    desiredNodes: withinRange(
      node.minNodes,
      node.maxNodes,
      Math.max(desiredNodesByCpu, desiredNodesByMemory, desiredNodesByPods)
    )
  }
}

export function calculateReadyNodes (interval, index, intervals) {
  return {
    ...interval,
    readyNodes:
      index > interval.nodes.scalingIntervals
        ? intervals[index + 1 - interval.nodes.scalingIntervals].desiredNodes
        : interval.nodes.minNodes
  }
}

export function calculatePendingPods (interval, index, intervals) {
  const intervalComponents = interval.components.map((component, cid) => {
    let pendingReplica = component.minReplica

    if (index + 1 - component.scalingIntervals > 0) {
      pendingReplica =
        intervals[index + 1 - component.scalingIntervals].components[cid]
          .desiredReplica
    }

    return {
      ...component,
      pendingReplica
    }
  })

  return { ...interval, components: intervalComponents }
}

export function calculateReadyPods (interval) {
  const intervalComponents = interval.components.map((component, cid) => {
    let readyReplica = component.pendingReplica
    return {
      ...component,
      readyReplica
    }
  })

  let cid = 0
  do {
    // let cid = _.random(0, intervalComponents.length - 1)
    intervalComponents[cid].readyReplica = Math.max(
      intervalComponents[cid].readyReplica - 1,
      intervalComponents[cid].minReplica
    )
    cid = cid === intervalComponents.length - 1 ? 0 : cid + 1
  } while (
    calculateIfOverSubscribed(
      intervalComponents,
      interval.nodes,
      interval.readyNodes
    )
  )

  return { ...interval, components: intervalComponents }
}

export function calculateIfOverSubscribed (
  components,
  nodes,
  readyNodes
): boolean {
  const pendingPodCount = components.reduce(
    (accumulator, component) => accumulator + component.readyReplica,
    0
  )
  if (pendingPodCount > readyNodes * nodes.maxPods) {
    return true
  }
  const pendingCpu = components.reduce(
    (accumulator, component) =>
      accumulator + component.readyReplica * component.limitCpu,
    0
  )

  if (pendingCpu > readyNodes * nodes.availableCpu) {
    return true
  }

  const pendingMemory = components.reduce(
    (accumulator, component) =>
      accumulator + component.readyReplica * components.limitMemory,
    0
  )
  if (pendingCpu > readyNodes * nodes.availableMemory) {
    return true
  }

  return false
}

export function calculateCosts (interval) {
  return { ...interval, cost: interval.desiredNodes * interval.nodes.cost }
}

export function calculatePenalties (interval) {
  return {
    ...interval,
    failedRequestPenalty: interval.failedRequests * failedRequestPenalty
  }
}

export function calculateReadyRequestCapacity (interval) {
  const intervalComponents = interval.components.map(component => {
    const cpuCapacity =
      (component.readyReplica * (component.limitCpu - component.baselineCpu)) /
      component.requestToCpu

    const memoryCapacity =
      (component.readyReplica *
        (component.limitMemory - component.baselineMemory)) /
      component.requestToMemory

    const readyRequestCapacity = Math.min(cpuCapacity, memoryCapacity)
    return { ...component, readyRequestCapacity }
  })
  return {
    ...interval,
    components: intervalComponents,
    readyRequestCapacity: Math.min(
      ...intervalComponents.map(component => component.readyRequestCapacity)
    )
  }
}

export function calculateFailedRequests (interval) {
  const intervalComponents = interval.components.map(component => {
    return {
      ...component,
      failedRequests: Math.max(
        0,
        interval.requests - component.readyRequestCapacity
      )
    }
  })
  return {
    ...interval,
    components: intervalComponents,
    failedRequests: Math.max.apply(
      null,
      intervalComponents.map(component => component.failedRequests)
    )
  }
}
