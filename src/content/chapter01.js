// Story content for Chapter 01. Kept separate from game logic so each new stage
// only adds content here and a location in the world.
//
// Only real, supplied facts belong in this file. Do not invent achievements,
// dates, conversations or experiences.

export const CHARACTERS = {
  boy: { name: 'Chatriyan', portrait: 'boy' },
  // The companion's display name. Change it here if she should be named in the story.
  girl: { name: 'Companion', portrait: 'girl' },
  sign: { name: '' },
  // Friends appear only as silhouettes in a memory: no names, no designs.
  friend: { name: 'Friend' },
};

export const CHAPTER_01 = {
  number: '01',
  title: 'The Beginning',
  year: '2022',
  theme: 'From manufacturing to discovering design.',
  objective: 'Discover how curiosity, experimentation and problem-solving led to UX design.',
  locations: [
    { id: 'workshop', name: 'The Old Workshop', summary: 'Where my professional journey began, in manufacturing companies.' },
    { id: 'discovery', name: 'The Discovery Path', summary: 'Friends introduced me to the idea of UX.' },
    { id: 'camp', name: 'The Learning Camp', summary: 'The Google UX Design course.' },
    { id: 'workplace', name: 'The First Workplace', summary: 'Balwa HCM Cloud Suite.' },
    { id: 'academy', name: 'The Knowledge Academy', summary: "Master's in Design." },
    { id: 'mentor', name: "The Mentor's Camp", summary: 'Mentorship from UX Anuji.' },
    { id: 'temple', name: 'The Origin Temple', summary: 'Where my problem-solving skills were born.' },
  ],
};

// Dialogue scripts. `expr` picks a portrait cut from the expression panel of the
// character's reference sheet.
export const SCRIPTS = {
  intro: [
    { who: 'girl', expr: 'speaking', text: 'Hey! Ready to explore how this journey began?' },
    { who: 'boy', expr: 'smile', text: "Let's go. There's a lot to discover." },
  ],
  'welcome-sign': [
    { who: 'sign', text: "Welcome to Chatriyan's Portfolio World." },
    { who: 'sign', text: 'Chapter 01 · The Beginning. From manufacturing to discovering design.' },
    { who: 'girl', expr: 'smile', text: 'Every place along this path holds a piece of the story.' },
  ],
  home: [
    { who: 'girl', expr: 'laugh', text: 'Nobody home. We already left!' },
    { who: 'boy', expr: 'happy', text: 'Every journey needs somewhere to start from.' },
  ],
  'journey-map-intro': [
    { who: 'girl', expr: 'speaking', text: "Here's the map. Seven places, one chapter." },
  ],
  lookout: [
    { who: 'girl', expr: 'curious', text: 'See the chimney smoke over there?' },
    { who: 'girl', expr: 'speaking', text: "That's the Old Workshop. It's where your story begins." },
    { who: 'boy', expr: 'thinking', text: 'Long before I knew what UX was.' },
  ],

  // ---- Stage 2: The Old Workshop -------------------------------------------
  'enter-workshop': [
    { who: 'girl', expr: 'curious', text: 'So, where did your journey begin?' },
    { who: 'boy', expr: 'neutral', text: 'Back in 2022. I was working in a few manufacturing companies.' },
  ],
  machine: [
    { who: 'boy', expr: 'neutral', text: 'Back in 2022, I started my professional journey in manufacturing companies.' },
  ],
  blueprint: [
    { who: 'boy', expr: 'thinking', text: "I was learning and working, but something didn't feel right. I wasn't enjoying the kind of work I was doing." },
  ],
  observation: [
    { who: 'girl', expr: 'curious', text: 'Did you always know what you wanted to become?' },
    { who: 'boy', expr: 'thinking', text: 'Not really. I just knew I wanted to explore something different.' },
  ],
  'break-talk': [
    { who: 'girl', expr: 'speaking', text: 'Sounds like an interesting start. Did you enjoy it?' },
    { who: 'boy', expr: 'thinking', text: "Honestly, I didn't feel connected to the work I was doing. I knew I wanted something different, but I didn't know what yet." },
    { who: 'girl', expr: 'smile', text: 'Sometimes, finding a new direction starts with a simple conversation.' },
  ],
  memory: [
    { who: 'friend', text: "Have you heard about UX design? There's a field in IT called User Experience." },
    { who: 'friend', text: "Why don't you explore it?" },
    { who: 'boy', expr: 'surprised', text: "UX? What's that?" },
  ],
  'memory-after': [
    { who: 'girl', expr: 'wink', text: 'Looks like someone just opened a new door.' },
  ],
  gateway: [
    { who: 'sign', text: 'A NEW PATH AWAITS · THE WORLD OF UX' },
    { who: 'sign', text: 'A conversation changed the direction of the journey.' },
    { who: 'sign', text: 'Every new journey begins with curiosity.' },
  ],

  // ---- Stage 3: The Discovery Path -----------------------------------------
  'first-question': [
    { who: 'girl', expr: 'curious', text: 'So, what happened after your friends introduced you to UX?' },
    { who: 'boy', expr: 'thinking', text: 'I was curious. I wanted to understand what UX actually meant.' },
    { who: 'girl', expr: 'smile', text: "Then let's find out." },
  ],
  course: [
    { who: 'boy', expr: 'smile', text: 'I started learning through the Google UX Design course on Coursera.' },
    { who: 'girl', expr: 'curious', text: 'What did you learn?' },
    { who: 'boy', expr: 'speaking', text: "I started understanding how UX works, how designers think and how products are designed around people's needs." },
  ],
  curiosity: [
    { who: 'girl', expr: 'surprised', text: 'You realise there are so many worlds to explore, right?' },
    { who: 'boy', expr: 'happy', text: "That's what got me curious." },
  ],
  // ...the islands connect, then:
  'curiosity-2': [
    { who: 'boy', expr: 'speaking', text: 'What fascinated me was that I could learn something new from every industry while building a product.' },
    { who: 'girl', expr: 'curious', text: "So UX wasn't just about designing screens?" },
    { who: 'boy', expr: 'smile', text: 'Exactly. It was about understanding people, their problems and finding better ways to solve them.' },
    { who: 'girl', expr: 'laugh', text: "Looks like we've found something worth exploring." },
  ],
  studio: [
    { who: 'sign', text: 'THE FIRST DESIGN STUDIO' },
    { who: 'sign', text: 'Time to turn curiosity into practice.' },
  ],
  'island-healthcare': [{ who: 'sign', text: 'HEALTHCARE · Products for patients, doctors and care teams.' }],
  'island-education': [{ who: 'sign', text: 'EDUCATION · Products that help people learn and teach.' }],
  'island-finance': [{ who: 'sign', text: 'FINANCE · Products that help people manage and move money.' }],
  'island-ecommerce': [{ who: 'sign', text: 'E-COMMERCE · Products that help people discover and buy.' }],
  'island-transport': [{ who: 'sign', text: "TRANSPORTATION · Products that help people get where they're going." }],
  'island-technology': [{ who: 'sign', text: 'TECHNOLOGY · Tools that help people create and connect.' }],
};

// What the course opened up: presented as discoveries, not mastery.
export const COURSE = {
  name: 'Google UX Design Certificate',
  platform: 'Coursera',
  discoveries: ['Understanding UX', 'User-centred design', 'Research', 'Problem identification', 'Wireframing', 'Prototyping'],
};

// Hints the companion gives when a navigation mode starts.
export const MODE_HINTS = {
  scroll: "Scroll down and we'll walk the path together.",
  explore: '← → to walk, SPACE to jump. Press E near things!',
  touch: 'Use the buttons to walk and jump. Tap E near things!',
};
