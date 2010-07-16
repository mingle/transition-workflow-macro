class MinglePluginTransitionWorkflow

  def initialize(parameters, project, current_user)
    @parameters = parameters
    @project = project
    @current_user = current_user
  end
    
  def execute
    html = <<-HTML

<script src="/plugin_assets/transition_workflow/javascripts/transition_workflow.js?1279240904" type="text/javascript"></script>

<div id="mingle_plugin_transition_workflow">
  loading data...
</div>
<script type="text/javascript">
//<![CDATA[
  document.observe('dom:loaded', function(e) {
    var facade = new MinglePluginTransitionWorkflowFacade();
    var card_type = #{@parameters['card-type'].inspect};
    var card_property = #{@parameters['card-property'].inspect};
    var a = {
      setTransitions: function(t) {
        this.transitions = t;
        if (this.property_definitions) {
          this.render();
        }
      },
      setPropertyDefinitions: function(t) {
        this.property_definitions = t;
      },
    }
    new Ajax.Request('/api/v2/projects/#{@project.identifier}/transitions.xml', {method: 'get', onSuccess: function(response) {
      var transitions = facade.parseTransitions(response.responseText);
    }});
    new Ajax.Request('/api/v2/projects/#{@project.identifier}/property_definitions.xml', {method: 'get', onSuccess: function(response2) {
      var property_definitions = facade.parsePropertyDefinitions(response.responseText);
    }});

    // var markup = facade.markup(card_type, card_property, transitions, property_definitions);
    // 
    // new Ajax.Request('http://www.websequencediagrams.com/index.php', {method: 'get', parameters: {message: markup}, onSuccess: function(response) {
    //   var image = response.responseText.gsub(/img: "(.+)"/, "<img src='http://www.websequencediagrams.com/\#{1}'/>");
    //   $('mingle_plugin_transition_workflow').innerHTML = image;
    // }});
  })
//]]>
</script>
HTML
    html.no_textile
  end
  
  def can_be_cached?
    false  # if appropriate, switch to true once you move your macro to production
  end
    
end

