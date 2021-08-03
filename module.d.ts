export interface ComputeNode {
  maxPods: number
  availableCpu: number
  availableMemory: number
  cost: number
  scalingIntervals: number
  maxNodes: number
  minNodes: number
}

export interface Component {
  name: string
  requestToCpu: number
  requestToMemory: number
  baselineCpu: number
  baselineMemory: number
  limitMemory: number
  limitCpu: number
  minReplica: number
  maxReplica: number
  scalingThresholdCpu: number
  scalingIntervals: number
}

export interface Puller {
  time: number
  requests: number
}

export interface ComponentOutput extends Component {
  needCpuForRequests?: number
  needMemoryForRequests?: number
  needCpuReplica?: number
  needMemoryReplica?: number
  needReplica?: number
  needCpu?: number
  needMemory?: number
  desiredReplica?: number
  desiredCpu?: number
  desiredMemory?: number
  pendingReplica?: number
  readyReplica?: number
  readyRequestCapacity?: number
  failedRequests?: number
}

export interface Interval extends Puller {
  components?: ComponentOutput[]
  nodes?: ComputeNode
  needPods?: number
  needCpu?: number
  needMemory?: number
  desiredPods?: number
  desiredCpu?: number
  desiredMemory?: number
  needNodesByCpu?: number
  needNodesByMemory?: number
  needNodesByPods?: number
  desiredNodesByCpu?: number
  desiredNodesByMemory?: number
  desiredNodesByPods?: number
  desiredNodes?: number
  readyNodes?: number
  readyRequestCapacity?: number
  failedRequests?: number
  cost?: number
  failedRequestPenalty?: number
}
