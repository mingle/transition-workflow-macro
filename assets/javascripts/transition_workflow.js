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
            value = nodeValue;
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
      var withSamePropertyName = function(property) {
        return property.name == property_name;
      };

      var from = this.findFromProperty(property_name).value;
      var to = this.will_set_card_properties.detect(withSamePropertyName).value;

      return {from: from, to: to, name: this.name};
    },
    
    findFromProperty: function(propName) {
       return this.if_card_has_properties_including_set().detect(function(property) {
         return property.name == propName;
       }) || PropertyDefinition.createAnyProperty(this.propertyName);
    },

    if_card_has_properties_including_set: function() {
      var set_properties = this.if_card_has_properties_set.collect(function(propDef) {
        return PropertyDefinition.createSetProperty(propDef.name)
      });
      return this.if_card_has_properties.concat(set_properties);
    },

    findWillSetPropertyByPropertyName: function(propertyName) {
      return this.will_set_card_properties.detect(function(property) {
        return property.name == propertyName;
      });
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

    thatModifyPropertyDefinition: function(propName) {
      return Object.extend(this.select(function(t) {
        return t.will_set_card_properties.any(function(property) {
          return property.name == propName;
        });
      }), TransitionFilters);
    },
  
    sortByPropertyDefinition: function(propertyDefinition) {
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
  };

  var PropertyDefinition = {
    
    participantsFor: function(transitionMarkups) {
      return this.allValues().select(function(property_value){
          return transitionMarkups.any(function(transitionMarkup) {
            return transitionMarkup.from == property_value || transitionMarkup.to == property_value;
          })
      }).collect(function(property_value) {
        return this.createParticipant(property_value);
      }.bind(this));
    },

    createParticipant: function(property_value) {
      var participant = {alias: property_value.gsub(/ /, '_'), name: property_value};

      if (participant.alias == participant.name) {
        participant.markup = 'participant ' + participant.name;
      } else {
        participant.markup = 'participant "' + participant.name + '" as ' + participant.alias;
      }
      return participant;
    },

    createSetProperty: function(propName) {
      return {name: propName, value: '(set)'};
    },
    createAnyProperty: function(propName) {
      return {name: propName, value: '(any)'};
    },

    allValues: function(){
      var values = $A(['(any)', '(set)', '(not set)']);
      return values.concat(this.property_value_details.sortBy(function(pv) { return pv.position; }).pluck('value'));
    },

    valuePositionMap: function(){
      return this.allValues().inject($H(), function(memo, value, index) {
        memo.set(value, index);
        return memo;
      });
    }
  };

  var TransitionComparetor = Class.create({
    initialize: function(propertyDefinition) {
      this.propertyName = propertyDefinition.name;
      this.valuePositionMap = propertyDefinition.valuePositionMap();
    },

    sorter: function() {
      return this.compare.bind(this)
    },

    compare: function(left, right) {
      var a = this.positionOfPropertyValue(left.if_card_has_properties_including_set());
      var b = this.positionOfPropertyValue(right.if_card_has_properties_including_set());
      if (a == b) {
        a = this.positionOfPropertyValue(left.will_set_card_properties);
        b = this.positionOfPropertyValue(right.will_set_card_properties);
        if (a == b) {
          a = left.name;
          b = right.name;
        }
      }

      return a < b ? -1 : a > b ? 1 : 0;
    },

    positionOfPropertyValue: function(properties) {
      var property = properties.detect(function(property) {
        return property.name == this.propertyName;
      }.bind(this)) || PropertyDefinition.createAnyProperty(this.propertyName);

      return this.valuePositionMap.get(property.value);
    }

  });

  var TransitionWorkflow = Class.create({
    initialize: function(cardTypeName, propertyName, transitions, propertyDefinitions) {
      this.cardTypeName = cardTypeName;
      this.propertyName = propertyName;
      this.transitions = transitions;
      this.propertyDefinition = propertyDefinitions.findByName(propertyName);
    },

    validate: function() {
      if (this.propertyDefinition == null) {
        throw 'property name: ' + this.propertyName + ' does not exist.';
      }
    },

    markup: function() {
      this.validate();

      var transitionMarkups = this.transitionMarkups();
      var participants = this.propertyDefinition.participantsFor(transitionMarkups);

      var participantAliases = participants.inject($H({}), function(memo, participant) {
        memo.set(participant.name, participant.alias);
        return memo;
      });

      return participants.pluck('markup').concat(transitionMarkups.collect(function(markup) {
        return participantAliases.get(markup.from) + "->" + participantAliases.get(markup.to) + ": " + markup.name;
      }));
    },
    transitionMarkups: function() {
      return this.transitions
                .findByCardTypeName(this.cardTypeName)
                .thatModifyPropertyDefinition(this.propertyDefinition.name)
                .sortByPropertyDefinition(this.propertyDefinition)
                .asWorkflowMarkup(this.propertyDefinition.name);
    }
  })

  var Facade = Class.create({
    createMarkupAsync: function(cardTypeName, propertyName, prefixPath, callback, errorCallback) {
      var transitions_path = prefixPath + '/transitions.xml';
      var pd_path = prefixPath + '/property_definitions.xml';

      new Ajax.Request(transitions_path, {method: 'get', onSuccess: function(transport) {
        var transitions = transport.responseXML.documentElement;
        new Ajax.Request(pd_path, {method: 'get', onSuccess: function(transport) {
          var definitions = transport.responseXML.documentElement;
          try {
            var markup = this.createTransitionWorkflow(cardTypeName, propertyName, transitions, definitions).markup();
            callback(markup);
          }catch(e) {
            errorCallback(e);
          }
        }.bind(this)});
      }.bind(this)});
    },

    createTransitionWorkflow: function(cardTypeName, propertyName, transitionsXml, propertyDefinitionsXml) {
      return new TransitionWorkflow(cardTypeName, propertyName, this.parseTransitions(transitionsXml), this.parsePropertyDefinitions(propertyDefinitionsXml));
    },

    parseTransitions: function(xml){
      return Object.extend(XmlUtils.elementToObject(xml).collect(function(transition) {
        return Object.extend(transition, Transition);
      }), TransitionFilters);
    },

    parsePropertyDefinitions: function(xml) {
      propertyDefinitions = XmlUtils.elementToObject(xml).collect(function(propertyDefinition) {
        return Object.extend(propertyDefinition, PropertyDefinition);
      });
      return Object.extend(propertyDefinitions, PropertyDefinitionFilters);
    }

  })

  return Facade;
};

var MinglePluginTransitionWorkflowFacade = loadMinglePluginTransitionWorkflowFacade();
