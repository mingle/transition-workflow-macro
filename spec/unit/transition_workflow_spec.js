
describe 'TransitionWorkflow'
  describe '.findAllTransitions()'
    it 'load transitions from data file'
      var workflow = new TransitionWorkflow;
      var transitions = workflow.parseTransitions(getData('transitions'));
      transitions.length.should_equal(16);
    end
    
    it 'find a transtion properties'
      var workflow = new TransitionWorkflow;
      var transitions = workflow.parseTransitions(getData('accepted_transition'));
      transitions.length.should_equal(1);
    
      transition = transitions[0];
    
      transition.name.should_equal('Accepted');
      transition.card_type.name.should_equal("Story");
    
      transition.if_card_has_properties[0].name.should_equal('Status');
      transition.if_card_has_properties[0].value.should_equal("Ready for Signoff");
      transition.if_card_has_properties[0].type_description.should_equal("Managed text list");
    
      transition.will_set_card_properties[0].name.should_equal('Status');
      transition.will_set_card_properties[0].value.should_equal("Accepted");
      transition.will_set_card_properties[0].type_description.should_equal("Managed text list");
    
      transition.will_set_card_properties[1].name.should_equal('Owner');
      transition.will_set_card_properties[1].value.should_equal(null);
      transition.will_set_card_properties[1].type_description.should_equal("Automatically generated from the team list");
    end

    it 'not error out when there are no transitions for that card type'
      var workflow = new TransitionWorkflow;
      workflow.markup('cardTypeThatDoesNotExist', 'Status', getData('accepted_transition'), getData('property_definitions')).should_be_empty();
    end
    
    it 'generate workflow markup for card type and property definition'
      var workflow = new TransitionWorkflow;
      workflow.markup('Story', 'Status', getData('accepted_transition'), getData('property_definitions')).should_eql(["Ready for Signoff->Accepted: Accepted"]);
    end

    it 'filter transitions by card type'
      var workflow = new TransitionWorkflow;
      var transitions = workflow.parseTransitions(getData('transitions'));
      transitions.findByCardTypeName('Story').length.should_equal(12);
      transitions.findByCardTypeName(null).length.should_equal(0);
    end

    it 'filter transitions by card type should be caseinsensitive'
      var workflow = new TransitionWorkflow;
      var transitions = workflow.parseTransitions(getData('transitions'));
      transitions.findByCardTypeName('sTory').length.should_equal(12);
    end

    it 'filter transitions that modify a specific property definition'
      var workflow = new TransitionWorkflow;
      var transitions = workflow.parseTransitions(getData('transitions'));
      transitions.thatModifyPropertyDefinition('Status').length.should_equal(12);
    end

    it 'filter transitions by property definition & card type'
      var workflow = new TransitionWorkflow;
      var transitions = workflow.parseTransitions(getData('transitions'));
      transitions.findByCardTypeName('Story').thatModifyPropertyDefinition('Status').length.should_equal(12);
      transitions.thatModifyPropertyDefinition('Status').findByCardTypeName('Story').length.should_equal(12);
    end

    it 'filter property definitions by name'
      var workflow = new TransitionWorkflow;
      var property_definitions = workflow.parsePropertyDefinitions(getData('property_definitions'));
      property_definitions.findByName('Story').name.should_equal('Story');
      property_definitions.findByName('NotExist').should_be_null();
    end

    it 'property definition value position map'
      var workflow = new TransitionWorkflow;
      var property_definitions = workflow.parsePropertyDefinitions(getData('property_definitions'));
      var status = property_definitions.findByName('Status')
      var map = status.valuePositionMap();
      map.get('(any)').should_equal(-3);
      map.get('(set)').should_equal(-2);
      map.get(null).should_equal(-1);
      map.get('New').should_equal(1);
      map.get('Ready for Testing').should_equal(7);
    end

    it 'find the starting and ending transitions'
      var expected = [
        "New->Ready for Analysis: Add to Current Sprint",
        "New->Ready for Analysis: Add to Next Sprint",
        "Ready for Analysis->In Analysis: Start Analysis",
        "In Analysis->Ready for Development: Complete Analysis",
        "In Analysis->Accepted: Just Accepted",
        "Ready for Development->In Development: Start Development",
        "In Development->In BA Review: Complete Development",
        "In BA Review->Ready for Testing: Finish BA Review",
        "Ready for Testing->In Testing: Start Testing",
        "In Testing->Ready for Development: reopen for development",
        "In Testing->Ready for Signoff: Complete Testing",
        "Ready for Signoff->Accepted: Accepted"
      ]

      // var expected = ["New->Ready for Analysis: Add to Current Sprint", "New->Ready for Analysis: Add to Next Sprint"]
      var workflow = new TransitionWorkflow;
      var transitions = workflow.markup('Story', 'Status', getData('transitions'), getData('property_definitions'));
      transitions.length.should_eql(12);
      expected.each(function(a, index){
        transitions[index].should_eql(a);
      });
    end

    it 'find transitions by card type and property definition name should not be case sensitive'
      var workflow = new TransitionWorkflow;
      var transitions = workflow.markup('storY', 'statuS', getData('transitions'), getData('property_definitions'));
      transitions.length.should_eql(12);
    end

  end

  describe 'Transition'
    it 'as workflow markup'
      var workflow = new TransitionWorkflow;
      var transitions = workflow.parseTransitions(getData('accepted_transition'));
      transition = transitions[0];
      transition.asWorkflowMarkup('Status').should_equal("Ready for Signoff->Accepted: Accepted");
    end
  end
end
