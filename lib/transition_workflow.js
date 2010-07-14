var Transition = Class.create({
  initialize: function(ele) {
    
  }
})

var PropertyDefinition = Class.create({
  initialize: function(ele) {
    
  }
})

var TransitionWorkflow = Class.create({
  initialize: function() {
    
  },

  findAllTransitions: function(url){
    var path = "http://xli:a@localhost:4001/api/v2/projects/abc123/transitions.xml";
    request = new Ajax.Request(path, {method: 'get', asynchronous: false, onSuccess: function(response) {
      parseAllTransitions(response.responseXML)
    }});
  },

  parseAllTransitions: function(xml){
    return xml.innerHTML;
  }
  
})
