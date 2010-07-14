require 'rubygems'
require 'pp'
require 'active_resource'

class Transition < ActiveResource::Base
  format = :xml
end
class PropertyDefinition < ActiveResource::Base
  format = :xml
end

def resource(klass)
  klass.site = File.join('http://localhost:4001', 'api', 'v2', 'projects', 'abc123')
  klass.user = 'xli'
  klass.password = 'a'
  klass
end

def project_api
  File.join()
end


transition =  resource(Transition)
prop_def =  resource(PropertyDefinition)

transitions = transition.find(:all).select {|t| t.card_type.name.downcase == 'story'}.select {|t| t.will_set_card_properties.any?{|property| property.name.downcase == 'status'} && t.if_card_has_properties.any?{|property| property.name.downcase == 'status'}}

status = prop_def.find(:all).detect{|pd| pd.name.downcase == 'status'}
# validate "property_values_description"=>"Managed text list",

status.property_value_details.collect(&:value).each do |prop_value|
  puts prop_value
  pv_transitions = transitions.select {|t| t.if_card_has_properties.any? {|property| property.name.downcase == 'status' && property.value == prop_value}}
  pv_transitions = pv_transitions.sort_by do |t|
    property = t.will_set_card_properties.detect {|property| property.name.downcase == 'status' }
    property_value = status.property_value_details.detect {|pv| pv.value == property.value}
    property_value.position
  end
  pv_transitions.each do |t|
    puts "  #{t.name}: #{t.if_card_has_properties.detect {|property| property.name.downcase == 'status'}.value} => #{t.will_set_card_properties.detect {|property| property.name.downcase == 'status'}.value}"
  end
end


# a prop_value, find all transitions (if card has property status and value is prop_value), sort as set will_set_card_properties
