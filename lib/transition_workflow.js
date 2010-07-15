
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
      if(element.getAttribute('nil') != 'true') {
        value = element.innerHTML;
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
      var from = t.if_card_has_properties.any(function(property) {
        return property.name == propName;
      });
      var to = t.will_set_card_properties.any(function(property) {
        return property.name == propName;
      });
      return from && to;
    }), TransitionFilters);
  }
}

var TransitionWorkflow = Class.create({
  initialize: function() {
    
  },
  
  markup: function(cardTypeName, propertyName, transitionsXml, propertyDefinitionsXml) {
    var transitions = this.parseTransitions(transitionsXml);
    // var propertyDefinitions = this.parsePropertyDefinitions(propertyDefinitionsXml);
    return transitions.findByCardTypeName(cardTypeName).collect(function(t) {
      return t.asWorkflowMarkup(propertyName);
    });
    //.select {|t| t.will_set_card_properties.any?{|property| property.name.downcase == 'status'} && t.if_card_has_properties.any?{|property| property.name.downcase == 'status'}}
    // 
    // status = prop_def.find(:all).detect{|pd| pd.name.downcase == 'status'}
    // # validate "property_values_description"=>"Managed text list",
    // 
    // status.property_value_details.collect(&:value).each do |prop_value|
    //   puts prop_value
    //   pv_transitions = transitions.select {|t| t.if_card_has_properties.any? {|property| property.name.downcase == 'status' && property.value == prop_value}}
    //   pv_transitions = pv_transitions.sort_by do |t|
    //     property = t.will_set_card_properties.detect {|property| property.name.downcase == 'status' }
    //     property_value = status.property_value_details.detect {|pv| pv.value == property.value}
    //     property_value.position
    //   end
    //   pv_transitions.each do |t|
    //     puts "  #{t.if_card_has_properties.detect {|property| property.name.downcase == 'status'}.value}->#{t.will_set_card_properties.detect {|property| property.name.downcase == 'status'}.value}: #{t.name}"
    //   end
    // end
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
    return XmlUtils.elementToObject(xml);
  }

})
