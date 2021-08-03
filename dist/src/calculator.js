"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
exports.__esModule = true;
exports.calculateFailedRequests = exports.calculateReadyRequestCapacity = exports.calculatePenalties = exports.calculateCosts = exports.calculateIfOverSubscribed = exports.calculateReadyPods = exports.calculatePendingPods = exports.calculateReadyNodes = exports.calculateNodesDesiredForInterval = exports.calculateDesiredResourceForInterval = exports.withinRange = exports.calcCapacity = exports.calculateNodesNeededForInterval = exports.calculateResourceNeededForInterval = exports.calculateReplicasNeededForInterval = exports.calculateResourceNeededForRequestsInterval = exports.putNodesIntoIntervals = exports.putComponentsIntoIntervals = void 0;
function putComponentsIntoIntervals(components) {
    return function (interval) {
        return __assign(__assign({}, interval), { components: components });
    };
}
exports.putComponentsIntoIntervals = putComponentsIntoIntervals;
function putNodesIntoIntervals(node) {
    return function (interval) {
        return __assign(__assign({}, interval), { nodes: node });
    };
}
exports.putNodesIntoIntervals = putNodesIntoIntervals;
function calculateResourceNeededForRequestsInterval(interval) {
    var intervalComponents = interval.components.map(function (component) {
        return __assign(__assign({}, component), { needCpuForRequests: interval.requests * component.requestToCpu, needMemoryForRequests: interval.requests * component.requestToMemory });
    });
    return __assign(__assign({}, interval), { components: intervalComponents });
}
exports.calculateResourceNeededForRequestsInterval = calculateResourceNeededForRequestsInterval;
function calculateReplicasNeededForInterval(interval) {
    var intervalComponents = interval.components.map(function (component) {
        var needCpuReplica = Math.ceil(component.needCpuForRequests / (component.limitCpu - component.baselineCpu));
        var needMemoryReplica = Math.ceil(component.needMemoryForRequests / (component.limitMemory - component.baselineMemory));
        return __assign(__assign({}, component), { needCpuReplica: needCpuReplica, needMemoryReplica: needMemoryReplica, needReplica: Math.max(needMemoryReplica, needCpuReplica, component.minReplica) });
    });
    return __assign(__assign({}, interval), { components: intervalComponents, needPods: intervalComponents.reduce(function (accumulator, component) { return accumulator + component.needReplica; }, 0) });
}
exports.calculateReplicasNeededForInterval = calculateReplicasNeededForInterval;
function calculateResourceNeededForInterval(interval) {
    var intervalComponents = interval.components.map(function (component) {
        return __assign(__assign({}, component), { needCpu: component.needReplica * component.baselineCpu + component.needCpuForRequests, needMemory: component.needReplica * component.baselineMemory + component.needMemoryForRequests });
    });
    return __assign(__assign({}, interval), { components: intervalComponents, needCpu: intervalComponents.reduce(function (accumulator, component) { return accumulator + component.needCpu; }, 0), needMemory: intervalComponents.reduce(function (accumulator, component) { return accumulator + component.needMemory; }, 0) });
}
exports.calculateResourceNeededForInterval = calculateResourceNeededForInterval;
function calculateNodesNeededForInterval(interval) {
    var needNodesByCpu = Math.ceil(interval.needCpu / interval.nodes.availableCpu);
    var needNodesByMemory = Math.ceil(interval.needMemory / interval.nodes.availableMemory);
    var needNodesByPods = Math.ceil(interval.needPods / interval.nodes.maxPods);
    return __assign(__assign({}, interval), { needNodesByCpu: needNodesByCpu, needNodesByMemory: needNodesByMemory, needNodesByPods: needNodesByPods });
}
exports.calculateNodesNeededForInterval = calculateNodesNeededForInterval;
function calcCapacity(replica, limit, to_request, baseline) {
    return Math.floor(replica * (limit * to_request - baseline));
}
exports.calcCapacity = calcCapacity;
function withinRange(min, max, number) {
    return Math.ceil(Math.max(min, Math.min(max, number)));
}
exports.withinRange = withinRange;
function calculateDesiredResourceForInterval(interval) {
    var intervalComponents = interval.components.map(function (component) {
        var desiredReplica = withinRange(component.minReplica, component.maxReplica, (100 / component.scalingThresholdCpu) * component.needCpuReplica);
        var desiredCpu = desiredReplica * component.limitCpu;
        var desiredMemory = desiredReplica * component.limitMemory;
        return __assign(__assign({}, component), { desiredReplica: desiredReplica, desiredCpu: desiredCpu, desiredMemory: desiredMemory });
    });
    return __assign(__assign({}, interval), { components: intervalComponents, desiredPods: intervalComponents.reduce(function (accumulator, component) { return accumulator + component.desiredReplica; }, 0), desiredCpu: intervalComponents.reduce(function (accumulator, component) { return accumulator + component.desiredCpu; }, 0), desiredMemory: intervalComponents.reduce(function (accumulator, component) { return accumulator + component.desiredMemory; }, 0) });
}
exports.calculateDesiredResourceForInterval = calculateDesiredResourceForInterval;
function calculateNodesDesiredForInterval(interval) {
    var desiredNodesByCpu = Math.ceil(interval.desiredCpu / interval.nodes.availableCpu);
    var desiredNodesByMemory = Math.ceil(interval.desiredMemory / interval.nodes.availableMemory);
    var desiredNodesByPods = Math.ceil(interval.desiredPods / interval.nodes.maxPods);
    return __assign(__assign({}, interval), { desiredNodesByCpu: desiredNodesByCpu, desiredNodesByMemory: desiredNodesByMemory, desiredNodesByPods: desiredNodesByPods, desiredNodes: withinRange(interval.nodes.minNodes, interval.nodes.maxNodes, Math.max(desiredNodesByCpu, desiredNodesByMemory, desiredNodesByPods)) });
}
exports.calculateNodesDesiredForInterval = calculateNodesDesiredForInterval;
function calculateReadyNodes(interval, index, intervals) {
    return __assign(__assign({}, interval), { readyNodes: index > interval.nodes.scalingIntervals
            ? intervals[index + 1 - interval.nodes.scalingIntervals].desiredNodes
            : interval.nodes.minNodes });
}
exports.calculateReadyNodes = calculateReadyNodes;
function calculatePendingPods(interval, index, intervals) {
    var intervalComponents = interval.components.map(function (component, cid) {
        var pendingReplica = component.minReplica;
        if (index + 1 - component.scalingIntervals > 0) {
            pendingReplica = intervals[index + 1 - component.scalingIntervals].components[cid].desiredReplica;
        }
        return __assign(__assign({}, component), { pendingReplica: pendingReplica });
    });
    return __assign(__assign({}, interval), { components: intervalComponents });
}
exports.calculatePendingPods = calculatePendingPods;
function calculateReadyPods(interval) {
    var intervalComponents = interval.components.map(function (component) {
        var readyReplica = component.pendingReplica;
        return __assign(__assign({}, component), { readyReplica: readyReplica });
    });
    var cid = 0;
    do {
        intervalComponents[cid].readyReplica = Math.max(intervalComponents[cid].readyReplica - 1, intervalComponents[cid].minReplica);
        cid = cid === intervalComponents.length - 1 ? 0 : cid + 1;
    } while (calculateIfOverSubscribed(intervalComponents, interval.nodes, interval.readyNodes));
    return __assign(__assign({}, interval), { components: intervalComponents });
}
exports.calculateReadyPods = calculateReadyPods;
function calculateIfOverSubscribed(components, nodes, readyNodes) {
    var pendingPodCount = components.reduce(function (accumulator, component) { return accumulator + component.readyReplica; }, 0);
    if (pendingPodCount > readyNodes * nodes.maxPods) {
        return true;
    }
    var pendingCpu = components.reduce(function (accumulator, component) {
        return accumulator + component.readyReplica * component.limitCpu;
    }, 0);
    if (pendingCpu > readyNodes * nodes.availableCpu) {
        return true;
    }
    var pendingMemory = components.reduce(function (accumulator, component) {
        return accumulator + component.readyReplica * component.limitMemory;
    }, 0);
    if (pendingMemory > readyNodes * nodes.availableMemory) {
        return true;
    }
    return false;
}
exports.calculateIfOverSubscribed = calculateIfOverSubscribed;
function calculateCosts(interval) {
    return __assign(__assign({}, interval), { cost: interval.desiredNodes * interval.nodes.cost });
}
exports.calculateCosts = calculateCosts;
function calculatePenalties(failedRequestPenalty) {
    return function (interval) {
        return __assign(__assign({}, interval), { failedRequestPenalty: interval.failedRequests * failedRequestPenalty });
    };
}
exports.calculatePenalties = calculatePenalties;
function calculateReadyRequestCapacity(interval) {
    var intervalComponents = interval.components.map(function (component) {
        var cpuCapacity = (component.readyReplica * (component.limitCpu - component.baselineCpu)) / component.requestToCpu;
        var memoryCapacity = (component.readyReplica * (component.limitMemory - component.baselineMemory)) / component.requestToMemory;
        var readyRequestCapacity = Math.floor(Math.min(cpuCapacity, memoryCapacity));
        return __assign(__assign({}, component), { readyRequestCapacity: readyRequestCapacity });
    });
    return __assign(__assign({}, interval), { components: intervalComponents, readyRequestCapacity: Math.min.apply(Math, intervalComponents.map(function (component) { return component.readyRequestCapacity; })) });
}
exports.calculateReadyRequestCapacity = calculateReadyRequestCapacity;
function calculateFailedRequests(interval) {
    var intervalComponents = interval.components.map(function (component) {
        return __assign(__assign({}, component), { failedRequests: Math.ceil(Math.max(0, interval.requests - component.readyRequestCapacity)) });
    });
    return __assign(__assign({}, interval), { components: intervalComponents, failedRequests: Math.max.apply(null, intervalComponents.map(function (component) { return component.failedRequests; })) });
}
exports.calculateFailedRequests = calculateFailedRequests;
