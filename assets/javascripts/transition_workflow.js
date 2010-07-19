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
        if (element.getAttribute('nil') != 'true') {
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

    // comment for now, remove this later, we should not need this anymore.
    // stringToElement: function(text){
    //   var div = document.createElement('div');
    //   div.innerHTML = text.gsub(/<([a-zA-Z]+)([^>]*)\/>/, "<#{1}#{2}></#{1}>");
    //   return div.childElements()[0];
    // }
  };

  var Transition = {
    asWorkflowMarkup: function(property_name) {
      var withSamePropertyName = function(property) {
        return property.name == property_name;
      };

      var from = this.findFromProperty(property_name).value;
      var to = this.will_set_card_properties.detect(withSamePropertyName).value;
      if (from == null) {
        from = '(not set)';
      }
      if (to == null) {
        to = '(not set)';
      }
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
        result = this.findAll(function(t) {
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
      return Object.extend(this.findAll(function(t) {
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
    },

    asOrderedWorkflowMarkup: function(propertyDef) {
      
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
      return this.property_value_details.collect(function(property_value){
        return property_value.value;
      }).select(function(property_value){
          return transitionMarkups.any(function(transitionMarkup) {
            return transitionMarkup.from == property_value || transitionMarkup.to == property_value;
          })
      }).collect(function(property_value) {
        var participant = {alias: property_value.gsub(/ /, '_'), name: property_value};
        if (participant['alias'] == property_value) {
          participant['markup'] = 'participant ' + property_value;
        } else {
          participant['markup'] = 'participant "' + property_value + '" as ' + participant['alias'];
        }
        return participant;
      });
    },
    createSetProperty: function(propName) {
      return {name: propName, value: '(set)'};
    },
    createAnyProperty: function(propName) {
      return {name: propName, value: '(any)'};
    },
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

  var Facade = Class.create({
    createMarkup: function(cardTypeName, propertyName, prefixPath) {
      var transitions = this.syncRequest(prefixPath + '/transitions.xml');
      var definitions = this.syncRequest(prefixPath + '/property_definitions.xml');

      return this.orderedMarkup(cardTypeName, propertyName, transitions, definitions);
    },

    syncRequest: function(path) {
      var request = new Ajax.Request(path, {method: 'get', asynchronous: false});
      return request.transport.responseXML.documentElement;
    },

    orderedMarkup: function(cardTypeName, propertyName, transitionsXml, propertyDefinitionsXml) {
      var transitions = this.parseTransitions(transitionsXml);
      var propertyDefinitions = this.parsePropertyDefinitions(propertyDefinitionsXml);
      var propertyDefinition = propertyDefinitions.findByName(propertyName);

      var transitionMarkups = transitions
                .findByCardTypeName(cardTypeName)
                .thatModifyPropertyDefinition(propertyDefinition.name)
                .sortByPropertyDefinition(propertyDefinition)
                .asWorkflowMarkup(propertyDefinition.name);
                
      var participants = propertyDefinition.participantsFor(transitionMarkups);

      var participantAliases = participants.inject($H({}), function(memo, participant) {
        memo.set(participant.name, participant.alias);
        return memo;
      });

      return participants.pluck('markup').concat(transitionMarkups.collect(function(markup) {
        return participantAliases.get(markup.from) + "->" + participantAliases.get(markup.to) + ": " + markup.name;
      }));
    },

    markup: function(cardTypeName, propertyName, transitionsXml, propertyDefinitionsXml) {
      var transitions = this.parseTransitions(transitionsXml);
      var propertyDefinitions = this.parsePropertyDefinitions(propertyDefinitionsXml);
      var propertyDefinition = propertyDefinitions.findByName(propertyName);

      // # validate "property_values_description"=>"Managed text list",
      return transitions
                .findByCardTypeName(cardTypeName)
                .thatModifyPropertyDefinition(propertyDefinition.name)
                .sortByPropertyDefinition(propertyDefinition)
                .asWorkflowMarkup(propertyDefinition.name);
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
