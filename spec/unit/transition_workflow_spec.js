
describe 'TransitionWorkflow'
  describe '.findAllTransitions()'
    it 'find a transtion properties'
      var transitions = "<transitions type='array'><transition>" + acceptedTransition + "</transition></transitions>"
      var workflow = new TransitionWorkflow;
      var transitions = workflow.parseAllTransitions(toXmldomElement(transitions));
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
      // var expected = ["New->Ready for Analysis: Add to Current Sprint", "New->Ready for Analysis: Add to Next Sprint"]
      // expected.should_equal(transitions.collect(function(transition) {
      //   return transition.toWorkflow();
      // }));
    end
  end
  describe 'Transition'
    it 'as workflow markup'
      var transitions = "<transitions type='array'><transition>" + acceptedTransition + "</transition></transitions>"
      var workflow = new TransitionWorkflow;
      var transitions = workflow.parseAllTransitions(toXmldomElement(transitions));
      transition = transitions[0];
      transition.asWorkflowMarkup('Status').should_equal("Ready for Signoff->Accepted: Accepted");
    end
  end
end
