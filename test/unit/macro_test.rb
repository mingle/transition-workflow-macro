require File.join(File.dirname(__FILE__), 'unit_test_helper')

class TestMinglePluginTransitionWorkflow < Test::Unit::TestCase
  IN_PROGRESS = OpenStruct.new(:display_value => 'In Progress')
  STATUS = OpenStruct.new(:type_description =>  Mingle::PropertyDefinition::MANAGED_TEXT_TYPE, :name => 'Status', :values => [IN_PROGRESS])
  MANAGED_NUMBERS = OpenStruct.new(:type_description =>  ::Mingle::PropertyDefinition::MANAGED_NUMBER_TYPE, :name => 'ManagedNumbers', :values => [])
  SPECIAL_STATUS = OpenStruct.new(:type_description =>  ::Mingle::PropertyDefinition::MANAGED_TEXT_TYPE, :name => 'SpecialStatus', :values => [])
  STORY_PROPERTY_DEFINITIONS = [STATUS, MANAGED_NUMBERS]
  PROJECT_PROPERTY_DEFINITIONS = [STATUS, MANAGED_NUMBERS, SPECIAL_STATUS]
  
  PROJECT_STUB = OpenStruct.new(
    :identifier           => 'project_identifier', 
    :property_definitions => PROJECT_PROPERTY_DEFINITIONS, 
    :card_types           => [OpenStruct.new(:name => 'Story', :property_definitions => STORY_PROPERTY_DEFINITIONS)])

  def test_should_escape_title_parameter
    macro = MinglePluginTransitionWorkflow.new({'card-type' => 'Story', 'property' => 'Status', 'title' => '<h1>title</h1>'}, PROJECT_STUB)
    assert_match /&lt;h1&gt;title&lt;\/h1&gt;/, macro.execute
  end

  def test_should_escape_managed_text_values
    hacked_display_value = OpenStruct.new(:display_value => '<script>alert(\'hacked\');</script>')
    hacked_status = OpenStruct.new(:type_description =>  Mingle::PropertyDefinition::MANAGED_TEXT_TYPE, :name => 'Status', :values => [hacked_display_value])
    hacked_project = OpenStruct.new(
    :identifier           => 'project_identifier', 
    :property_definitions => [hacked_status], 
    :card_types           => [OpenStruct.new(:name => 'Story', :property_definitions => [hacked_status])])
    macro = MinglePluginTransitionWorkflow.new({'card-type' => 'Story', 'property' => 'Status', 'title' => '<h1>title</h1>'}, hacked_project)
    assert_match "&lt;script&gt;alert('hacked');&lt;\/script&gt;", macro.execute
  end

  def test_should_escape_injected_markup_to_avoid_xss
    macro = MinglePluginTransitionWorkflow.new({'card-type' => '<script type="text/javascript">alert("hacked!");</script>', 'property' => "Status"}, PROJECT_STUB)
    assert_match "<b>&lt;script type=&quot;text/javascript&quot;&gt;alert(&quot;hacked!&quot;);&lt;/script&gt;</b>", macro.execute
  end

  def test_should_escape_style_parameter
    macro = MinglePluginTransitionWorkflow.new({'card-type' => 'Story', 'property' => 'Status', 'style' => '<h1>title</h1>'}, PROJECT_STUB)
    assert_match /wsd_style: "default"/, macro.execute
  end

  def test_style_parameter
    macro = MinglePluginTransitionWorkflow.new({'card-type' => 'Story', 'property' => 'Status', 'style' => 'rose'}, PROJECT_STUB)
    assert_match /wsd_style: "rose"/, macro.execute
  end

  def test_should_render_error_message_for_card_property_is_not_given
    macro = MinglePluginTransitionWorkflow.new({'card-type' => 'Story', 'property' => nil}, PROJECT_STUB)
    assert_match /Error while rendering transition-workflow: must specify property/, macro.execute
  end

  def test_should_render_error_message_for_card_property_is_empty
    macro = MinglePluginTransitionWorkflow.new({'card-type' => 'Story', 'property' => ""}, PROJECT_STUB)
    assert_match /Error while rendering transition-workflow: must specify property/, macro.execute
  end

  def test_should_render_error_message_for_card_property_does_not_exist
    macro = MinglePluginTransitionWorkflow.new({'card-type' => 'Story', 'property' => "doesNotExist"}, PROJECT_STUB)
    assert_match /Error while rendering transition-workflow: property <b>doesNotExist<\/b> does not exist/, macro.execute
  end

  def test_should_render_error_message_for_card_type_does_not_exist
    macro = MinglePluginTransitionWorkflow.new({'card-type' => 'DoesNotExist', 'property' => "Status"}, PROJECT_STUB)
    assert_match /card-type <b>DoesNotExist<\/b> does not exist/, macro.execute
  end

  def test_card_property_should_be_case_insensitive
    macro = MinglePluginTransitionWorkflow.new({'card-type' => 'Story', 'property' => "status"}, PROJECT_STUB)
    assert_match /Loading/, macro.execute
  end
  
  def test_should_not_render_h3_tags_if_no_title_specified
    macro = MinglePluginTransitionWorkflow.new({'card-type' => 'Story', 'property' => "status"}, PROJECT_STUB)
    assert_no_match Regexp.new("<h3>"), macro.execute
  end

  def test_card_type_should_be_case_insensitive
    macro = MinglePluginTransitionWorkflow.new({'card-type' => 'story', 'property' => "status"}, PROJECT_STUB)
    assert_match /Loading/, macro.execute
  end

  def test_should_render_error_message_for_card_type_is_empty
    macro = MinglePluginTransitionWorkflow.new({'card-type' => '', 'property' => "status"}, PROJECT_STUB)
    assert_match /Error while rendering transition-workflow: must specify card-type/, macro.execute
  end

  def test_should_render_error_message_if_property_definition_is_not_a_managed_text_list
    macro = MinglePluginTransitionWorkflow.new({'card-type' => 'story', 'property' => "ManagedNumbers"}, PROJECT_STUB)
    assert_match /Error while rendering transition-workflow: property <b>ManagedNumbers<\/b> is not a managed text list/, macro.execute
  end

  def test_should_require_property_type_that_applies_to_card_type
    macro = MinglePluginTransitionWorkflow.new({'card-type' => 'STORY', 'property' => "SpecialStatus"}, PROJECT_STUB)
    assert_match /Error while rendering transition-workflow: card-type <b>STORY<\/b> does not have a <b>SpecialStatus<\/b> property/, macro.execute
  end
  
  def test_should_use_display_values_for_card_property_in_sequence_edges
    macro = MinglePluginTransitionWorkflow.new({'card-type' => 'story', 'property' => "status"}, PROJECT_STUB)
    assert_match %(["In Progress"]), macro.execute
  end

end
