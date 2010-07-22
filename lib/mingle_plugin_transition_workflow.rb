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
  
  def property_definition_from_project
    @project.property_definitions.detect { |pd| pd.name.downcase == @card_property.downcase }
  end

  def card_type_from_project
    @project.card_types.detect { |ct| ct.name.downcase == @card_type.downcase}
  end

  def property_definition_from_card_type
    card_type_from_project.property_definitions.detect { |pd| pd.name.downcase == @card_property.to_s.downcase }
  end
 
  def validate

    if @card_property.blank?
      errors << "must specify card-property"
    else
      if (property_definition = property_definition_from_project).nil?
        errors << "card-property #{bold(@card_property)} does not exist"
      elsif property_definition.type_description != Mingle::PropertyDefinition::MANAGED_TEXT_TYPE
        errors << "card-property #{bold(@card_property)} is not a managed text list"
      end
    end

    if @card_type.blank?
      errors << "must specify card-type"
    else
      if (card_type = card_type_from_project).nil?
        errors << "card-type #{bold(@card_type)} does not exist"
      elsif property_definition_from_card_type.nil?
        errors << "card-type #{bold(@card_type)} does not have a #{bold(@card_property)} card-property"
      end
    end
  end

  def execute
    unless valid?
      return "Error while rendering transition-workflow: #{errors.join(", ")}"
    end
    managed_text_values = property_definition_from_card_type.values.map(&:display_value)
    container_id = "mingle_plugin_transition_workflow#{rand(10000)}"
    html = <<-HTML
      #{header_tag if @title.present?}
      <div id="#{container_id}" style="width: 100%; overflow: auto">
        <div class="loading">Loading...&nbsp;<img src="/images/spinner.gif"/></div>
      </div>

      <script src="/plugin_assets/transition_workflow/javascripts/transition_workflow.js?1279240904" type="text/javascript"></script>
      <script type="text/javascript">
      //<![CDATA[
        document.observe("dom:loaded", function(e) {
          var facade = new MinglePluginTransitionWorkflowFacade();
          var card_type = #{@card_type.to_json};
          var card_property = #{@card_property.to_json};
          var managed_text_values = [#{managed_text_values.map{|mv| ERB::Util.h(mv).inspect }.join(",")}]; 
          facade.createMarkupAsync(card_type, card_property, managed_text_values, '/api/v2/projects/#{@project.identifier}/transitions.xml', function(markup) {
            var div = new Element('div', {className: 'wsd' , wsd_style: #{@style.to_json}});
            var pre = new Element('pre', {style: 'display:none;'});
            pre.innerHTML = markup.join("\\n");
            div.appendChild(pre);
            // var script = new Element('script', {type: 'text/javascript', src: 'http://www.websequencediagrams.com/service.js'});
            // div.appendChild(script);
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
  end
  
  def can_be_cached?
    false  # if appropriate, switch to true once you move your macro to production
  end

  protected
  def bold(value)
    "<b>#{ERB::Util.h(value)}</b>"
  end
  
  def header_tag
    "<h3>" + ERB::Util.h(@title) + "</h3>"
  end
end

