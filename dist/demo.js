"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
exports.__esModule = true;
exports.node = exports.failedRequestPenalty = exports.pullers = exports.units = void 0;
var _1 = require("./");
var fs = __importStar(require("fs"));
exports.units = 1 * 60 * 1000; // 1 minute in milliseconds
exports.pullers = [
    { time: Date.parse('01 Jan 2021 00:00:00 GMT'), requests: 500 },
    { time: Date.parse('02 Jan 2021 00:00:00 GMT'), requests: 100 },
    { time: Date.parse('02 Jan 2021 13:00:00 GMT'), requests: 25000 },
    { time: Date.parse('03 Jan 2021 00:00:00 GMT'), requests: 250 },
    { time: Date.parse('05 Jan 2021 00:00:00 GMT'), requests: 150 },
    { time: Date.parse('05 Jan 2021 03:00:00 GMT'), requests: 25000 },
    { time: Date.parse('06 Jan 2021 00:00:00 GMT'), requests: 1500 },
    { time: Date.parse('06 Jan 2021 23:59:00 GMT'), requests: 500 },
];
exports.failedRequestPenalty = 0.02;
exports.node = {
    // m5.8xlarge
    maxPods: 234,
    availableCpu: 31750,
    availableMemory: 124971,
    cost: 1.536 / 60,
    scalingIntervals: 5,
    maxNodes: 1000,
    minNodes: 30
};
var components = [
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
        scalingIntervals: 2
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
        scalingIntervals: 120
    },
];
var output = _1.calculate(exports.pullers, exports.units, components, exports.node, exports.failedRequestPenalty);
console.log(output[100]);
fs.writeFileSync('./output.json', JSON.stringify(output));
console.log("totalCost: " + output.reduce(function (accumulator, interval) { return (accumulator = accumulator + (interval.cost || 0)); }, 0), "totalFailedRequests: " + output.reduce(function (accumulator, interval) { return (accumulator = accumulator + interval.failedRequests); }, 0), "totalFailedRequestPenalties: " + output.reduce(function (accumulator, interval) { return (accumulator = accumulator + interval.failedRequestPenalty); }, 0));
