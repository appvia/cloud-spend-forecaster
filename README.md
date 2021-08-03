# Cloud Spend Forecaster

[![Known Vulnerabilities](https://snyk.io/test/github/appvia/cloud-spend-forecaster/badge.svg)](https://snyk.io/test/github/appvia/cloud-spend-forecaster)
[![GitHub license](https://img.shields.io/github/license/appvia/cloud-spend-forecaster)](https://github.com/appvia/cloud-spend-forecaster/blob/main/LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/appvia/cloud-spend-forecaster)](https://github.com/appvia/cloud-spend-forecaster/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/appvia/cloud-spend-forecaster)](https://github.com/appvia/cloud-spend-forecaster/network)
[![GitHub issues](https://img.shields.io/github/issues/appvia/cloud-spend-forecaster)](https://github.com/appvia/cloud-spend-forecaster/issues)
[![ci](https://github.com/appvia/cloud-spend-forecaster/actions/workflows/ci.yml/badge.svg)](https://github.com/appvia/cloud-spend-forecaster/actions/workflows/ci.yml)

This app allows you to handle complex modelling and forecast various scenarios against your cloud application.

Everything is defined in terms of the amount of resource required to service a single request, in addition to a baseline for that component.

It also allows you to describe a penality for failed requests like what you might be used to with an SLA

See the [demo.ts](./demo.ts) for a complete example of a simple three tier (frontend, app, database) application.

You can model all of your application tiers, you could even have this read from Kubernetes manifests if you like.

It assumes you've got an accurate performance benchmark on what your applications can perform, and assumes that things scale linearly.

## Usage

### Pullers

These are the the key events in a timeline, it is an array of timestamps to the requests a second.

```js
const pullers = [
  {
    time: 1234, // unix timestamp
    requests: 500 // number of requests a second
  },
  ...
]
```

### Units

The units of time to calculate in, minutes probably makes sense for most use cases

```js
const units = 60000
```

### Components

These are tiers of your application
| Name | Definition |
| --- | --- |
| name | Friendly name of the component e.g. `frontend`, `backend`, `database`, `cache`, `searchindex` |
| requestToCPU | Number of milicores required to handle a single request |
| requestToMemory | Number of mb of memory required to handle a single request |
| baselineCpu | Baseline milicores required for the application to run, standing still, before any requests are added |
| baselineMemory | Baseline mb of memory required for the application to run, standing still, before any requests are added |
| limitMemory | Limit of memory in mb |
| limitCpu | Limit of the CPU milicores |
| minReplica | Minimum replica count configured in the Horizontal Pod Autoscaler |
| maxReplica | Maximum replica count configured in the Horizontal Pod Autoscaler |
| scalingThresholdCpu | Percentage of CPU configured in the Horizontal Pod Autoscaler |
| scalingIntervals | Number of units required for the component to be ready for requests |

```js
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
    scalingIntervals: 2
  }
  ...
]
```

### Node

Parameters for the Node type you've selected to use

| Name             | Definition                                                                           |
| ---------------- | ------------------------------------------------------------------------------------ |
| maxPods          | Maximum number of pods that can run                                                  |
| availableCpu     | Number of milicores available to use                                                 |
| availableMemory  | Number mb of memory available to use                                                 |
| cost             | Cost per unit of time                                                                |
| scalingIntervals | Number of units required for the node to be available and ready to schedule workload |
| maxNodes         | 1000                                                                                 |
| minNodes         | 30                                                                                   |

```js
const node = {
  // m5.8xlarge
  maxPods: 234,
  availableCpu: 31750,
  availableMemory: 124971,
  cost: 1.536 / 60,
  scalingIntervals: 5,
  maxNodes: 1000,
  minNodes: 30
}
```

### Failed Request Penalty

The penalty to apply per request that fails, useful to consider your cost saving aspirations against the effective business cost of failing a request.

```js
const failedRequestPenalty = 0.02
```

### RUN!

```js
const output = calculate(pullers, units, components, node, failedRequestPenalty)
```

### Example output

```js
;[
  {
    time: 1609465200000,
    requests: 473,
    components: [
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
        needCpuForRequests: 4730,
        needMemoryForRequests: 20339,
        needCpuReplica: 6,
        needMemoryReplica: 63,
        needReplica: 63,
        needCpu: 11660,
        needMemory: 64439,
        desiredReplica: 8,
        desiredCpu: 7200,
        desiredMemory: 8192,
        pendingReplica: 8,
        readyReplica: 7,
        readyRequestCapacity: 52,
        failedRequests: 421
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
        needCpuForRequests: 2365,
        needMemoryForRequests: 94.60000000000001,
        needCpuReplica: 4,
        needMemoryReplica: 1,
        needReplica: 50,
        needCpu: 4265,
        needMemory: 2494.6,
        desiredReplica: 50,
        desiredCpu: 40000,
        desiredMemory: 25600,
        pendingReplica: 50,
        readyReplica: 50,
        readyRequestCapacity: 7620,
        failedRequests: 0
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
        needCpuForRequests: 15136,
        needMemoryForRequests: 709.5,
        needCpuReplica: 2,
        needMemoryReplica: 1,
        needReplica: 8,
        needCpu: 35136,
        needMemory: 17093.5,
        desiredReplica: 8,
        desiredCpu: 120000,
        desiredMemory: 32768,
        pendingReplica: 8,
        readyReplica: 8,
        readyRequestCapacity: 3125,
        failedRequests: 0
      }
    ],
    nodes: {
      maxPods: 234,
      availableCpu: 31750,
      availableMemory: 124971,
      cost: 0.0256,
      scalingIntervals: 5,
      maxNodes: 1000,
      minNodes: 30
    },
    needPods: 121,
    needCpu: 51061,
    needMemory: 84027.1,
    desiredPods: 66,
    desiredCpu: 167200,
    desiredMemory: 66560,
    needNodesByCpu: 2,
    needNodesByMemory: 1,
    needNodesByPods: 1,
    desiredNodesByCpu: 6,
    desiredNodesByMemory: 1,
    desiredNodesByPods: 1,
    desiredNodes: 30,
    readyNodes: 30,
    readyRequestCapacity: 52,
    failedRequests: 421,
    cost: 0.768,
    failedRequestPenalty: 8.42
  },
  ...
]
```

### Graphing

You can graph the output to help visualize it, I used Grafana here.

![Grafana Example](./docs/grafana-example.png 'Grafana Example')
