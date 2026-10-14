-- Baseline Reference Assumptions for Sustainable Event Planning
-- Populates the global assumptions table for Food, Waste, and Catering benchmarks.

INSERT INTO assumptions (event_id, category, parameter, value, unit, source_type, description, reference_notes)
VALUES
    -- Food Participation Rates
    (NULL, 'FOOD', 'meal_participation_rate_breakfast', '0.85', 'ratio', 'REFERENCE', 'Expected breakfast attendance ratio', 'Campus survey benchmark'),
    (NULL, 'FOOD', 'meal_participation_rate_lunch', '0.90', 'ratio', 'REFERENCE', 'Expected lunch attendance ratio', 'Standard college fest catering rate'),
    (NULL, 'FOOD', 'meal_participation_rate_dinner', '0.80', 'ratio', 'REFERENCE', 'Expected dinner attendance ratio', 'Standard college fest catering rate'),
    (NULL, 'FOOD', 'meal_participation_rate_snacks', '0.75', 'ratio', 'REFERENCE', 'Expected snacks and tea attendance ratio', 'High tea/snacks baseline'),
    (NULL, 'FOOD', 'meal_participation_rate_high_tea', '0.75', 'ratio', 'REFERENCE', 'Expected high tea attendance ratio', 'High tea baseline'),
    (NULL, 'FOOD', 'meal_participation_rate_refreshments', '0.80', 'ratio', 'REFERENCE', 'Expected refreshments attendance ratio', 'Session refreshment baseline'),
    (NULL, 'FOOD', 'meal_participation_rate_default', '0.85', 'ratio', 'REFERENCE', 'Fallback meal participation rate', 'General catering default'),

    -- Food Unit Costs (INR)
    (NULL, 'FOOD', 'meal_cost_per_serving_breakfast', '80.00', 'INR/serving', 'REFERENCE', 'Standard breakfast cost per portion', 'Local institutional vendor quote'),
    (NULL, 'FOOD', 'meal_cost_per_serving_lunch', '140.00', 'INR/serving', 'REFERENCE', 'Standard lunch cost per portion', 'Local institutional vendor quote'),
    (NULL, 'FOOD', 'meal_cost_per_serving_dinner', '160.00', 'INR/serving', 'REFERENCE', 'Standard dinner cost per portion', 'Local institutional vendor quote'),
    (NULL, 'FOOD', 'meal_cost_per_serving_snacks', '50.00', 'INR/serving', 'REFERENCE', 'Standard snacks cost per portion', 'Tea and snack quote'),
    (NULL, 'FOOD', 'meal_cost_per_serving_high_tea', '60.00', 'INR/serving', 'REFERENCE', 'Standard high tea cost per portion', 'Special high tea quote'),
    (NULL, 'FOOD', 'meal_cost_per_serving_refreshments', '40.00', 'INR/serving', 'REFERENCE', 'Standard refreshment cost per portion', 'Biscuits and beverage quote'),
    (NULL, 'FOOD', 'meal_cost_per_serving_default', '120.00', 'INR/serving', 'REFERENCE', 'Fallback meal cost per portion', 'Average institutional buffet estimate'),

    -- Food Waste & Portion Parameters
    (NULL, 'FOOD', 'vegetarian_ratio', '0.70', 'ratio', 'REFERENCE', 'Default vegetarian portion ratio for mixed dietary preference', '70% vegetarian baseline for Indian college campuses'),
    (NULL, 'FOOD', 'food_waste_percentage', '0.12', 'ratio', 'REFERENCE', 'Anticipated surplus buffer waste percentage (12%)', 'Empirical catering surplus study'),
    (NULL, 'FOOD', 'food_serving_weight_kg_default', '0.35', 'kg/serving', 'REFERENCE', 'Average meal portion weight in kilograms', '0.35 kg/portion standard banquet reference'),
    (NULL, 'FOOD', 'food_participation_attrition_buffer_rate', '0.10', 'ratio', 'REFERENCE', 'Attendance safety margin for catering preparation', '10% attrition buffer'),

    -- Waste Packaging: Per Person / Per Meal
    (NULL, 'WASTE', 'packaging_plate_per_person', '1.0', 'items/person', 'REFERENCE', 'Plates required per attendee', '1 plate per attendee'),
    (NULL, 'WASTE', 'packaging_plate_per_meal', '1.0', 'items/meal', 'REFERENCE', 'Plates required per meal per attendee', '1 plate per meal'),
    (NULL, 'WASTE', 'packaging_cup_per_person', '2.0', 'items/person', 'REFERENCE', 'Cups required per attendee', '2 cups per attendee across sessions'),
    (NULL, 'WASTE', 'packaging_cup_per_meal', '1.0', 'items/meal', 'REFERENCE', 'Cups required per meal per attendee', '1 cup per meal'),
    (NULL, 'WASTE', 'packaging_spoon_per_person', '1.0', 'items/person', 'REFERENCE', 'Spoons required per attendee', '1 spoon per person'),
    (NULL, 'WASTE', 'packaging_spoon_per_meal', '1.0', 'items/meal', 'REFERENCE', 'Spoons required per meal per attendee', '1 spoon per meal'),
    (NULL, 'WASTE', 'packaging_fork_per_person', '1.0', 'items/person', 'REFERENCE', 'Forks required per attendee', '1 fork per person'),
    (NULL, 'WASTE', 'packaging_fork_per_meal', '1.0', 'items/meal', 'REFERENCE', 'Forks required per meal per attendee', '1 fork per meal'),
    (NULL, 'WASTE', 'packaging_glass_per_person', '1.0', 'items/person', 'REFERENCE', 'Glasses required per attendee', '1 glass per person'),
    (NULL, 'WASTE', 'packaging_glass_per_meal', '1.0', 'items/meal', 'REFERENCE', 'Glasses required per meal per attendee', '1 glass per meal'),

    -- Waste Packaging: Reusable vs Single-Use Split Ratios
    (NULL, 'WASTE', 'reusable_ratio_plate', '0.50', 'ratio', 'REFERENCE', 'Baseline reusable plate ratio', 'Campus dining default'),
    (NULL, 'WASTE', 'single_use_ratio_plate', '0.50', 'ratio', 'REFERENCE', 'Baseline single-use plate ratio', 'Campus dining default'),
    (NULL, 'WASTE', 'reusable_ratio_cup', '0.40', 'ratio', 'REFERENCE', 'Baseline reusable cup ratio', 'Campus dining default'),
    (NULL, 'WASTE', 'single_use_ratio_cup', '0.60', 'ratio', 'REFERENCE', 'Baseline single-use cup ratio', 'Campus dining default'),
    (NULL, 'WASTE', 'reusable_ratio_spoon', '0.50', 'ratio', 'REFERENCE', 'Baseline reusable spoon ratio', 'Campus dining default'),
    (NULL, 'WASTE', 'single_use_ratio_spoon', '0.50', 'ratio', 'REFERENCE', 'Baseline single-use spoon ratio', 'Campus dining default'),
    (NULL, 'WASTE', 'reusable_ratio_fork', '0.50', 'ratio', 'REFERENCE', 'Baseline reusable fork ratio', 'Campus dining default'),
    (NULL, 'WASTE', 'single_use_ratio_fork', '0.50', 'ratio', 'REFERENCE', 'Baseline single-use fork ratio', 'Campus dining default'),
    (NULL, 'WASTE', 'reusable_ratio_glass', '0.60', 'ratio', 'REFERENCE', 'Baseline reusable glass ratio', 'Campus dining default'),
    (NULL, 'WASTE', 'single_use_ratio_glass', '0.40', 'ratio', 'REFERENCE', 'Baseline single-use glass ratio', 'Campus dining default'),

    -- Plastic Items
    (NULL, 'WASTE', 'plastic_water_bottle_per_person', '1.0', 'items/person', 'REFERENCE', 'Single-use plastic water bottles per person without bulk refilling', 'Benchmark disposable rate'),
    (NULL, 'WASTE', 'plastic_bag_per_person', '0.20', 'items/person', 'REFERENCE', 'Plastic registration/swag bags per attendee', 'Benchmark disposable rate'),
    (NULL, 'WASTE', 'plastic_cup_per_person', '1.0', 'items/person', 'REFERENCE', 'Plastic beverage cups per attendee', 'Benchmark disposable rate'),
    (NULL, 'WASTE', 'plastic_wrapper_per_meal', '1.0', 'items/meal', 'REFERENCE', 'Packaged food wrappers per meal', 'Benchmark disposable rate'),

    -- Other Waste Items (Decorations, Containers)
    (NULL, 'WASTE', 'other_decorations_per_event', '15.0', 'items/event', 'REFERENCE', 'Default banners, signage, and display decoration items', 'Campus event staging guideline'),
    (NULL, 'WASTE', 'decorations_per_event', '15.0', 'items/event', 'REFERENCE', 'Default banners, signage, and display decoration items', 'Campus event staging guideline'),
    (NULL, 'WASTE', 'other_containers_per_event', '20.0', 'items/event', 'REFERENCE', 'Default food containers and storage boxes per event', 'Campus catering guideline'),
    (NULL, 'WASTE', 'containers_per_event', '20.0', 'items/event', 'REFERENCE', 'Default food containers and storage boxes per event', 'Campus catering guideline')
ON CONFLICT DO NOTHING;

