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

  attr_accessor :errors

  def initialize(parameters, project, current_user=nil)
    @parameters = parameters
    @project = project
    @title = @parameters['title'].to_s.strip
    @style = @parameters['style'].to_s.strip.downcase
    @style = STYLES.include?(@style) ? @style : 'default'
    @card_property = @parameters['card-property']
    @card_type = @parameters['card-type']
  end

  def valid?
    @errors = []
    validate
    return @errors.empty?
  end

  def validate

    if @card_property.blank?
      errors << "must specify card-property"
    else
      if (property_definition = @project.property_definitions.detect { |pd| pd.name.downcase == @card_property.downcase }).nil?
        errors << "card-property #{@card_property} does not exist"
      elsif property_definition.type_description != Mingle::PropertyDefinition::MANAGED_TEXT_TYPE
        errors << "card-property #{@card_property} is not a managed text list"
      end
    end

    if @card_type.blank?
      errors << "must specify card-type"
    else
      if (card_type = @project.card_types.detect { |ct| ct.name.downcase == @card_type.downcase}).nil?
        errors << "card-type #{@card_type} does not exist"
      elsif !card_type.property_definitions.any? { |pd| pd.name.downcase == @card_property.to_s.downcase }
        errors << "card-type #{@card_type} does not have a #{@card_property} card-property"
      end
    end
  end

  def execute
    begin
      unless valid?
        return "Error while rendering transition-workflow: #{errors.join(", ")}"
      end
      container_id = "mingle_plugin_transition_workflow#{rand(10000)}"
      html = <<-HTML
  <h3>#{ERB::Util.h(@title)}</h3>
  <div id="#{container_id}" style="width: 100%; overflow: auto">
    <div class="loading">Loading...&nbsp;<img src="/images/spinner.gif"/></div>
  </div>

  <script src="/plugin_assets/transition_workflow/javascripts/transition_workflow.js?1279240904" type="text/javascript"></script>
  <script type="text/javascript">
  //<![CDATA[
    document.observe("dom:loaded", function(e) {
      var facade = new MinglePluginTransitionWorkflowFacade();
      var card_type = #{@card_type.inspect};
      var card_property = #{@card_property.inspect};
      var managed_text_values = []; 
      facade.createMarkupAsync(card_type, card_property, managed_text_values, '/api/v2/projects/#{@project.identifier}', function(markup) {
        var div = new Element('div', {className: 'wsd' , wsd_style: #{@style.inspect}});
        var pre = new Element('pre', {style: 'display:none'});
        pre.innerHTML = markup.join("\\n");
        div.appendChild(pre);
        var script = new Element('script', {type: 'text/javascript', src: 'http://www.websequencediagrams.com/service.js'});
        div.appendChild(script);
        $("#{container_id}").down(".loading").remove();
        $("#{container_id}").appendChild(div);
      }, function(e) {
        $("#{container_id}").childElements()[0].innerHTML = "Error while rendering transition workflow: " + e.message;
      });
    })
  //]]>

  </script>
  HTML
      "<notextile>#{html}</notextile>"
    rescue Exception => ex
      ex.backtrace.join("\n")
    end
  end
  
  def can_be_cached?
    false  # if appropriate, switch to true once you move your macro to production
  end
    
end

