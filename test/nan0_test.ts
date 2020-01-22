import * as nan0 from '../src/nan0';
import {Service} from '../src/service_pb'
import * as assert from 'assert'

function main(): void {
  const idents: nan0.Nan0Idents = new nan0.Nan0Idents();
  const service: Service = new Service();
  service.setHostname('XTESTX');
  idents.addIdent('nan0.Service', Service);
  nan0.Nan0Websocket('http://localhost:8080', idents, (msg, close) => {
    assert.equal(msg.getHostname(), 'XTESTX');
    close();
  }).then((client) => {
    client.send({
      data: service,
      typeName: 'nan0.Service'
    });
  }).catch((reason) => {
    console.log(`Client not ready: ${reason}`)
  });
}

main();
