
describe 'TransitionWorkflow'
  describe '.findAllTransitions()'
    it 'find a transtion properties'
      var transitions = "<transitions type='array'><transition>" + acceptedTransition + "</transition></transitions>"
      var workflow = new TransitionWorkflow;
      var transitions = workflow.parseAllTransitions(toXmldomElement(transitions));
      1.should_equal(transitions.length);

      transition = transitions[0];

      "Accepted".should_equal(transition.name);
      "Story".should_equal(transition.card_type.name);

      "Status".should_equal(transition.if_card_has_properties[0].name);
      "Ready for Signoff".should_equal(transition.if_card_has_properties[0].value);
      "Managed text list".should_equal(transition.if_card_has_properties[0].type_description);

      "Status".should_equal(transition.will_set_card_properties[0].name);
      "Accepted".should_equal(transition.will_set_card_properties[0].value);
      "Managed text list".should_equal(transition.will_set_card_properties[0].type_description);

      "Owner".should_equal(transition.will_set_card_properties[1].name);
      null.should_equal(transition.will_set_card_properties[1].value);
      "Automatically generated from the team list".should_equal(transition.will_set_card_properties[1].type_description);
    end
  end
end
