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
exports.calculate = void 0;
var generate_request_data_1 = require("./src/generate_request_data");
var calc = __importStar(require("./src/calculator"));
function calculate(pullers, units, components, node, failedRequestPenalty) {
    return generate_request_data_1.generate(pullers, units)
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
        .map(calc.calculatePenalties(failedRequestPenalty));
}
exports.calculate = calculate;
