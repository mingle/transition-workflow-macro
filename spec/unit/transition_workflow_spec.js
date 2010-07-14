
describe 'TransitionWorkflow'
  describe '.findAllTransitions()'
    it 'find all transtions'
      var transitions = "<transitions><transition>" + acceptedTransition + "</transition></transitions>"
      var workflow = new TransitionWorkflow;
      ['Accepted'].should_equal(workflow.parseAllTransitions(toXmldomElement(transitions)));
    end
  end
end
