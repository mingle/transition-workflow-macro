
describe 'TransitionWorkflow'
  describe '.findAllTransitions()'
    it 'load transitions from data file'
      var workflow = new TransitionWorkflow;
      var path = './data/transitions.xml';
      var request = new Ajax.Request(path, {method: 'get', asynchronous: false});
      var transitions = workflow.parseAllTransitions(request.transport.responseText);
      transitions.length.should_equal(16);
    end

    it 'find a transtion properties'
      var workflow = new TransitionWorkflow;
      var path = './data/accepted_transition.xml';
      var request = new Ajax.Request(path, {method: 'get', asynchronous: false});
      var transitions = workflow.parseAllTransitions(request.transport.responseText);
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
    
    it 'find the starting and ending transitions'
      // ["New->Ready for Analysis: Add to Current Sprint",
      // "New->Ready for Analysis: Add to Next Sprint",
      // "Ready for Analysis->In Analysis: Start Analysis",
      // "In Analysis->Ready for Development: Complete Analysis",
      // "In Analysis->Accepted: Just Accepted",
      // "Ready for Development->In Development: Start Development",
      // "In Development->In BA Review: Complete Development",
      // "In BA Review->Ready for Testing: Finish BA Review",
      // "Ready for Testing->In Testing: Start Testing",
      // "In Testing->Ready for Development: reopen for development",
      // "In Testing->Ready for Signoff: Complete Testing",
      // "Ready for Signoff->Accepted: Accepted"]
      // 
      // var expected = ["New->Ready for Analysis: Add to Current Sprint", "New->Ready for Analysis: Add to Next Sprint"]
      // transitions.collect(function(transition) {
      //   return transition.asWorkflowMarkup('Status');
      // }).should_equal(expected);
    end
  end

  describe 'Transition'
    it 'as workflow markup'
      var workflow = new TransitionWorkflow;
      var path = './data/accepted_transition.xml';
      var request = new Ajax.Request(path, {method: 'get', asynchronous: false});
      var transitions = workflow.parseAllTransitions(request.transport.responseText);
      transition = transitions[0];
      transition.asWorkflowMarkup('Status').should_equal("Ready for Signoff->Accepted: Accepted");
    end
  end
end
