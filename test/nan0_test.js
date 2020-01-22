"use strict";
exports.__esModule = true;
var nan0 = require("../src/nan0");
var service_pb_1 = require("../src/service_pb");
var assert = require("assert");
function main() {
    var idents = new nan0.Nan0Idents();
    var service = new service_pb_1.Service();
    service.setHostname('XTESTX');
    idents.addIdent('nan0.Service', service_pb_1.Service);
    nan0.Nan0Websocket('http://localhost:8080', idents, function (msg, close) {
        assert.equal(msg.getHostname(), 'XTESTX');
        close();
    }).then(function (client) {
        client.send({
            data: service,
            typeName: 'nan0.Service'
        });
    })["catch"](function (reason) { console.log("Client not ready: " + reason); });
}
main();
