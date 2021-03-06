# Copyright 2010 ThoughtWorks, Inc.  All rights reserved.
begin
  require 'macro_development_toolkit'
rescue LoadError
  require 'rubygems'
  require 'macro_development_toolkit'
end

require 'erb'

if defined?(RAILS_ENV) && RAILS_ENV == 'production' && defined?(MinglePlugins)
  require File.join(File.dirname(__FILE__), 'lib', 'mingle_plugin_transition_workflow')
  MinglePlugins::Macros.register(MinglePluginTransitionWorkflow, 'transition-workflow')
end 
