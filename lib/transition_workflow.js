
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
    var result = [];
    if (cardTypeName) {
      result = this.select(function(t) {
        return t.card_type.name.toLowerCase() == cardTypeName.toLowerCase();
      });
    }
    return Object.extend(result, TransitionFilters);
  },

  thatModifyPropertyDefinition: function(propName) {
    return Object.extend(this.select(function(t) {
      return t.will_set_card_properties.any(function(property) {
        return property.name == propName;
      });
    }), TransitionFilters);
  },
  
  sortBy: function(propertyDefinition) {
    var comparetor = new TransitionComparetor(propertyDefinition);
    return this.sort(comparetor.sorter());
  },

  asWorkflowMarkup: function(propertyName) {
    return this.collect(function(t) {
      return t.asWorkflowMarkup(propertyName);
    });
  }

};

var PropertyDefinitionFilters = {
  findByName: function(propertyName) {
    return this.detect( function(propDef){
      return propDef.name.toLowerCase() == propertyName.toLowerCase();
    });
  }
}

var PropertyDefinition = {
  valuePositionMap: function(){
    var map = $H();
    map.set('(any)', -3);
    map.set('(set)', -2);
    map.set(null, -1);
    this.property_value_details.each(function(detail){
      map.set(detail.value, detail.position);
    });
    return map;
  }
}

var TransitionComparetor = Class.create({
  initialize: function(propertyDefinition) {
    this.propertyName = propertyDefinition.name;
    this.valuePositionMap = propertyDefinition.valuePositionMap();
  },

  sorter: function() {
    return this.compare.bind(this)
  },

  compare: function(left, right) {
    var a = this.positionOfFromPropertyValue(left);
    var b = this.positionOfFromPropertyValue(right);

    if (a == b) {
      a = this.positionOfToPropertyValue(left);
      b = this.positionOfToPropertyValue(right);
      if (a == b) {
        a = left.name;
        b = right.name;
      }
    }

    return a < b ? -1 : a > b ? 1 : 0;
  },

  positionOfFromPropertyValue: function(transition) {
    return this.positionOfPropertyValue(transition.if_card_has_properties);
  },

  positionOfToPropertyValue: function(transition) {
    return this.positionOfPropertyValue(transition.will_set_card_properties);
  },
  
  positionOfPropertyValue: function(properties) {
    var property = properties.detect(function(property) {
      return property.name == this.propertyName;
    }.bind(this));
    return this.valuePositionMap.get(property.value)
  }

})

var TransitionWorkflow = Class.create({

  markup: function(cardTypeName, propertyName, transitionsXml, propertyDefinitionsXml) {
    var transitions = this.parseTransitions(transitionsXml);
    var propertyDefinitions = this.parsePropertyDefinitions(propertyDefinitionsXml);
    var propertyDefinition = propertyDefinitions.findByName(propertyName);

    // # validate "property_values_description"=>"Managed text list",
    return transitions
              .findByCardTypeName(cardTypeName)
              .thatModifyPropertyDefinition(propertyDefinition.name)
              .sortBy(propertyDefinition)
              .asWorkflowMarkup(propertyDefinition.name);
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
    propertyDefinitions = XmlUtils.elementToObject(xml).collect(function(propertyDefinition) {
      return Object.extend(propertyDefinition, PropertyDefinition);
    });
    return Object.extend(propertyDefinitions, PropertyDefinitionFilters);
  }

})
