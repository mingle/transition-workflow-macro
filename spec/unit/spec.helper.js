
function getData(name) {
  var path = './data/' + name + '.xml';
  var request = new Ajax.Request(path, {method: 'get', asynchronous: false});
  return request.transport.responseText;
}
