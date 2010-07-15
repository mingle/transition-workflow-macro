
function getData(name) {
  var path = './data/' + name + '.xml';
  var request = new Ajax.Request(path, {method: 'get', asynchronous: false});
  return request.transport.responseText;
}


function statusPropertyDefintionStub() {
  return {
    name: 'Status',
    valuePositionMap: function() {
      var map = $H();
      map.set('New', 1);
      map.set('Closed', 2);
      map.set(null, -1);
      map.set('(set)', -2);
      map.set('(any)', -3);
      return map;
    }
  };
}