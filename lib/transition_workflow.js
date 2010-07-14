var Transition = {
  
  asWorkflowMarkup: function(property_name) {
    var withSamePropertyName = function(property) {
      return property.name == property_name;
    };
    var from = this.if_card_has_properties.detect(withSamePropertyName).value;
    var to = this.will_set_card_properties.detect(withSamePropertyName).value;
    return from + "->" + to + ": " + this.name;
  }
};

var TransitionWorkflow = Class.create({
  initialize: function() {
    
  },

  findAllTransitions: function(url){
    // var path = "http://xli:a@localhost:4001/api/v2/projects/abc123/transitions.xml";
    request = new Ajax.Request(url, {method: 'get', asynchronous: false, onSuccess: function(response) {
      this.parseAllTransitions(response.responseText);
    }});
  },

  parseAllTransitions: function(xmlText){
    var xml = this.toXmldomElement(xmlText);
    return this.parseElement(xml).collect(function(transition) {
      return Object.extend(transition, Transition);
    });
  },

  parseElement: function(ele) {
    if (ele.getAttribute("type") == 'array') {
      return ele.childElements().collect(function(child, index) {
        return this.parseElement(child);
      }.bind(this));
    } else {
      var result = new Object;
      for(var i=0; i < ele.attributes.length; i++) {
        var item = ele.attributes.item(i);
        result[item.name] = item.value;
      }

      ele.childElements().each(function(child, index) {
        var value = this.parseElementValue(child);
        result[child.tagName.toLowerCase()] = value
      }.bind(this));

      return result;
    }
  },

  parseElementValue: function(element) {
    var value = null;
    if (element.childElementCount == 0) {
      if(element.getAttribute('nil') != 'true') {
        value = element.innerHTML;
      }
    } else {
      value = this.parseElement(element);
    }
    return value;
  },

  toXmldomElement: function(text){
    var div = document.createElement('div');
    div.innerHTML = text;
    return div.childElements()[0];
  }

})
