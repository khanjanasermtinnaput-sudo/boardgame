// Mirrors supabase/migrations/0009_seed_card_catalog.sql exactly. This is
// for client-side display only (card art/description/labels) — pricing is
// always re-validated server-side against `card_catalog` when a buy/sell
// RPC runs, never trusted from this file.

export type CardCategory =
  | 'house'
  | 'business'
  | 'growth_stock'
  | 'dividend_stock'
  | 'gold'
  | 'car'
  | 'land'
  | 'commercial_building'
  | 'crypto'
  | 'special_asset'

export interface CatalogCard {
  id: string
  name: string
  category: CardCategory
  purchasePrice: number
  baseValue: number
  passiveIncome: number
  description: string
}

export const CATEGORY_LABELS: Record<CardCategory, string> = {
  house: 'House',
  business: 'Business',
  growth_stock: 'Growth Stock',
  dividend_stock: 'Dividend Stock',
  gold: 'Gold',
  car: 'Car',
  land: 'Land',
  commercial_building: 'Commercial Building',
  crypto: 'Crypto',
  special_asset: 'Special Asset',
}

export const CATEGORY_ICONS: Record<CardCategory, string> = {
  house: '🏠',
  business: '💼',
  growth_stock: '📈',
  dividend_stock: '💵',
  gold: '💰',
  car: '🚗',
  land: '🗺️',
  commercial_building: '🏢',
  crypto: '🪙',
  special_asset: '💎',
}

export const CARD_CATALOG: CatalogCard[] = [
  // House
  { id: 'house_1', name: 'Suburban Starter House', category: 'house', purchasePrice: 15000, baseValue: 15000, passiveIncome: 550, description: 'A modest three-bedroom house in a quiet suburb, rented to a young family.' },
  { id: 'house_2', name: 'Downtown Condo', category: 'house', purchasePrice: 22000, baseValue: 22000, passiveIncome: 800, description: 'A one-bedroom condo near the city center, popular with young professionals.' },
  { id: 'house_3', name: 'Lakeside Cottage', category: 'house', purchasePrice: 28000, baseValue: 28000, passiveIncome: 950, description: 'A weekend rental cottage on a small lake, booked most of the year.' },
  { id: 'house_4', name: 'Family Duplex', category: 'house', purchasePrice: 35000, baseValue: 35000, passiveIncome: 1300, description: 'A two-unit duplex, both sides leased on long-term contracts.' },
  { id: 'house_5', name: 'Hillside Villa', category: 'house', purchasePrice: 48000, baseValue: 48000, passiveIncome: 1700, description: 'A view villa on a hillside, rented to long-term tenants.' },
  { id: 'house_6', name: 'Historic Townhouse', category: 'house', purchasePrice: 40000, baseValue: 40000, passiveIncome: 1450, description: 'A restored townhouse in a heritage district, in steady demand.' },
  { id: 'house_7', name: 'Beachfront Bungalow', category: 'house', purchasePrice: 55000, baseValue: 55000, passiveIncome: 1900, description: 'A small bungalow steps from the beach, rented seasonally at a premium.' },
  { id: 'house_8', name: 'Mountain Retreat', category: 'house', purchasePrice: 60000, baseValue: 60000, passiveIncome: 2050, description: 'A cabin retreat popular with hikers, rented year-round.' },
  // Business
  { id: 'business_1', name: 'Corner Cafe', category: 'business', purchasePrice: 18000, baseValue: 18000, passiveIncome: 1150, description: 'A small neighborhood cafe with a loyal regular crowd.' },
  { id: 'business_2', name: 'Food Truck Fleet', category: 'business', purchasePrice: 25000, baseValue: 25000, passiveIncome: 1600, description: 'Three food trucks operating at busy lunch spots around town.' },
  { id: 'business_3', name: 'Boutique Salon', category: 'business', purchasePrice: 20000, baseValue: 20000, passiveIncome: 1250, description: 'A hair and beauty salon in a busy shopping strip.' },
  { id: 'business_4', name: 'Auto Repair Shop', category: 'business', purchasePrice: 30000, baseValue: 30000, passiveIncome: 1900, description: 'A full-service garage with a steady stream of repeat customers.' },
  { id: 'business_5', name: 'Software Startup', category: 'business', purchasePrice: 45000, baseValue: 45000, passiveIncome: 3100, description: 'A small SaaS company with a growing subscriber base.' },
  { id: 'business_6', name: 'Manufacturing Plant', category: 'business', purchasePrice: 65000, baseValue: 65000, passiveIncome: 4200, description: 'A mid-size plant producing packaged consumer goods.' },
  { id: 'business_7', name: 'Logistics Company', category: 'business', purchasePrice: 55000, baseValue: 55000, passiveIncome: 3600, description: 'A regional trucking and warehousing operation.' },
  { id: 'business_8', name: 'Franchise Chain', category: 'business', purchasePrice: 80000, baseValue: 80000, passiveIncome: 5400, description: 'A multi-location franchise with established brand recognition.' },
  // Growth Stock
  { id: 'growth_stock_1', name: 'Nova Robotics Inc', category: 'growth_stock', purchasePrice: 8000, baseValue: 8000, passiveIncome: 0, description: 'An early-stage robotics company chasing rapid expansion over dividends.' },
  { id: 'growth_stock_2', name: 'Quantum Semi Corp', category: 'growth_stock', purchasePrice: 15000, baseValue: 15000, passiveIncome: 0, description: 'A semiconductor designer reinvesting all profit into R&D.' },
  { id: 'growth_stock_3', name: 'Skyline Aerospace', category: 'growth_stock', purchasePrice: 22000, baseValue: 22000, passiveIncome: 0, description: 'An aerospace startup developing next-generation propulsion.' },
  { id: 'growth_stock_4', name: 'Helios Energy Tech', category: 'growth_stock', purchasePrice: 12000, baseValue: 12000, passiveIncome: 0, description: 'A solar technology firm scaling manufacturing capacity.' },
  { id: 'growth_stock_5', name: 'Vertex Biotech', category: 'growth_stock', purchasePrice: 18000, baseValue: 18000, passiveIncome: 0, description: 'A biotech firm with several drugs in early clinical trials.' },
  { id: 'growth_stock_6', name: 'Pioneer AI Labs', category: 'growth_stock', purchasePrice: 28000, baseValue: 28000, passiveIncome: 0, description: 'An AI research company building enterprise automation tools.' },
  { id: 'growth_stock_7', name: 'Orbital Systems', category: 'growth_stock', purchasePrice: 35000, baseValue: 35000, passiveIncome: 0, description: 'A satellite launch company expanding its commercial contracts.' },
  { id: 'growth_stock_8', name: 'Frontier Motors', category: 'growth_stock', purchasePrice: 20000, baseValue: 20000, passiveIncome: 0, description: 'An electric vehicle startup ramping up production.' },
  // Dividend Stock
  { id: 'dividend_stock_1', name: 'Union Utilities Co', category: 'dividend_stock', purchasePrice: 12000, baseValue: 12000, passiveIncome: 800, description: 'A regulated utility with a long history of steady payouts.' },
  { id: 'dividend_stock_2', name: 'Harborline Shipping', category: 'dividend_stock', purchasePrice: 18000, baseValue: 18000, passiveIncome: 1200, description: 'An established shipping line with predictable freight contracts.' },
  { id: 'dividend_stock_3', name: 'Steadfast Insurance', category: 'dividend_stock', purchasePrice: 25000, baseValue: 25000, passiveIncome: 1700, description: 'A conservative insurer known for consistent dividend payments.' },
  { id: 'dividend_stock_4', name: 'Continental Foods', category: 'dividend_stock', purchasePrice: 20000, baseValue: 20000, passiveIncome: 1350, description: 'A packaged foods company with stable consumer demand.' },
  { id: 'dividend_stock_5', name: 'Granite Bank Holdings', category: 'dividend_stock', purchasePrice: 30000, baseValue: 30000, passiveIncome: 2050, description: 'A regional bank with a long dividend track record.' },
  { id: 'dividend_stock_6', name: 'Evergreen Telecom', category: 'dividend_stock', purchasePrice: 22000, baseValue: 22000, passiveIncome: 1500, description: 'A telecom carrier with a large, stable subscriber base.' },
  { id: 'dividend_stock_7', name: 'National Rail Corp', category: 'dividend_stock', purchasePrice: 35000, baseValue: 35000, passiveIncome: 2400, description: 'A freight rail operator with long-term shipping contracts.' },
  { id: 'dividend_stock_8', name: 'Summit Pharma', category: 'dividend_stock', purchasePrice: 28000, baseValue: 28000, passiveIncome: 1900, description: 'A pharmaceutical company selling established generic drugs.' },
  // Gold
  { id: 'gold_1', name: 'Gold Bar (1kg)', category: 'gold', purchasePrice: 6000, baseValue: 6000, passiveIncome: 0, description: 'A single one-kilogram gold bar held as a hedge.' },
  { id: 'gold_2', name: 'Gold Coin Set', category: 'gold', purchasePrice: 3000, baseValue: 3000, passiveIncome: 0, description: 'A set of collector gold coins bought at bullion value.' },
  { id: 'gold_3', name: 'Gold Bullion Bundle', category: 'gold', purchasePrice: 12000, baseValue: 12000, passiveIncome: 0, description: 'A sealed bundle of gold bullion bars.' },
  { id: 'gold_4', name: 'Vault Gold Reserve', category: 'gold', purchasePrice: 20000, baseValue: 20000, passiveIncome: 0, description: 'A vault-stored gold reserve, insured and audited annually.' },
  { id: 'gold_5', name: 'Antique Gold Collection', category: 'gold', purchasePrice: 9000, baseValue: 9000, passiveIncome: 0, description: 'A collection of antique gold jewelry valued for its metal content.' },
  { id: 'gold_6', name: 'Gold ETF Certificate', category: 'gold', purchasePrice: 15000, baseValue: 15000, passiveIncome: 0, description: 'A certificate representing a claim on pooled physical gold.' },
  { id: 'gold_7', name: 'Large Gold Reserve', category: 'gold', purchasePrice: 30000, baseValue: 30000, passiveIncome: 0, description: 'A substantial private gold holding kept in secure storage.' },
  { id: 'gold_8', name: 'Sovereign Gold Trust', category: 'gold', purchasePrice: 40000, baseValue: 40000, passiveIncome: 0, description: 'A large institutional-grade gold trust holding.' },
  // Car
  { id: 'car_1', name: 'Compact Hatchback', category: 'car', purchasePrice: 4000, baseValue: 4000, passiveIncome: 0, description: 'A fuel-efficient hatchback, mostly used for commuting.' },
  { id: 'car_2', name: 'Family Sedan', category: 'car', purchasePrice: 7000, baseValue: 7000, passiveIncome: 0, description: 'A reliable mid-size sedan.' },
  { id: 'car_3', name: 'Pickup Truck', category: 'car', purchasePrice: 9000, baseValue: 9000, passiveIncome: 0, description: 'A work-ready pickup truck.' },
  { id: 'car_4', name: 'Sports Coupe', category: 'car', purchasePrice: 14000, baseValue: 14000, passiveIncome: 0, description: 'A two-door sports coupe.' },
  { id: 'car_5', name: 'Luxury Sedan', category: 'car', purchasePrice: 22000, baseValue: 22000, passiveIncome: 0, description: 'A high-end luxury sedan.' },
  { id: 'car_6', name: 'Classic Convertible', category: 'car', purchasePrice: 18000, baseValue: 18000, passiveIncome: 0, description: 'A restored classic convertible.' },
  { id: 'car_7', name: 'Off-Road SUV', category: 'car', purchasePrice: 16000, baseValue: 16000, passiveIncome: 0, description: 'A rugged SUV built for off-road use.' },
  { id: 'car_8', name: 'Exotic Supercar', category: 'car', purchasePrice: 45000, baseValue: 45000, passiveIncome: 0, description: 'A limited-production exotic supercar.' },
  // Land
  { id: 'land_1', name: 'Rural Acreage Plot', category: 'land', purchasePrice: 10000, baseValue: 10000, passiveIncome: 100, description: 'A modest plot of rural farmland leased to a local grower.' },
  { id: 'land_2', name: 'Farmland Parcel', category: 'land', purchasePrice: 16000, baseValue: 16000, passiveIncome: 160, description: 'Productive farmland leased on a seasonal basis.' },
  { id: 'land_3', name: 'Desert Lot', category: 'land', purchasePrice: 6000, baseValue: 6000, passiveIncome: 60, description: 'An undeveloped desert lot held for future resale.' },
  { id: 'land_4', name: 'Suburban Vacant Lot', category: 'land', purchasePrice: 20000, baseValue: 20000, passiveIncome: 200, description: 'A vacant lot in a growing suburb, zoned for development.' },
  { id: 'land_5', name: 'Timberland Tract', category: 'land', purchasePrice: 25000, baseValue: 25000, passiveIncome: 250, description: 'A forested tract leased for sustainable timber harvesting.' },
  { id: 'land_6', name: 'Coastal Land Parcel', category: 'land', purchasePrice: 38000, baseValue: 38000, passiveIncome: 380, description: 'A coastal parcel with long-term appreciation potential.' },
  { id: 'land_7', name: 'Development Zone Plot', category: 'land', purchasePrice: 50000, baseValue: 50000, passiveIncome: 500, description: 'A plot within a newly rezoned development corridor.' },
  { id: 'land_8', name: 'Mountain Land Reserve', category: 'land', purchasePrice: 30000, baseValue: 30000, passiveIncome: 300, description: 'A large mountain-adjacent land reserve.' },
  // Commercial Building
  { id: 'commercial_building_1', name: 'Strip Mall Unit', category: 'commercial_building', purchasePrice: 40000, baseValue: 40000, passiveIncome: 2200, description: 'A single unit in a busy neighborhood strip mall.' },
  { id: 'commercial_building_2', name: 'Office Suite Block', category: 'commercial_building', purchasePrice: 55000, baseValue: 55000, passiveIncome: 3000, description: 'A block of leased office suites downtown.' },
  { id: 'commercial_building_3', name: 'Warehouse Facility', category: 'commercial_building', purchasePrice: 65000, baseValue: 65000, passiveIncome: 3500, description: 'A leased warehouse near the highway interchange.' },
  { id: 'commercial_building_4', name: 'Retail Plaza', category: 'commercial_building', purchasePrice: 75000, baseValue: 75000, passiveIncome: 4100, description: 'A multi-tenant retail plaza with anchor stores.' },
  { id: 'commercial_building_5', name: 'Parking Garage Complex', category: 'commercial_building', purchasePrice: 50000, baseValue: 50000, passiveIncome: 2700, description: 'A multi-level parking garage in the business district.' },
  { id: 'commercial_building_6', name: 'Mixed-Use Building', category: 'commercial_building', purchasePrice: 85000, baseValue: 85000, passiveIncome: 4600, description: 'A building combining ground-floor retail with leased offices above.' },
  { id: 'commercial_building_7', name: 'Industrial Park Lot', category: 'commercial_building', purchasePrice: 95000, baseValue: 95000, passiveIncome: 5100, description: 'A leased lot within a large industrial park.' },
  { id: 'commercial_building_8', name: 'Downtown Tower Floor', category: 'commercial_building', purchasePrice: 110000, baseValue: 110000, passiveIncome: 5900, description: 'A full leased floor in a downtown office tower.' },
  // Crypto
  { id: 'crypto_1', name: 'BitCore Token', category: 'crypto', purchasePrice: 5000, baseValue: 5000, passiveIncome: 0, description: 'A widely-traded digital token known for sharp price swings.' },
  { id: 'crypto_2', name: 'EtherFlux Coin', category: 'crypto', purchasePrice: 8000, baseValue: 8000, passiveIncome: 0, description: 'A smart-contract platform token.' },
  { id: 'crypto_3', name: 'NovaChain Token', category: 'crypto', purchasePrice: 3000, baseValue: 3000, passiveIncome: 0, description: 'A newer, highly speculative blockchain token.' },
  { id: 'crypto_4', name: 'StableYield Coin', category: 'crypto', purchasePrice: 10000, baseValue: 10000, passiveIncome: 500, description: 'A yield-bearing token that pays out staking rewards.' },
  { id: 'crypto_5', name: 'MetaLedger Token', category: 'crypto', purchasePrice: 15000, baseValue: 15000, passiveIncome: 0, description: 'A ledger-network token with growing developer adoption.' },
  { id: 'crypto_6', name: 'QuantumChain Coin', category: 'crypto', purchasePrice: 20000, baseValue: 20000, passiveIncome: 0, description: 'A high-throughput blockchain token.' },
  { id: 'crypto_7', name: 'DeepNet Token', category: 'crypto', purchasePrice: 12000, baseValue: 12000, passiveIncome: 0, description: 'A decentralized compute-network token.' },
  { id: 'crypto_8', name: 'ZenithCoin', category: 'crypto', purchasePrice: 25000, baseValue: 25000, passiveIncome: 0, description: 'A large-cap digital token with deep trading liquidity.' },
  // Special Asset
  { id: 'special_asset_1', name: 'Music Royalty Contract', category: 'special_asset', purchasePrice: 20000, baseValue: 20000, passiveIncome: 1400, description: 'A share of ongoing royalties from a catalog of recorded music.' },
  { id: 'special_asset_2', name: 'Patent License Portfolio', category: 'special_asset', purchasePrice: 35000, baseValue: 35000, passiveIncome: 2300, description: 'A bundle of licensed patents generating royalty income.' },
  { id: 'special_asset_3', name: 'Rare Art Collection', category: 'special_asset', purchasePrice: 30000, baseValue: 30000, passiveIncome: 0, description: 'A collection of fine art held for long-term appreciation.' },
  { id: 'special_asset_4', name: 'Vintage Wine Cellar', category: 'special_asset', purchasePrice: 18000, baseValue: 18000, passiveIncome: 0, description: 'A cellar of aging vintage wine.' },
  { id: 'special_asset_5', name: 'Racehorse Syndicate Share', category: 'special_asset', purchasePrice: 25000, baseValue: 25000, passiveIncome: 1000, description: "A share in a racehorse syndicate's winnings." },
  { id: 'special_asset_6', name: 'Film Royalty Stake', category: 'special_asset', purchasePrice: 22000, baseValue: 22000, passiveIncome: 1300, description: "A stake in ongoing royalties from a film's distribution." },
  { id: 'special_asset_7', name: 'Private Equity Stake', category: 'special_asset', purchasePrice: 50000, baseValue: 50000, passiveIncome: 2600, description: 'A minority stake in a private equity fund.' },
  { id: 'special_asset_8', name: 'Vintage Watch Collection', category: 'special_asset', purchasePrice: 15000, baseValue: 15000, passiveIncome: 0, description: 'A collection of vintage mechanical watches.' },
]

export const CARD_BY_ID: Record<string, CatalogCard> = Object.fromEntries(CARD_CATALOG.map((c) => [c.id, c]))
