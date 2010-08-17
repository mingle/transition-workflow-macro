// Copyright 2010 ThoughtWorks, Inc.  All rights reserved.
function loadMinglePluginTransitionWorkflowFacade() {

  var XmlUtils = {
    childElements: function(ele) {
      var result = [];
      for (var i=0, nodes = ele.childNodes; i<nodes.length; i++) {
        if (nodes[i].nodeType == 1) {
          result.push(nodes[i]);
        }
      }
      return result;
    },
    
    elementToObject: function(ele) {
      if (ele.getAttribute("type") == 'array') {
        return this.childElements(ele).collect(function(child, index) {
          return this.elementToObject(child);
        }.bind(this));
      } else {
        var result = new Object;
        for(var i=0; i < ele.attributes.length; i++) {
          var item = ele.attributes.item(i);
          result[item.name] = item.value;
        }

        this.childElements(ele).each(function(child, index) {
          var value = this.parseElementValue(child);
          var name = child.tagName.toLowerCase();
          result[name] = value
        }.bind(this));

        return result;
      }
    },

    parseElementValue: function(element) {
      var value = null;
      if (this.isTextElement(element)) {
        if (element.getAttribute('nil') == 'true') {
          if (element.tagName == 'value') {
            value = '(not set)';
          }
        } else {
          var nodeValue = element.firstChild ? element.firstChild.nodeValue : '';
          var type = element.getAttribute('type');
          if(type == 'integer') {
            value = parseInt(nodeValue);
          } else if (type == 'array') {
            value = [];
          } else {
            value = nodeValue.escapeHTML();
          }
        }
      } else {
        value = this.elementToObject(element);
      }
      return value;
    },

    isTextElement: function(ele) {
      if (ele.childNodes.length == 0) {
        return true;
      }
      return ele.childNodes.length == 1 && ele.firstChild.nodeType == 3;
    }

  };

  var Transition = {
    asWorkflowMarkup: function(property_name) {
      var from = this.findFromProperty(property_name).value;
      var to = this.transitionsTo(property_name);
      return {from: from, to: to, name: this.name};
    },
    
    transitionsTo: function(propName){
      var withSamePropertyName = function(property) {
        return property.name.toLowerCase() == propName.toLowerCase();
      };
      var willSetProperty = this.will_set_card_properties.detect(withSamePropertyName);
      if(willSetProperty){
        return willSetProperty.value;
      }else{
        return this.if_card_has_properties.detect(withSamePropertyName).value;
      }
    },
    
    findFromProperty: function(propName) {
       return this.ifCardHasPropertiesIncludingSet().detect(function(property) {
         return property.name.toLowerCase() == propName.toLowerCase();
       }) || PropertyDefinition.createAnyProperty(this.propertyName);
    },

    ifCardHasPropertiesIncludingSet: function() {
      var set_properties = this.if_card_has_properties_set.collect(function(propDef) {
        return PropertyDefinition.createSetProperty(propDef.name)
      });
      return this.if_card_has_properties.concat(set_properties);
    },

    sameNameAs: function(propertyName){
      return function(property) {
        return property.name.toLowerCase() == propertyName.toLowerCase();
      }
    },

    willSet: function(propertyName) {
      return this.will_set_card_properties.any(this.sameNameAs(propertyName));
    },
    
    has: function(propertyName) {
      return this.if_card_has_properties.any(this.sameNameAs(propertyName));
    },
    
    userInputOptionalOrRequired: function(propertyName) {
      return this.user_input_optional.any(this.sameNameAs(propertyName)) || this.user_input_required.any(this.sameNameAs(propertyName));
    }
  };

  var TransitionFilters = {
    findByCardTypeName: function(cardTypeName) {
      var result = [];
      if (cardTypeName) {
        result = this.select(function(t) {
          //todo need test
          if (!t['card_type']) {
            return true;
          }
          return t.card_type.name.toLowerCase() == cardTypeName.toLowerCase();
        });
      }
      return Object.extend(result, TransitionFilters);
    },

    thatInvolvePropertyDefinition: function(propertyName) {
      return Object.extend(this.select(function(transition) {
        return transition.willSet(propertyName) || (transition.has(propertyName) && !transition.userInputOptionalOrRequired(propertyName));
      }), TransitionFilters);
    },
  
    sortByPropertyDefinition: function(propertyName, managedValues) {
      var comparetor = new TransitionComparetor(propertyName, managedValues);
      return this.sort(comparetor.sorter());
    },

    asWorkflowMarkup: function(propertyName) {
      return this.collect(function(t) {
        return t.asWorkflowMarkup(propertyName);
      });
    }
  };

  var PropertyDefinition = {
    createSetProperty: function(propName) {
      return {name: propName, value: '(set)'};
    },
    createAnyProperty: function(propName) {
      return {name: propName, value: '(any)'};
    }
  };

  var TransitionComparetor = Class.create({
    initialize: function(propertyName, managedValues) {
      this.propertyName = propertyName;
      this.managedValues = managedValues;
    },

    sorter: function() {
      return this.compare.bind(this)
    },

    compare: function(left, right) {
      var a = this.positionOfPropertyValue(left.ifCardHasPropertiesIncludingSet());
      var b = this.positionOfPropertyValue(right.ifCardHasPropertiesIncludingSet());
      if (a == b) {
        a = this.positionOfPropertyValue(left.will_set_card_properties);
        b = this.positionOfPropertyValue(right.will_set_card_properties);
        if (a == b) {
          a = left.name;
          b = right.name;
        }
      }
      return a < b ? -1 : (a > b ? 1 : 0);
    },

    positionOfPropertyValue: function(properties) {
      var property = properties.detect(function(property) {
        return property.name.toLowerCase() == this.propertyName.toLowerCase();
      }.bind(this)) || PropertyDefinition.createAnyProperty(this.propertyName);
      return this.managedValues.indexOf(property.value);
    }

  });

  var TransitionWorkflow = Class.create({
    initialize: function(cardTypeName, propertyName, managedValues, transitions, allValuesAsParticipants) {
      this.allValuesAsParticipants = allValuesAsParticipants;
      this.cardTypeName = cardTypeName;
      this.propertyName = propertyName;
      this.originalManagedValues = managedValues;
      this.transitionPropertyExtraValues = $A(['(any)', '(set)', '(not set)']);
      this.managedValues = this.transitionPropertyExtraValues.concat(managedValues);
      this.transitions = transitions;
    },
    
    participants: function() {
      var transitionMarkups = this._transitionMarkups();
      var participantValues = this.managedValues.select(function(managedValue){
          return transitionMarkups.any(function(transitionMarkup) {
            return transitionMarkup.from == managedValue || transitionMarkup.to == managedValue;
          });
      })
      if (this.allValuesAsParticipants) {
        participantValues = participantValues.select(function(value) {
          return this.transitionPropertyExtraValues.include(value)
        }.bind(this)).concat(this.originalManagedValues);
      }
      return participantValues.collect(function(participant) { 
        return 'participant "#{name}" as "#{name}"'.interpolate({ name : participant }); 
      });
    },
    
    edges: function(){
      return this._transitionMarkups().collect(function(markup) {
        return '"#{from}"->"#{to}": #{name}'.interpolate(markup);
      });
    },

    markup: function() {
      return this.participants().concat(this.edges());
    },
    
    _transitionMarkups: function() {
      if (this._memoizedMarkups == null) {
        this._memoizedMarkups = this.transitions
                .findByCardTypeName(this.cardTypeName)
                .thatInvolvePropertyDefinition(this.propertyName)
                .sortByPropertyDefinition(this.propertyName, this.managedValues)
                .asWorkflowMarkup(this.propertyName);
      }
      return this._memoizedMarkups;
    }
  })

  var Facade = Class.create({
    createMarkupAsync: function(allValuesAsParticipants, cardTypeName, propertyName, managedValues, transitionsPath, callback, errorCallback) {

      new Ajax.Request(transitionsPath, {method: 'get', onSuccess: function(transport) {
        var transitions = transport.responseXML.documentElement;
        try {
          var markup = this.createTransitionWorkflow(cardTypeName, propertyName, managedValues, transitions, allValuesAsParticipants).markup();
          callback(markup);
        }catch(e) {
          errorCallback(e);
        }
      }.bind(this)});
    },

    createTransitionWorkflow: function(cardTypeName, propertyName, managedValues, transitionsXml, allValuesAsParticipants) {
      return new TransitionWorkflow(cardTypeName, propertyName, managedValues, this.parseTransitions(transitionsXml), allValuesAsParticipants);
    },

    parseTransitions: function(xml){
      return Object.extend(XmlUtils.elementToObject(xml).collect(function(transition) {
        return Object.extend(transition, Transition);
      }), TransitionFilters);
    }

  })

  return Facade;
};

var MinglePluginTransitionWorkflowFacade = loadMinglePluginTransitionWorkflowFacade();
