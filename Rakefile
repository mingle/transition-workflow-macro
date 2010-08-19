# Copyright 2010 ThoughtWorks, Inc.  All rights reserved.
%w[rubygems rake rake/clean rake/testtask fileutils macro_development_toolkit].each { |f| require f }

Dir['tasks/**/*.rake'].each { |t| load t }

desc "Runs all units and integration tests"
task :test => ['test:units', 'test:javascripts']

require 'rake/packagetask'

Rake::PackageTask.new("transition_workflow", :noversion) do |p|
  p.name = "transition_workflow"
  p.need_zip = true
  p.package_files.include("lib/**/*", "assets/**/*", "spec/**/*", "test/**/*", "*", "tasks/*")
end
