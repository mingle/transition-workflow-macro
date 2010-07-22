describe 'MinglePluginTransitionWorkflow'
  before_each
    workflow = new MinglePluginTransitionWorkflowFacade;
    managedTextValues = ['New', 'Ready for Analysis', 'In Analysis', 'Ready for Development', 'In Development', 
                         'In BA Review', 'Ready for Testing', 'In Testing', 'Ready for Signoff', 'Accepted'];
  end

  after_each
    window.debug = false
  end

  describe '.createMarkup'

    it "should escape javascript injected via mingle xml"
      var managedValues = managedTextValues.concat(["\u003Cscript type=\"text/javascript\"\u003E alert('hi')\u003C/script\u003E"]);
      var expected = [
        'participant "New" as "New"',
        'participant "\u003Cscript type=\"text/javascript\"\u003E alert(\'hi\')\u003C/script\u003E" as "\u003Cscript type=\"text/javascript\"\u003E alert(\'hi\')\u003C/script\u003E"',
        '"New"->"\u003Cscript type=\"text/javascript\"\u003E alert(\'hi\')\u003C/script\u003E": get hacked'
      ];
      workflow.createMarkupAsync('Story', 'Status', managedValues, './data/xss_transition.xml', function(markup){
        markup.should_eql(expected);
      });
    end

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

    it 'generate workflow markup for card type and property definition'
      var expected = [parseTransitionMarkup("Ready for Signoff->Accepted: Accepted")];
      workflow.createTransitionWorkflow('Story', 'Status', managedTextValues, getData('accepted_transition'))._transitionMarkups().should_eql(expected);
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

    it 'find the starting and ending transitions'
      var expected = [
        '"New"->"Ready for Analysis": Add to Current Sprint',
        '"New"->"Ready for Analysis": Add to Next Sprint',
        '"Ready for Analysis"->"In Analysis": Start Analysis',
        '"In Analysis"->"Ready for Development": Complete Analysis',
        '"In Analysis"->"Accepted": Just Accepted',
        '"Ready for Development"->"In Development": Start Development',
        '"In Development"->"In BA Review": Complete Development',
        '"In BA Review"->"Ready for Testing": Finish BA Review',
        '"Ready for Testing"->"In Testing": Start Testing',
        '"In Testing"->"Ready for Development": reopen for development',
        '"In Testing"->"Ready for Signoff": Complete Testing',
        '"Ready for Signoff"->"Accepted": Accepted'
      ];

      var transitions = workflow.createTransitionWorkflow('Story', 'Status', managedTextValues, getData('transitions')).edges();
      transitions.length.should_eql(12);
      expected.each(function(a, index){
        transitions[index].should_eql(a);
      });
    end
    
    it 'should sort transition by from properties'
      var transitions = workflow.parseTransitions(getData('transitions_for_sorting_from_different_property_value'));
      var managedValues = ['(any)', '(set)', '(not set)', 'New', 'Closed']
      transitions.sortByPropertyDefinition('Status', managedValues).pluck('name').should_eql(['Close', 'Open']);
    end

    it 'should sort transition by to properties when from same property value'
      var transitions = workflow.parseTransitions(getData('transitions_for_sorting_from_same_property_value'));
      var managedValues = ['(any)', '(set)', '(not set)', 'New', 'Closed']
      transitions.sortByPropertyDefinition('Status', managedValues).pluck('name').should_eql(['New2NotSet', 'Close']);
    end

    it 'should sort transition by name when from and to are same property value'
      var transitions = workflow.parseTransitions(getData('transitions_for_sorting_same_from_and_to_property_value'));
      var managedValues = ['(any)', '(set)', '(not set)', 'New', 'Closed']
      transitions.sortByPropertyDefinition('Status', managedValues).pluck('name').should_eql(['Close1', 'Close3']);
    end

    it 'should sort transition for property values: (any) and (set)'
      var transitions = workflow.parseTransitions(getData('transitions_for_sorting_any_and_set'));
      transitions.length.should_eql(4);
      var managedValues = ['(any)', '(set)', '(not set)', 'New', 'Closed']
      transitions.sortByPropertyDefinition('Status', managedValues).pluck('name').should_eql(['any_to_not_set', 'any_to_new', 'set_to_not_set', 'not_set_to_new']);
    end

    it 'find transitions by card type and property definition name should not be case sensitive'
      var transitions = workflow.createTransitionWorkflow('story', 'statuS', managedTextValues, getData('transitions'))._transitionMarkups();
      transitions.length.should_eql(12);
    end

    it "should filter out participants that apply to the to or from transitions"
      var participants = workflow.createTransitionWorkflow('story', 'statuS', managedTextValues, getData("accepted_transition")).participants();
      var expected = ['Ready for Signoff', 'Accepted'];
      participants.should_eql(expected);
    end

    it "should not filter out not set transitions"
      var participants = workflow.createTransitionWorkflow('story', 'status', managedTextValues, getData("not_set_to_accepted_transition")).participants();
      participants.should_eql(['(not set)', 'Accepted']);
    end

    it 'as accepted transitions workflow markup with participants'
      var orderedMarkup = workflow.createTransitionWorkflow('Story', 'Status', managedTextValues, getData('accepted_transition')).markup();
      var expected = [
        'participant "Ready for Signoff" as "Ready for Signoff"',
        'participant "Accepted" as "Accepted"',
        '"Ready for Signoff"->"Accepted": Accepted'
      ];
      orderedMarkup.length.should_eql(expected.length);
      expected.each(function(a, index){
        orderedMarkup[index].should_eql(a);
      });
    end

    it 'as entire workflow markup with participants'
      var orderedMarkup = workflow.createTransitionWorkflow('Story', 'Status', managedTextValues, getData('transitions_for_sorting_any_and_set')).markup();
      var expected = [
        'participant "(any)" as "(any)"',
        'participant "(set)" as "(set)"',
        'participant "(not set)" as "(not set)"',
        'participant "New" as "New"',
        '"(any)"->"(not set)": any_to_not_set',
        '"(any)"->"New": any_to_new',
        '"(set)"->"(not set)": set_to_not_set',
        '"(not set)"->"New": not_set_to_new'
      ];
      orderedMarkup.should_eql(expected);
    end

    it 'should order more complex transitions correctly regardless of card type and card property casing'
      var orderedMarkup = workflow.createTransitionWorkflow('stORy', 'sTatUs', managedTextValues, getData('transitions_for_sorting_any_and_set')).markup();
      var expected = [
        'participant "(any)" as "(any)"',
        'participant "(set)" as "(set)"',
        'participant "(not set)" as "(not set)"',
        'participant "New" as "New"',
        '"(any)"->"(not set)": any_to_not_set',
        '"(any)"->"New": any_to_new',
        '"(set)"->"(not set)": set_to_not_set',
        '"(not set)"->"New": not_set_to_new'
      ];
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
      transition = transitions.detect(function(t) {
        return t.name == 'not_set_to_new';
      });

      transition.if_card_has_properties[0].value.should_eql('(not set)');
    end
  end

end
