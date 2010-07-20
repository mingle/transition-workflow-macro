describe 'MinglePluginTransitionWorkflow'
  before_each
    workflow = new MinglePluginTransitionWorkflowFacade;
  end

  after_each
    window.debug = false
  end

  describe '.createMarkup'

    it 'load transitions from data file'
      var transitions = workflow.parseTransitions(getData('transitions'));
      transitions.length.should_equal(16);
    end
    
    it 'find a transtion properties'
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
      transition.will_set_card_properties[1].value.should_equal('(not set)');
      transition.will_set_card_properties[1].type_description.should_equal("Automatically generated from the team list");
    end

    it 'not error out when there are no transitions for that card type'
      workflow.createTransitionWorkflow('cardTypeThatDoesNotExist', 'Status', getData('accepted_transition'), getData('property_definitions')).transitionMarkups().should_be_empty();
    end
    
    it 'generate workflow markup for card type and property definition'
      var expected = [parseTransitionMarkup("Ready for Signoff->Accepted: Accepted")];
      workflow.createTransitionWorkflow('Story', 'Status', getData('accepted_transition'), getData('property_definitions')).transitionMarkups().should_eql(expected);
    end

    it 'filter transitions by card type'
      var transitions = workflow.parseTransitions(getData('transitions'));
      transitions.findByCardTypeName('Story').length.should_equal(12);
      transitions.findByCardTypeName(null).length.should_equal(0);
    end

    it 'filter transitions by card type should be caseinsensitive'
      var transitions = workflow.parseTransitions(getData('transitions'));
      transitions.findByCardTypeName('sTory').length.should_equal(12);
    end

    it 'filter transitions that modify a specific property definition'
      var transitions = workflow.parseTransitions(getData('transitions'));
      transitions.thatModifyPropertyDefinition('Status').length.should_equal(12);
    end

    it 'filter transitions by property definition & card type'
      var transitions = workflow.parseTransitions(getData('transitions'));
      transitions.findByCardTypeName('Story').thatModifyPropertyDefinition('Status').length.should_equal(12);
      transitions.thatModifyPropertyDefinition('Status').findByCardTypeName('Story').length.should_equal(12);
    end

    it 'filter property definitions by name'
      var property_definitions = workflow.parsePropertyDefinitions(getData('property_definitions'));
      property_definitions.findByName('Story').name.should_equal('Story');
      property_definitions.findByName('NotExist').should_be_null();
    end

    it 'property definition value position map'
      var property_definitions = workflow.parsePropertyDefinitions(getData('property_definitions'));
      var status = property_definitions.findByName('Status')
      var map = status.valuePositionMap();
      map.get('(any)').should_equal(0);
      map.get('(set)').should_equal(1);
      map.get('(not set)').should_equal(2);
      map.get('New').should_equal(3);
      map.get('Ready for Testing').should_equal(9);
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
      ].collect(function(markup) {
        return parseTransitionMarkup(markup);
      })

      // var expected = ["New->Ready for Analysis: Add to Current Sprint", "New->Ready for Analysis: Add to Next Sprint"]
      var transitions = workflow.createTransitionWorkflow('Story', 'Status', getData('transitions'), getData('property_definitions')).transitionMarkups();
      transitions.length.should_eql(12);
      expected.each(function(a, index){
        transitions[index].should_eql(a);
      });
    end
    
    it 'should sort transition by from properties'
      var transitions = workflow.parseTransitions(getData('transitions_for_sorting_from_different_property_value'));
      var status = statusPropertyDefintionStub();

      transitions.sortByPropertyDefinition(status).pluck('name').should_eql(['Close', 'Open']);
    end

    it 'should sort transition by to properties when from same property value'
      var transitions = workflow.parseTransitions(getData('transitions_for_sorting_from_same_property_value'));
      var status = statusPropertyDefintionStub();
      transitions.sortByPropertyDefinition(status).pluck('name').should_eql(['New2NotSet', 'Close']);
    end

    it 'should sort transition by name when from and to are same property value'
      var transitions = workflow.parseTransitions(getData('transitions_for_sorting_same_from_and_to_property_value'));
      var status = statusPropertyDefintionStub();
      transitions.sortByPropertyDefinition(status).pluck('name').should_eql(['Close1', 'Close3']);
    end

    it 'should sort transition for property values: (any) and (set)'
      var transitions = workflow.parseTransitions(getData('transitions_for_sorting_any_and_set'));
      transitions.length.should_eql(4);
      var status = statusPropertyDefintionStub();
      transitions.sortByPropertyDefinition(status).pluck('name').should_eql(['any_to_not_set', 'any_to_new', 'set_to_not_set', 'not_set_to_new']);
    end

    it 'find transitions by card type and property definition name should not be case sensitive'
      var transitions = workflow.createTransitionWorkflow('storY', 'statuS', getData('transitions'), getData('property_definitions')).transitionMarkups();
      transitions.length.should_eql(12);
    end

    it "should filter out participants that apply to the to or from transitions"
      var property_definitions = workflow.parsePropertyDefinitions(getData('property_definitions'));
      var transitions = [parseTransitionMarkup("Ready for Signoff->Accepted: Accepted")];
      var participants = property_definitions.findByName("Status").participantsFor(transitions);
      var expected = ['Ready for Signoff', 'Accepted'];
      participants.pluck('name').should_eql(expected);
    end

    it "should not filter out not set transitions"
      var property_definitions = workflow.parsePropertyDefinitions(getData('property_definitions'));
      var transitions = [{from: '(not set)', to: "Accepted", name: "Accept"}];
      var participants = property_definitions.findByName("Status").participantsFor(transitions);
      participants.pluck('name').should_eql(['(not set)', 'Accepted']);
      participants.pluck("alias").should_eql(['(not_set)', 'Accepted']);
    end

    it "participant should have markup"
      var property_definitions = workflow.parsePropertyDefinitions(getData('property_definitions'));
      var transitions = [parseTransitionMarkup("Ready for Signoff->Accepted: Accepted")];
      var participants = property_definitions.findByName("Status").participantsFor(transitions);
      var expected = ['participant "Ready for Signoff" as Ready_for_Signoff', 'participant Accepted'];
      participants.pluck("markup").should_eql(expected);
    end

    it 'as accepted transitions workflow markup with participants'
      var orderedMarkup = workflow.createTransitionWorkflow('Story', 'Status', getData('accepted_transition'), getData('property_definitions')).markup();
      var expected = [
        "participant \"Ready for Signoff\" as Ready_for_Signoff",
        "participant Accepted",
        "Ready_for_Signoff->Accepted: Accepted",
      ]
      orderedMarkup.length.should_eql(expected.length);
      expected.each(function(a, index){
        orderedMarkup[index].should_eql(a);
      });
    end

    it 'as entire workflow markup with participants'
      var orderedMarkup = workflow.createTransitionWorkflow('Story', 'Status', getData('transitions_for_sorting_any_and_set'), getData('property_definitions')).markup();
      var expected = [
        "participant (any)",
        "participant (set)",
        "participant \"(not set)\" as (not_set)",
        "participant New",
        "(any)->(not_set): any_to_not_set",
        "(any)->New: any_to_new",
        "(set)->(not_set): set_to_not_set",
        "(not_set)->New: not_set_to_new"
      ]
      orderedMarkup.should_eql(expected);
    end
  end
  
  describe 'Transition'
    it 'as workflowMarkup'
      var transitions = workflow.parseTransitions(getData('accepted_transition'));
      transition = transitions[0];
      var expected = parseTransitionMarkup("Ready for Signoff->Accepted: Accepted")
      transition.asWorkflowMarkup('Status').should_eql(expected);
    end
  end

  describe 'XmlUtils.elementToObject'
    it 'should parse property value null to (not set)'
      var transitions = workflow.parseTransitions(getData('transitions_for_sorting_any_and_set'));
      var property_definitions = workflow.parsePropertyDefinitions(getData('property_definitions'));

      transition = transitions.detect(function(t) {
        return t.name == 'not_set_to_new';
      });

      transition.if_card_has_properties[0].value.should_eql('(not set)');

      property_definitions.findByName('Date Accepted').description.should_eql(null);
    end
  end

  describe 'Validation'
    it 'should raise error when card property name does not exist'
      -{ workflow.createTransitionWorkflow('Story', 'StatusNotExists', getData('transitions'), getData('property_definitions')).markup() }.should.throw_error(/property name: StatusNotExists does not exist/)
    end

    it 'should raise error when card type does not exist'
      -{ workflow.createTransitionWorkflow('storyThatDoesNotExist', 'Status', getData('transitions'), getData('property_definitions')).markup() }.should.throw_error(/card type: storyThatDoesNotExist does not exist/)
    end
    
    it 'should raise error when card type does not exist'
      -{ workflow.createTransitionWorkflow('story', 'Date Accepted', getData('transitions'), getData('property_definitions')).markup() }.should.throw_error(/Date Accepted is not a Managed text list and cannot be graphed in a workflow diagram/)
    end
  end
end
