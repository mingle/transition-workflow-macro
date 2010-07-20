require 'test/unit'
require File.join(File.dirname(__FILE__), '..', '..', 'init.rb')
require File.join(File.dirname(__FILE__), '..', '..', 'lib', 'mingle_plugin_transition_workflow')

class Test::Unit::TestCase
  
  def project(name)
    @project ||= load_project_fixture(name)
  end
  
  def projects(*names)
    @projects ||= names.map { |name| load_project_fixture(name) }
  end
  
  private
  
  def load_project_fixture(name)
    FixtureLoaders::ProjectLoader.new(name).project
  end
   
end