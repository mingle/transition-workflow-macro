# Copyright 2010 ThoughtWorks, Inc.  All rights reserved.
namespace :macro do |ns|
  
  desc "Deploy the Transition Workflow Macro"
  task :deploy do
    macro_folder = File.expand_path(File.join(File.dirname(__FILE__), '..'))
    mingle_plugins_folder = File.join(ENV['MINGLE_LOCATION'], 'vendor', 'plugins')
    FileUtils.cp_r(macro_folder, mingle_plugins_folder)
    puts "#{macro_folder} successfully copied over to #{mingle_plugins_folder}. Restart the Mingle server to start using the macro."
  end

end