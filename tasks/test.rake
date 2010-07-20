namespace :test do

  Rake::TestTask.new(:units) do |t|
    t.libs << "test/unit"
    t.pattern = 'test/*_test.rb'
    t.verbose = true
  end

  task :javascripts do
    %x[jspec run]
  end
end

