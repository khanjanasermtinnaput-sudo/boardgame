insert into public.global_event_catalog (id, name, type, description, effects) values
-- Positive Market (50% weight at draw time)
('pos_1','Bull Run Rally','positive_market','Investor confidence surges across the stock market.','{"growth_stock":1.15,"dividend_stock":1.10}'),
('pos_2','Housing Boom','positive_market','A wave of buyers pushes property prices sharply higher.','{"house":1.12,"commercial_building":1.10,"land":1.08}'),
('pos_3','Crypto Surge','positive_market','A wave of new adoption sends digital tokens soaring.','{"crypto":1.30}'),
('pos_4','Gold Rush Discovery','positive_market','News of a major gold discovery lifts bullion prices.','{"gold":1.20}'),
('pos_5','Business Expansion Wave','positive_market','Consumer spending climbs and small businesses thrive.','{"business":1.15,"commercial_building":1.08}'),
('pos_6','Tech Breakthrough','positive_market','A major technology breakthrough excites growth investors.','{"growth_stock":1.20}'),
('pos_7','Auto Market Boom','positive_market','Strong demand pushes vehicle values up.','{"car":1.10}'),
('pos_8','Land Development Boom','positive_market','New infrastructure plans drive land prices upward.','{"land":1.18,"commercial_building":1.10}'),
('pos_9','Broad Economic Growth','positive_market','A strong quarter of economic growth lifts nearly every asset class.','{"house":1.05,"business":1.05,"growth_stock":1.05,"dividend_stock":1.05,"gold":1.05,"car":1.05,"land":1.05,"commercial_building":1.05,"crypto":1.05,"special_asset":1.05}'),
-- Economic Slowdown (30% weight)
('slow_1','Consumer Spending Dip','economic_slowdown','Shoppers pull back, hurting small businesses and car sales.','{"business":0.90,"car":0.92}'),
('slow_2','Housing Market Cooling','economic_slowdown','Rising rates cool buyer demand for property.','{"house":0.92,"land":0.94}'),
('slow_3','Stock Market Correction','economic_slowdown','A broad pullback hits growth names hardest.','{"growth_stock":0.88,"dividend_stock":0.94}'),
('slow_4','Crypto Winter','economic_slowdown','Digital token prices slide as trading volume dries up.','{"crypto":0.80}'),
('slow_5','Commercial Vacancy Rise','economic_slowdown','Rising office vacancies weigh on commercial property values.','{"commercial_building":0.90}'),
('slow_6','Mild Recession Signals','economic_slowdown','Soft economic data weighs on asset prices broadly.','{"house":0.95,"business":0.95,"growth_stock":0.95,"dividend_stock":0.95,"gold":0.95,"car":0.95,"land":0.95,"commercial_building":0.95,"crypto":0.95,"special_asset":0.95}'),
-- Black Event (20% weight)
('black_1','Market Crash','black_event','A sudden, severe crash wipes out value across nearly every asset class.','{"growth_stock":0.65,"dividend_stock":0.80,"business":0.75,"commercial_building":0.80,"house":0.85,"land":0.90,"car":0.85,"crypto":0.55,"gold":1.25}'),
('black_2','Financial Crisis','black_event','A systemic financial crisis batters markets while investors flee to gold.','{"house":0.80,"business":0.80,"growth_stock":0.80,"dividend_stock":0.80,"land":0.80,"commercial_building":0.80,"car":0.80,"crypto":0.80,"special_asset":0.80,"gold":1.30}'),
('black_3','Crypto Collapse','black_event','A major exchange failure triggers a collapse in digital token prices.','{"crypto":0.40,"gold":1.15}');
