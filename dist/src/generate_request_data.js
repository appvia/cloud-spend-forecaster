"use strict";
exports.__esModule = true;
exports.generate = void 0;
function generate(pullers, units) {
    var data = [];
    pullers.forEach(function (from, i) {
        if (i + 1 == pullers.length)
            return;
        var next = pullers[i + 1];
        var toCreate = (next.time - from.time) / units;
        for (var i_1 = 0; i_1 < toCreate; i_1++) {
            var foo = ((next.requests - from.requests) / toCreate) * i_1 + from.requests;
            data.push({
                time: i_1 * units + from.time,
                requests: Math.ceil(foo)
            });
        }
    });
    return data;
}
exports.generate = generate;
