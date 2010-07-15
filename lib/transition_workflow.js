
var XmlUtils = {
  elementToObject: function(ele) {
    if (ele.getAttribute("type") == 'array') {
      return ele.childElements().collect(function(child, index) {
        return this.elementToObject(child);
      }.bind(this));
    } else {
      var result = new Object;
      for(var i=0; i < ele.attributes.length; i++) {
        var item = ele.attributes.item(i);
        result[item.name] = item.value;
      }

      ele.childElements().each(function(child, index) {
        var value = this.parseElementValue(child);
        var name = child.tagName.toLowerCase();
        result[name] = value
      }.bind(this));

      return result;
    }
  },

  parseElementValue: function(element) {
    var value = null;
    if (element.childElementCount == 0) {
      if (element.getAttribute('nil') != 'true') {
        value = element.innerHTML;
      }
      if (element.getAttribute('type') == 'integer') {
        value = parseInt(value);
      }
    } else {
      value = this.elementToObject(element);
    }
    return value;
  },

  stringToElement: function(text){
    var div = document.createElement('div');
    div.innerHTML = text;
    return div.childElements()[0];
  }
}

var Transition = {
  asWorkflowMarkup: function(property_name) {
    var withSamePropertyName = function(property) {
      return property.name == property_name;
    };

    var from = this.if_card_has_properties.detect(withSamePropertyName).value;
    var to = this.will_set_card_properties.detect(withSamePropertyName).value;
    return from + "->" + to + ": " + this.name;
  },

  findWillSetPropertyByPropertyName: function(propertyName) {
    return this.will_set_card_properties.detect(function(property) {
      return property.name == propertyName;
    })
  }
};

var TransitionFilters = {
  findByCardTypeName: function(cardTypeName) {
    return Object.extend(this.select(function(t) {
      return t.card_type.name == cardTypeName;
    }), TransitionFilters);
  },

  thatModifyPropertyDefinition: function(propName) {
    return Object.extend(this.select(function(t) {
      return t.will_set_card_properties.any(function(property) {
        return property.name == propName;
      });
    }), TransitionFilters);
  },

  thatStartWithProperty: function(property) {
    return Object.extend(this.select(function(t) {
      return t.if_card_has_properties.any(function(from_property) {
        return from_property.name == property.name && from_property.value == property.value;
      })
    }), TransitionFilters);
  },
  
  sortByPropertyValueOrder: function(propertyDefinition) {
    return this.sortBy(function(transition) {
      var willSetProperty = transition.findWillSetPropertyByPropertyName(propertyDefinition.name);

      var propertyValue = propertyDefinition.property_value_details.detect(function(propertyValue) {
        return propertyValue.value == willSetProperty.value;
      });
      return propertyValue.position;
    });
  }
};

var PropertyDefinitionFilters = {
  findByName: function(propertyName) {
    return this.detect( function(propDef){
      return propDef.name == propertyName;
    });
  }
}

var TransitionWorkflow = Class.create({

  markup: function(cardTypeName, propertyName, transitionsXml, propertyDefinitionsXml) {
    var transitions = this.parseTransitions(transitionsXml);
    var propertyDefinitions = this.parsePropertyDefinitions(propertyDefinitionsXml);

    var propertyDefinition = propertyDefinitions.findByName(propertyName);
    // # validate "property_values_description"=>"Managed text list",

    var propertyDefinitionTransitions = transitions.findByCardTypeName(cardTypeName).thatModifyPropertyDefinition(propertyName);

    var sortedTransitions = propertyDefinition.property_value_details.collect(function(propertyValue) {
      return propertyDefinitionTransitions.thatStartWithProperty({name: propertyName, value: propertyValue.value}).sortByPropertyValueOrder(propertyDefinition);
    }).flatten();

    return sortedTransitions.collect(function(t) {
      return t.asWorkflowMarkup(propertyName);
    });
  },

  findAllTransitions: function(url){
    new Ajax.Request(url, {method: 'get', asynchronous: false, onSuccess: function(response) {
      this.parseTransitions(response.responseText);
    }});
  },

  parseTransitions: function(xmlText){
    var xml = XmlUtils.stringToElement(xmlText);
    return Object.extend(XmlUtils.elementToObject(xml).collect(function(transition) {
      return Object.extend(transition, Transition);
    }), TransitionFilters);
  },
  parsePropertyDefinitions: function(xmlText) {
    var xml = XmlUtils.stringToElement(xmlText);
    return Object.extend(XmlUtils.elementToObject(xml), PropertyDefinitionFilters);
  }

})
