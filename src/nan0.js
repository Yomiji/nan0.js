"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var WebSocket = require('ws');
var fnv = require('fnv-plus');
var preamble = new Uint8Array([0x01, 0x02, 0x03, 0xFF, 0x03, 0x02, 0x01]);
function SetPreamble(p) {
    preamble = p;
}
exports.SetPreamble = SetPreamble;
var checkPreamble = function (bytes) {
    if (bytes.length < preamble.length) {
        return false;
    }
    for (var i = 0; i < preamble.length; i++) {
        if (bytes[i] !== preamble[i]) {
            return false;
        }
    }
    return true;
};
var sizeWriter = function (num) {
    var result = new Uint8Array(4);
    result[0] = num >> 24;
    result[1] = num >> 16;
    result[2] = num >> 8;
    result[3] = num;
    return result;
};
var concat = function (a, b) {
    var c = new Uint8Array(a.length + b.length);
    c.set(a, 0);
    c.set(b, a.length);
    return c;
};
var getIdentHashBytes = function (typeName) {
    return sizeWriter(fnv.fast1a32(typeName));
};
var Nan0Idents = /** @class */ (function () {
    function Nan0Idents() {
        this.idents = new Map();
    }
    Nan0Idents.prototype.addIdent = function (typeName, conversionFunc) {
        var key = fnv.fast1a32(typeName);
        this.idents[key] = conversionFunc;
    };
    Nan0Idents.prototype.get = function (key) {
        return this.idents[key];
    };
    return Nan0Idents;
}());
exports.Nan0Idents = Nan0Idents;
function makeWebsocket(url, onSuccess, onFailure) {
    var websocket = new WebSocket(url);
    websocket.on('open', function () {
        onSuccess(websocket);
    });
    websocket.on('error', function (err) {
        onFailure(err);
    });
}
function promiseWebsocket(url) {
    return new Promise(function (resolve, reject) {
        makeWebsocket(url, function (success) {
            resolve(success);
        }, function (failure) {
            reject(failure);
        });
    });
}
function Nan0Websocket(url, idents, onMessage) {
    return __awaiter(this, void 0, void 0, function () {
        var websocket, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, promiseWebsocket(url)];
                case 1:
                    websocket = _a.sent();
                    result = { send: null, close: null };
                    result.close = function (num, reason) { return websocket.close(num, reason); };
                    result.send = function (message) {
                        var messageBytes = message.data.serializeBinary();
                        var messageIdent = getIdentHashBytes(message.typeName);
                        var messageLengthBytes = sizeWriter(messageBytes.length);
                        var packet = concat(concat(concat(preamble, messageIdent), messageLengthBytes), messageBytes);
                        websocket.send(packet);
                    };
                    websocket.addEventListener('message', function (event) {
                        var bytes = new DataView(new Uint8Array(event.data).buffer);
                        if (!checkPreamble(event.data)) {
                            throw ('preamble is invalid');
                        }
                        var messageIdex = preamble.length + 8;
                        var ident = bytes.getUint32(preamble.length);
                        var size = bytes.getUint32(preamble.length + 4);
                        var message = bytes.buffer.slice(messageIdex);
                        if (message.byteLength !== size) {
                            throw ('message failed size check');
                        }
                        onMessage(idents.get(ident).deserializeBinary(message), result.close);
                    });
                    return [2 /*return*/, result];
            }
        });
    });
}
exports.Nan0Websocket = Nan0Websocket;
