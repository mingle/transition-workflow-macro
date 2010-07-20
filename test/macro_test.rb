require "test/unit"
require 'ostruct'
require 'rubygems'
require 'active_support'

require "mingle_plugin_transition_workflow"

class TestMinglePluginTransitionWorkflow < Test::Unit::TestCase
  PROJECT_STUB = OpenStruct.new(:identifier => 'project_identifier', :property_definitions => [OpenStruct.new(:name => 'Status')], :card_types => [OpenStruct.new(:name => 'Story')])

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
    macro = MinglePluginTransitionWorkflow.new({'card-type' => 'Story', 'card-property' => "something"}, PROJECT_STUB)
    assert_match /Error while rendering transition-workflow: card-property something does not exist/, macro.execute
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

end