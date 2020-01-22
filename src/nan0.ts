import {Message} from 'google-protobuf';

const WebSocket = require('ws');
const fnv = require('fnv-plus');

let preamble = new Uint8Array([0x01, 0x02, 0x03, 0xFF, 0x03, 0x02, 0x01]);

function SetPreamble(p: Uint8Array) {
  preamble = p;
}

const checkPreamble = (bytes: Uint8Array): boolean => {
  if (bytes.length < preamble.length) {
    return false;
  }
  for (let i = 0; i < preamble.length; i++) {
    if (bytes[i] !== preamble[i]) {
      return false;
    }
  }
  return true;
};

const sizeWriter = (num: number): Uint8Array => {
  let result = new Uint8Array(4);
  result[0] = num >> 24;
  result[1] = num >> 16;
  result[2] = num >> 8;
  result[3] = num;
  return result;
};

const concat = (a: Uint8Array, b: Uint8Array): Uint8Array => {
  let c = new Uint8Array(a.length + b.length);
  c.set(a, 0);
  c.set(b, a.length);
  return c;
};

const getIdentHashBytes = (typeName: string): Uint8Array => {
  return sizeWriter(fnv.fast1a32(typeName));
};

type Nan0Client = {
  send: (message: Message) => void;
  close: () => void;
}

class Nan0Idents {
  idents: Map<number, MessageType> = new Map();

  addIdent<T extends Message>(typeName: string, conversionFunc: MessageType): void {
    let key = fnv.fast1a32(typeName);
    this.idents[key] = conversionFunc;
  }

  get(key: number): MessageType {
    return this.idents[key];
  }
}
type Closer = (code?: number, reason?: string) => void

type Nan0Message = {
  data: Message,
  typeName: string,
}

interface MessageType {
  deserializeBinary: (ByteSource) => Message
}

function makeWebsocket(url: string, onSuccess: (WebSocket) => void, onFailure: (Error) => void) {
  let websocket = new WebSocket(url);
  websocket.on('open', () => {
    onSuccess(websocket);
  });
  websocket.on('error', (err) => {
    onFailure(err);
  });
}

function promiseWebsocket(url: string): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    makeWebsocket(url, (success) => {
      resolve(success);
    }, (failure) => {
      reject(failure);
    })
  })
}

async function Nan0Websocket(url: string, idents: Nan0Idents, onMessage: (msg: Message, closer?: Closer) => void): Promise<Nan0Client> {
  let websocket: WebSocket = await promiseWebsocket(url);
  let result: Nan0Client = {send: null, close: null};

  result.close = (num?: number, reason?: string) => websocket.close(num, reason);
  result.send = (message: Nan0Message) => {
    const messageBytes: Uint8Array = message.data.serializeBinary();
    const messageIdent: Uint8Array = getIdentHashBytes(message.typeName);
    const messageLengthBytes: Uint8Array = sizeWriter(messageBytes.length);
    const packet = concat(concat(concat(preamble, messageIdent), messageLengthBytes), messageBytes);
    websocket.send(packet);
  };

  websocket.addEventListener('message', function (event) {
    let bytes = new DataView(new Uint8Array(event.data).buffer);
    if (!checkPreamble(event.data)) {
      throw('preamble is invalid')
    }
    let messageIdex = preamble.length + 8;
    let ident = bytes.getUint32(preamble.length);
    let size = bytes.getUint32(preamble.length + 4);
    let message = bytes.buffer.slice(messageIdex);
    if (message.byteLength !== size) {
      throw('message failed size check')
    }
    onMessage(idents.get(ident).deserializeBinary(message), result.close);
  });

  return result;
}


export { Nan0Idents, Nan0Websocket, SetPreamble };

