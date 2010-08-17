# Copyright 2010 ThoughtWorks, Inc.  All rights reserved.
%w[rubygems rake rake/clean rake/testtask fileutils macro_development_toolkit].each { |f| require f }

Dir['tasks/**/*.rake'].each { |t| load t }

desc "Runs all units and integration tests"
task :test => ['test:units', 'test:javascripts']


require 'rake/packagetask'

Rake::PackageTask.new("transition_workflow", "1.0.0") do |p|
  p.need_tar = true
  p.package_files.include("*")
end

