class MinglePluginTransitionWorkflow

  def initialize(parameters, project, current_user)
    @parameters = parameters
    @project = project
    @current_user = current_user
  end
    
  def execute
    html = <<-HTML

<div id="mingle_plugin_transition_workflow">
</div>

<script src="/plugin_assets/transition_workflow/javascripts/transition_workflow.js?1279240904" type="text/javascript"></script>
<script type="text/javascript">
//<![CDATA[
  document.observe("dom:loaded", function(e) {
    try {
      var facade = new MinglePluginTransitionWorkflowFacade();
      var card_type = #{@parameters['card-type'].inspect};
      var card_property = #{@parameters['card-property'].inspect};

      var markup = facade.createMarkup(card_type, card_property, '/api/v2/projects/#{@project.identifier}');
      var div = Builder.node('div', {className: 'wsd' , wsd_style: 'default'});
      var pre = Builder.node('pre', {style: 'display:none'});
      pre.innerHTML = markup.join("\\n");
      div.appendChild(pre);
      var script = Builder.node('script', {type: 'text/javascript', src: 'http://www.websequencediagrams.com/service.js'});
      div.appendChild(script);
      $("mingle_plugin_transition_workflow").appendChild(div);
    } catch (e) {
      console.log(e)
    }
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

