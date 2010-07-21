
function parseTransitionMarkup(markup) {
  var transtionMarkup = new Object;
  var tmp = markup.split(":");
  transtionMarkup.from = tmp[0].split("->")[0];
  transtionMarkup.to = tmp[0].split("->")[1];
  transtionMarkup.name = tmp[1].strip();
  return transtionMarkup;
}

function getData(name) {
  var path = './data/' + name + '.xml';
  var request = new Ajax.Request(path, {method: 'get', asynchronous: false});
  return request.transport.responseXML.documentElement;
}

function log(msg) {
  if (window.debug) {
    console.log(msg);
  }
}
