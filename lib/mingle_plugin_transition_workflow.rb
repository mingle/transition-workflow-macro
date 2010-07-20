require 'erb'
class MinglePluginTransitionWorkflow
  STYLES = [
    'default',
    'earth',
    'modern-blue',
    'mscgen',
    'omegapple',
    'qsd',
    'rose',
    'roundgreen',
    'napkin'
  ]

  def initialize(parameters, project, current_user=nil)
    @parameters = parameters
    @project = project
    @title = @parameters['title'].to_s.strip
    @style = @parameters['style'].to_s.strip.downcase
    @style = STYLES.include?(@style) ? @style : 'default'
  end
    
  def execute
    container_id = "mingle_plugin_transition_workflow#{rand(10000)}"
    html = <<-HTML
<h3>#{ERB::Util.h(@title)}</h3>
<div id="#{container_id}" style="width: 100%; overflow: auto">
  <div>Loading...&nbsp;<img src="/images/spinner.gif"/></div>
</div>

<script src="/plugin_assets/transition_workflow/javascripts/transition_workflow.js?1279240904" type="text/javascript"></script>
<script type="text/javascript">
//<![CDATA[
  document.observe("dom:loaded", function(e) {
    var facade = new MinglePluginTransitionWorkflowFacade();
    var card_type = #{@parameters['card-type'].inspect};
    var card_property = #{@parameters['card-property'].inspect};

    facade.createMarkupAsync(card_type, card_property, '/api/v2/projects/#{@project.identifier}', function(markup) {
      var div = Builder.node('div', {className: 'wsd' , wsd_style: #{@style.inspect}});
      var pre = Builder.node('pre', {style: 'display:none'});
      pre.innerHTML = markup.join("\\n");
      div.appendChild(pre);
      var script = Builder.node('script', {type: 'text/javascript', src: 'http://www.websequencediagrams.com/service.js'});
      div.appendChild(script);
      $("#{container_id}").removeChild($("#{container_id}").childElements()[0]);
      $("#{container_id}").appendChild(div);
    });
  })
//]]>

</script>
HTML
    "<notextile>#{html}</notextile>"
  end
  
  def can_be_cached?
    false  # if appropriate, switch to true once you move your macro to production
  end
    
end

