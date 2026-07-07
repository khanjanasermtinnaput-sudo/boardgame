import type { BoardSpace } from '@/engine/types'

// The Net Worth board — an original 40-space ring set in the fictional city
// of Meridian. Corners sit at 0/10/20/30 (Payday, Auction, Economic Crisis,
// Vacation). "investment" / "business" / "real_estate" spaces are generic
// marketplaces: landing on any of them opens the full matching catalog
// (src/content/investments.ts, businesses.ts, properties.ts) rather than
// binding one space to one specific item.
export const BOARD: BoardSpace[] = [
  { id: 0, type: 'payday', name: 'Payday Plaza', description: 'Collect your salary and any passive income owed.' },
  { id: 1, type: 'investment', name: 'Meridian Stock Exchange', description: 'Buy or sell stocks and bonds at current market prices.' },
  { id: 2, type: 'event', name: 'Crossroads', description: 'Draw an event card.' },
  { id: 3, type: 'business', name: "Founders' Row", description: 'Buy, upgrade, or sell a business.' },
  { id: 4, type: 'tax', name: 'City Tax Office', description: 'Pay income tax on your recent earnings.' },
  { id: 5, type: 'real_estate', name: 'Harborview Realty', description: 'Buy or sell real estate.' },
  { id: 6, type: 'charity', name: 'Community Fund', description: 'Donate to charity for goodwill and a small bonus.' },
  { id: 7, type: 'loan', name: 'Union Credit Bank', description: 'Take out or repay a loan.' },
  { id: 8, type: 'education', name: 'Meridian Institute', description: 'Invest in education to boost future income.' },
  { id: 9, type: 'bonus', name: 'Lucky Break', description: 'Collect a surprise bonus.' },
  { id: 10, type: 'auction', name: 'The Auction House', description: 'Bid for a random asset at auction.' },
  { id: 11, type: 'event', name: 'Rumor Mill', description: 'Draw an event card.' },
  { id: 12, type: 'investment', name: 'Harborline Trading Floor', description: 'Buy or sell stocks and bonds at current market prices.' },
  { id: 13, type: 'insurance', name: 'Shieldpoint Insurance', description: 'Buy insurance to protect against future losses.' },
  { id: 14, type: 'business', name: 'Industrial Row', description: 'Buy, upgrade, or sell a business.' },
  { id: 15, type: 'random', name: 'Wildcard Corner', description: 'Something unexpected happens.' },
  { id: 16, type: 'real_estate', name: 'Skyline Properties', description: 'Buy or sell real estate.' },
  { id: 17, type: 'event', name: 'Crossroads Annex', description: 'Draw an event card.' },
  { id: 18, type: 'market', name: 'Trading Floor Bell', description: 'The market shifts — asset values update.' },
  { id: 19, type: 'business', name: 'Startup Alley', description: 'Buy, upgrade, or sell a business.' },
  { id: 20, type: 'economic_crisis', name: 'Economic Crisis', description: 'A downturn hits — brace for impact.' },
  { id: 21, type: 'investment', name: 'Granite Bond Office', description: 'Buy or sell stocks and bonds at current market prices.' },
  { id: 22, type: 'charity', name: 'Helping Hands Drive', description: 'Donate to charity for goodwill and a small bonus.' },
  { id: 23, type: 'tax', name: 'County Tax Bureau', description: 'Pay income tax on your recent earnings.' },
  { id: 24, type: 'event', name: "Fortune's Corner", description: 'Draw an event card.' },
  { id: 25, type: 'real_estate', name: 'Union Land Office', description: 'Buy or sell real estate.' },
  { id: 26, type: 'loan', name: 'Ledger Trust Bank', description: 'Take out or repay a loan.' },
  { id: 27, type: 'business', name: 'Solar Fields', description: 'Buy, upgrade, or sell a business.' },
  { id: 28, type: 'education', name: 'Riverside Academy', description: 'Invest in education to boost future income.' },
  { id: 29, type: 'insurance', name: 'Anchor Assurance', description: 'Buy insurance to protect against future losses.' },
  { id: 30, type: 'vacation', name: 'Vacation Resort', description: 'Take a well-earned break — skip your next roll.' },
  { id: 31, type: 'investment', name: 'Skyline Brokerage', description: 'Buy or sell stocks and bonds at current market prices.' },
  { id: 32, type: 'event', name: 'Turning Point', description: 'Draw an event card.' },
  { id: 33, type: 'bonus', name: 'Windfall', description: 'Collect a surprise bonus.' },
  { id: 34, type: 'real_estate', name: 'Meridian Estates', description: 'Buy or sell real estate.' },
  { id: 35, type: 'business', name: 'Hospitality Quarter', description: 'Buy, upgrade, or sell a business.' },
  { id: 36, type: 'event', name: 'Crossroads West', description: 'Draw an event card.' },
  { id: 37, type: 'salary', name: 'Bonus Payday', description: 'Collect an extra salary bonus.' },
  { id: 38, type: 'investment', name: 'Last Word Capital', description: 'Buy or sell stocks and bonds at current market prices.' },
  { id: 39, type: 'real_estate', name: "Founders' Landing", description: 'Buy or sell real estate.' },
]

export const BOARD_SIZE = BOARD.length
