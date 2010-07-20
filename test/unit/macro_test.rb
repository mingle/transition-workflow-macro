require File.join(File.dirname(__FILE__), 'unit_test_helper')

class TestMinglePluginTransitionWorkflow < Test::Unit::TestCase
  PROJECT_STUB = OpenStruct.new(:identifier => 'project_identifier', 
    :property_definitions => [OpenStruct.new(:type_description =>  Mingle::PropertyDefinition::MANAGED_TEXT_TYPE, :name => 'Status'),
      OpenStruct.new(:type_description =>  ::Mingle::PropertyDefinition::MANAGED_NUMBER_TYPE, :name => 'ManagedNumbers')], 
    :card_types => [OpenStruct.new(:name => 'Story')])

  def test_should_escape_title_parameter
    macro = MinglePluginTransitionWorkflow.new({'card-type' => 'Story', 'card-property' => 'Status', 'title' => '<h1>title</h1>'}, PROJECT_STUB)
    assert_match /&lt;h1&gt;title&lt;\/h1&gt;/, macro.execute
  end
  def test_should_escape_style_parameter
    macro = MinglePluginTransitionWorkflow.new({'card-type' => 'Story', 'card-property' => 'Status', 'style' => '<h1>title</h1>'}, PROJECT_STUB)
    assert_match /wsd_style: "default"/, macro.execute
  end
  def test_style_parameter
    macro = MinglePluginTransitionWorkflow.new({'card-type' => 'Story', 'card-property' => 'Status', 'style' => 'rose'}, PROJECT_STUB)
    assert_match /wsd_style: "rose"/, macro.execute
  end
  def test_should_render_error_message_for_card_property_is_not_given
    macro = MinglePluginTransitionWorkflow.new({'card-type' => 'Story', 'card-property' => nil}, PROJECT_STUB)
    assert_match /Error while rendering transition-workflow: must specify card-property/, macro.execute
  end

  def test_should_render_error_message_for_card_property_is_empty
    macro = MinglePluginTransitionWorkflow.new({'card-type' => 'Story', 'card-property' => ""}, PROJECT_STUB)
    assert_match /Error while rendering transition-workflow: must specify card-property/, macro.execute
  end

  def test_should_render_error_message_for_card_property_does_not_exist
    macro = MinglePluginTransitionWorkflow.new({'card-type' => 'Story', 'card-property' => "doesNotExist"}, PROJECT_STUB)
    assert_match /Error while rendering transition-workflow: card-property doesNotExist does not exist/, macro.execute
  end

  def test_should_render_error_message_for_card_type_does_not_exist
    macro = MinglePluginTransitionWorkflow.new({'card-type' => 'DoesNotExist', 'card-property' => "Status"}, PROJECT_STUB)
    assert_match /card-type DoesNotExist does not exist/, macro.execute
  end

  def test_card_property_should_be_case_insensitive
    macro = MinglePluginTransitionWorkflow.new({'card-type' => 'Story', 'card-property' => "status"}, PROJECT_STUB)
    assert_match /Loading/, macro.execute
  end

  def test_card_type_should_be_case_insensitive
    macro = MinglePluginTransitionWorkflow.new({'card-type' => 'story', 'card-property' => "status"}, PROJECT_STUB)
    assert_match /Loading/, macro.execute
  end

  def test_should_render_error_message_for_card_type_is_empty
    macro = MinglePluginTransitionWorkflow.new({'card-type' => '', 'card-property' => "status"}, PROJECT_STUB)
    assert_match /Error while rendering transition-workflow: must specify card-type/, macro.execute
  end

  def test_should_render_error_message_if_property_definition_is_not_a_managed_text_list
    macro = MinglePluginTransitionWorkflow.new({'card-type' => 'story', 'card-property' => "ManagedNumbers"}, PROJECT_STUB)
    assert_match /Error while rendering transition-workflow: card-property ManagedNumbers is not a managed text list/, macro.execute
  end

end
