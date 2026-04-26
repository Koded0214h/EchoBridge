const DEFAULT_RESOURCE_ID = 0

export const RESOURCES = [
  {
    id: 1,
    icon: '💬',
    category: 'Connection',
    keywords: ['lonely', 'alone', 'no friends', 'sad', 'depressed', 'isolated'],
    title: 'Friendly Chat Support',
    description: 'Talk to a trained listener who cares. Free, anonymous, 24/7.',
    contact: 'Call: 1-800-555-1234',
    audioText:
      "You're not alone. Call the Friendly Chat Support line anytime at 1-800-555-1234.",
  },
  {
    id: 2,
    icon: '🥫',
    category: 'Food',
    keywords: ['food', 'hungry', 'groceries', 'meal', 'eat', 'pantry'],
    title: 'Community Food Assistance',
    description: 'Find free meals and food banks near you.',
    contact: 'Text FOOD to 555-9876',
    audioText:
      'Help with food is available. Text the word FOOD to 555-9876 to find locations near you.',
  },
  {
    id: 3,
    icon: '🏠',
    category: 'Housing',
    keywords: ['housing', 'shelter', 'homeless', 'rent', 'eviction', 'apartment'],
    title: 'Safe Shelter Network',
    description: 'Find emergency shelter, rent support, and housing navigation.',
    contact: 'Call: 1-800-555-2468',
    audioText:
      'Housing help is available now. Call the Safe Shelter Network at 1-800-555-2468 for support.',
  },
  {
    id: 4,
    icon: '🫶',
    category: 'Mental health',
    keywords: ['anxiety', 'panic', 'stress', 'overwhelmed', 'nervous', 'help'],
    title: 'Calm Minds Support',
    description: 'Gentle, non-judgmental support for stress, panic, and anxiety.',
    contact: 'Text CALM to 555-4321',
    audioText:
      'Calm Minds Support can help right now. Text CALM to 555-4321 to start a conversation.',
  },
  {
    id: 5,
    icon: '💼',
    category: 'Work and benefits',
    keywords: ['job', 'work', 'unemployed', 'benefits', 'money', 'bills'],
    title: 'Work and Benefits Navigator',
    description: 'Get help with work searches, benefits, and urgent bill support.',
    contact: 'Visit: echobridge.org/work',
    audioText:
      'The Work and Benefits Navigator can help you review options for bills, benefits, and jobs.',
  },
]

export const DEFAULT_RESOURCE = {
  id: DEFAULT_RESOURCE_ID,
  icon: '✨',
  category: 'General help',
  keywords: [],
  title: 'How can we help?',
  description: 'Tell us what is happening and we will find the most relevant support.',
  contact: 'Browse all resources for more options.',
  audioText:
    'How can we help? You can speak, type, or browse the full list of support resources.',
}

function tokenizeInput(inputText) {
  return inputText
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map((word) => word.trim())
    .filter(Boolean)
}

export function findBestResource(userInputText) {
  const normalizedInput = userInputText.toLowerCase()
  const inputTokens = tokenizeInput(normalizedInput)

  let bestResource = DEFAULT_RESOURCE
  let bestScore = 0

  for (const resource of RESOURCES) {
    let score = 0

    for (const keyword of resource.keywords) {
      const normalizedKeyword = keyword.toLowerCase()

      if (normalizedKeyword.includes(' ') && normalizedInput.includes(normalizedKeyword)) {
        score += 2
        continue
      }

      if (inputTokens.includes(normalizedKeyword)) {
        score += 1
      }

      if (normalizedInput.includes(normalizedKeyword)) {
        score += 1
      }
    }

    if (score > bestScore) {
      bestScore = score
      bestResource = resource
    }
  }

  return bestScore > 0 ? bestResource : DEFAULT_RESOURCE
}
