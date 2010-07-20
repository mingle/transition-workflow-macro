require "test/unit"
require 'ostruct'

require "mingle_plugin_transition_workflow"

class TestMinglePluginTransitionWorkflow < Test::Unit::TestCase
  PROJECT_STUB = OpenStruct.new(:identifier => 'project_identifier')
  def test_should_escape_title_parameter
    macro = MinglePluginTransitionWorkflow.new({'title' => '<h1>title</h1>'}, PROJECT_STUB)
    assert_match /&lt;h1&gt;title&lt;\/h1&gt;/, macro.execute
  end
  def test_should_escape_style_parameter
    macro = MinglePluginTransitionWorkflow.new({'style' => '<h1>title</h1>'}, PROJECT_STUB)
    assert_match /wsd_style: "default"/, macro.execute
  end
  def test_style_parameter
    macro = MinglePluginTransitionWorkflow.new({'style' => 'rose'}, PROJECT_STUB)
    assert_match /wsd_style: "rose"/, macro.execute
  end
end