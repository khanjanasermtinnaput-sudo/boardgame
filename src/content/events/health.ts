import type { EventCard } from '@/engine/types'

export const HEALTH_EVENTS: EventCard[] = [
  { id: 'health-001', category: 'health', title: 'Sprained Ankle', flavor: 'A weekend hike ends with a trip to urgent care.', effects: [{ kind: 'cash_delta', amount: -300 }] },
  { id: 'health-002', category: 'health', title: 'Wellness Bonus', flavor: 'Your employer rewards a clean bill of health with a wellness bonus.', effects: [{ kind: 'cash_delta', amount: 250 }] },
  { id: 'health-003', category: 'health', title: 'Dental Work', flavor: 'A routine cleaning turns into a filling you did not budget for.', effects: [{ kind: 'cash_delta', amount: -350 }] },
  { id: 'health-004', category: 'health', title: 'Gym Membership Deal', flavor: 'You lock in a discounted annual gym membership.', effects: [{ kind: 'expense_delta', amount: -30 }] },
  { id: 'health-005', category: 'health', title: 'Flu Season', flavor: 'A rough flu season means a few sick days and some medication costs.', effects: [{ kind: 'cash_delta', amount: -180 }] },
  { id: 'health-006', category: 'health', title: 'Health Scare Resolved', flavor: 'A worrying symptom turns out to be nothing, after a battery of tests.', effects: [{ kind: 'cash_delta', amount: -450 }] },
  { id: 'health-007', category: 'health', title: 'Insurance Payout', flavor: 'Your insurance covers most of an unexpected medical bill.', effects: [{ kind: 'cash_delta', amount: -150 }] },
  { id: 'health-008', category: 'health', title: 'New Glasses', flavor: 'It is time for an eye exam and a new pair of glasses.', effects: [{ kind: 'cash_delta', amount: -220 }] },
  { id: 'health-009', category: 'health', title: 'Marathon Training', flavor: 'You commit to marathon training — gear costs add up.', effects: [{ kind: 'cash_delta', amount: -160 }] },
  { id: 'health-010', category: 'health', title: 'Preventive Care Rebate', flavor: 'Completing your annual checkup earns you a small rebate.', effects: [{ kind: 'cash_delta', amount: 120 }] },
  { id: 'health-011', category: 'health', title: 'Physical Therapy', flavor: 'An old injury flares up and needs a few sessions of therapy.', effects: [{ kind: 'cash_delta', amount: -400 }] },
  { id: 'health-012', category: 'health', title: 'Surgery Required', flavor: 'A minor procedure is recommended by your doctor.', effects: [{ kind: 'cash_delta', amount: -900 }] },
  { id: 'health-013', category: 'health', title: 'Mental Health Day', flavor: 'You take a well-earned day off to recharge.', effects: [{ kind: 'cash_delta', amount: -60 }] },
  { id: 'health-014', category: 'health', title: 'Healthy Habits Pay Off', flavor: 'Consistent good habits lower your long-term insurance costs.', effects: [{ kind: 'expense_delta', amount: -40 }] },
  { id: 'health-015', category: 'health', title: 'Allergy Season', flavor: 'A rough allergy season means a stack of medication receipts.', effects: [{ kind: 'cash_delta', amount: -90 }] },
  { id: 'health-016', category: 'health', title: 'Emergency Room Visit', flavor: 'A late-night ER visit turns out to be nothing serious, but it was not free.', effects: [{ kind: 'cash_delta', amount: -750 }] },
  { id: 'health-017', category: 'health', title: 'Wellness Retreat', flavor: 'You splurge on a weekend wellness retreat.', effects: [{ kind: 'cash_delta', amount: -300 }] },
  { id: 'health-018', category: 'health', title: 'Vaccination Drive', flavor: 'A free community vaccination clinic saves you a copay.', effects: [{ kind: 'cash_delta', amount: 40 }] },
  { id: 'health-019', category: 'health', title: 'Chronic Condition Managed', flavor: 'A new treatment plan keeps a chronic condition well under control.', effects: [{ kind: 'expense_delta', amount: 35 }] },
  { id: 'health-020', category: 'health', title: 'Recovery Complete', flavor: 'You finish physical therapy strong and stop paying for sessions.', effects: [{ kind: 'expense_delta', amount: -25 }] },
]
