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
  // The mentor is shown only as a symbolic silhouette (no likeness).
  mentor: { name: 'UX Anuji' },
};

export const CHAPTER_01 = {
  number: '01',
  title: 'The Beginning',
  year: '2022',
  theme: 'From manufacturing to discovering design.',
  objective: 'Discover how curiosity, experimentation and problem-solving led to UX design.',
  locations: [
    { id: 'workshop', name: 'The Old Workshop', summary: "Discovering that manufacturing wasn't the path I wanted." },
    { id: 'discovery', name: 'The Discovery Path', summary: 'Friends introduce UX. Curiosity begins.' },
    { id: 'camp', name: 'The Learning Camp', summary: 'The Google UX Design course and exploring different industries.' },
    { id: 'workplace', name: 'The First Design Studio', summary: 'Balwa HCM Cloud Suite. One designer, multiple creative hats.' },
    { id: 'academy', name: 'The Knowledge Academy', summary: 'M.Des in Interaction Design at Lovely Professional University, Punjab.' },
    { id: 'mentor', name: "The Mentor's Camp", summary: 'UX Anuji, and discovering the way I naturally solve problems.' },
    { id: 'awakening', name: 'The Awakening', summary: 'Connecting my experiences and discovering my design identity.' },
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
  'studio-door': [
    { who: 'sign', text: 'THE FIRST DESIGN STUDIO' },
    { who: 'sign', text: 'Time to turn curiosity into practice.' },
  ],
  'island-healthcare': [{ who: 'sign', text: 'HEALTHCARE · Products for patients, doctors and care teams.' }],
  'island-education': [{ who: 'sign', text: 'EDUCATION · Products that help people learn and teach.' }],
  'island-finance': [{ who: 'sign', text: 'FINANCE · Products that help people manage and move money.' }],
  'island-ecommerce': [{ who: 'sign', text: 'E-COMMERCE · Products that help people discover and buy.' }],
  'island-transport': [{ who: 'sign', text: "TRANSPORTATION · Products that help people get where they're going." }],
  'island-technology': [{ who: 'sign', text: 'TECHNOLOGY · Tools that help people create and connect.' }],

  // ---- Stage 4: The First Design Studio (Balwa HCM Cloud Suite) ------------
  'studio-enter': [
    { who: 'girl', expr: 'curious', text: 'So, where did this new journey take you?' },
    { who: 'boy', expr: 'smile', text: 'I got placed at a company called Balwa HCM Cloud Suite.' },
    { who: 'girl', expr: 'speaking', text: 'Your first design workplace?' },
    { who: 'boy', expr: 'happy', text: 'Yes. This was where I started applying what I had learned.' },
  ],
  'one-team': [
    { who: 'girl', expr: 'curious', text: 'How big was the design team?' },
    { who: 'boy', expr: 'thinking', text: 'Well... I was the whole design team.' },
  ],
  // ...a short comedic pause, then:
  'one-team-2': [
    { who: 'girl', expr: 'surprised', text: 'Wait. The whole team?' },
    { who: 'boy', expr: 'laugh', text: 'Pretty much!' },
    { who: 'girl', expr: 'curious', text: 'So, what were you working on?' },
  ],
  'one-team-3': [
    { who: 'boy', expr: 'happy', text: 'Everything! Graphic design, motion design, visual design and product design.' },
  ],
  'station-graphic': [{ who: 'boy', expr: 'smile', text: 'I worked on graphic design too.' }],
  'station-motion': [{ who: 'boy', expr: 'speaking', text: 'I also explored motion design, bringing visuals to life through animation.' }],
  'station-visual': [{ who: 'boy', expr: 'thinking', text: 'Visual design was another part of my work. I started understanding how visual elements work together.' }],
  'station-product': [{ who: 'boy', expr: 'smile', text: 'And I was also working on product design.' }],
  'missing-piece': [
    { who: 'girl', expr: 'curious', text: "You were doing so many different things. Didn't that feel exciting?" },
    { who: 'boy', expr: 'smile', text: 'It did. I was learning a lot by doing different kinds of work.' },
  ],
  // ...a pause, then:
  'missing-piece-2': [
    { who: 'boy', expr: 'thinking', text: 'But somewhere, I felt I was still missing something.' },
    { who: 'girl', expr: 'neutral', text: 'What was missing?' },
    { who: 'boy', expr: 'speaking', text: 'I wanted someone to guide me. Someone who could tell me whether I was doing things correctly, point out my mistakes and help me improve.' },
    { who: 'girl', expr: 'smile', text: 'So you wanted to grow beyond just doing the work?' },
    { who: 'boy', expr: 'smile', text: 'Exactly.' },
  ],
  decision: [
    { who: 'boy', expr: 'thinking', text: "I realised I needed stronger foundations. That's when I decided to pursue my master's in design." },
    { who: 'girl', expr: 'smile', text: "Then let's find a place where you can sharpen those skills." },
  ],
  'design-wall': [{ who: 'sign', text: 'Graphic, motion, visual and product design: one wall, one designer.' }],
  academy: [
    { who: 'sign', text: 'THE KNOWLEDGE ACADEMY' },
    { who: 'sign', text: "Sometimes, doing more isn't enough. You need to understand more." },
  ],

  // ---- Stage 5: The Knowledge Academy --------------------------------------
  'campus-arrive': [
    { who: 'girl', expr: 'curious', text: 'So, where are we heading now?' },
    { who: 'boy', expr: 'thinking', text: "I wanted to understand design more deeply. So I decided to pursue my master's." },
    { who: 'girl', expr: 'speaking', text: 'Where did you go?' },
    { who: 'boy', expr: 'smile', text: 'Lovely Professional University, Punjab. I joined the Master of Design programme in Interaction Design.' },
  ],
  'campus-enter': [
    { who: 'girl', expr: 'curious', text: 'You came here to learn more about design?' },
    { who: 'boy', expr: 'speaking', text: 'Yes. I wanted to build a stronger foundation instead of just relying on what I learned through work.' },
  ],
  fundamentals: [
    { who: 'girl', expr: 'curious', text: 'What changed when you started studying design?' },
    { who: 'boy', expr: 'thinking', text: 'I started understanding why certain design decisions work, not just how to make something look good.' },
  ],
  library: [
    { who: 'boy', expr: 'speaking', text: 'I also began understanding the importance of learning about people before designing for them.' },
    { who: 'girl', expr: 'curious', text: 'So, understanding the problem comes before creating the solution?' },
    { who: 'boy', expr: 'smile', text: 'Exactly.' },
  ],
  lab: [
    { who: 'girl', expr: 'curious', text: 'So, interaction design is more than making screens look beautiful?' },
    { who: 'boy', expr: 'smile', text: "Yes. It's about how people interact with something, understand it and experience it." },
  ],
  foundation: [
    { who: 'boy', expr: 'thinking', text: 'I started seeing design differently. Every decision had a reason behind it.' },
    { who: 'girl', expr: 'smile', text: "Looks like you're beginning to understand the thinking behind design." },
    { who: 'girl', expr: 'laugh', text: "You're not just learning how to design anymore. You're learning why." },
  ],
  horizon: [
    { who: 'girl', expr: 'smile', text: "Looks like there's still more to learn." },
    { who: 'boy', expr: 'thinking', text: 'Definitely. I was learning the principles, but I also wanted someone experienced to challenge the way I thought.' },
  ],
  mentor: [
    { who: 'sign', text: "THE MENTOR'S CAMP" },
    { who: 'sign', text: 'Learning the principles is one thing. Learning how to think is another.' },
  ],

  // ---- Stage 6: The Mentor's Camp ------------------------------------------
  'camp-arrive': [
    { who: 'girl', expr: 'curious', text: 'You said you wanted someone to guide you. Did you find someone?' },
    { who: 'boy', expr: 'smile', text: 'Yes. I got mentorship from UX Anuji.' },
    { who: 'girl', expr: 'speaking', text: 'What did he help you understand?' },
    { who: 'boy', expr: 'speaking', text: "He helped me understand where to start, why I should start there, and why blindly following textbook methods isn't always the answer." },
  ],
  'mentor-question': [
    { who: 'mentor', text: 'Before we talk about design, tell me something. How do you usually approach a problem?' },
    { who: 'boy', expr: 'thinking', text: 'I never really thought about it.' },
    { who: 'mentor', text: "Then let's go back to where it all started." },
  ],
  'school-watch': [
    { who: 'girl', expr: 'curious', text: "Look at you. You're not copying the answer… you're watching every step." },
  ],
  'school-realise': [
    { who: 'girl', expr: 'surprised', text: 'Wait! You solved it before the teacher finished?' },
    { who: 'boy', expr: 'smile', text: "I wasn't memorising the calculation. I was understanding how the problem was being solved." },
    { who: 'girl', expr: 'curious', text: 'So when the problem changed slightly, you already knew what to do?' },
    { who: 'boy', expr: 'happy', text: 'Exactly!' },
  ],
  'school-realise-2': [
    { who: 'girl', expr: 'thinking', text: "That's interesting. You were learning the thinking behind the solution." },
    { who: 'boy', expr: 'thinking', text: "I think that's where my design skills were born." },
  ],
  'school-pullback': [
    { who: 'girl', expr: 'smile', text: "Maybe you've been thinking like a designer for much longer than you realised." },
  ],
  'mentor-return': [
    { who: 'mentor', text: 'Sometimes, the skills we need are already there. We just need to recognise them.' },
    { who: 'boy', expr: 'smile', text: "Now I understand. Design wasn't something I started from zero. I was building on the way I naturally approached problems." },
  ],
  'mentor-talk': [
    { who: 'mentor', text: 'Sometimes, the skills we need are already there. We just need to recognise them.' },
  ],

  // ---- Stage 7: The Awakening ----------------------------------------------
  'overlook-arrive': [
    { who: 'girl', expr: 'curious', text: 'So, everything started much earlier than you thought?' },
    { who: 'boy', expr: 'thinking', text: 'Yeah. Looking back, every experience taught me something different.' },
    { who: 'girl', expr: 'speaking', text: 'Even the manufacturing days?' },
    { who: 'boy', expr: 'smile', text: 'Especially those. They helped me understand that I wanted to explore something different.' },
  ],
  'recap-connect': [
    { who: 'girl', expr: 'smile', text: 'All these experiences brought you here.' },
    { who: 'boy', expr: 'speaking', text: 'Manufacturing taught me about the world of work. Exploring UX opened my curiosity. My first workplace gave me the opportunity to experiment.' },
    { who: 'boy', expr: 'smile', text: "My master's helped me understand design principles. And mentorship helped me understand how I think." },
  ],
  identity: [
    { who: 'girl', expr: 'curious', text: 'So, what kind of designer do you want to become?' },
    { who: 'boy', expr: 'speaking', text: "Someone who doesn't just design screens. Someone who understands problems, explores different perspectives and creates meaningful solutions." },
  ],
  'next-adventure': [
    { who: 'girl', expr: 'wink', text: 'Ready for the next adventure?' },
    { who: 'boy', expr: 'happy', text: "Let's see where this takes us." },
  ],
};

// Stage 7: the journey recap, one floating memory per part of the chapter.
export const RECAP = {
  workshop: { title: 'The Old Workshop', text: 'My early career in manufacturing, back in 2022: where I realised I wanted to explore something different.', travel: 3700 },
  discovery: { title: 'The Discovery Path', text: 'Friends introduced me to UX, and the Google UX Design course on Coursera opened my curiosity.', travel: 6330 },
  studio: { title: 'The First Design Studio', text: 'Balwa HCM Cloud Suite: one designer, multiple creative hats. Graphic, motion, visual and product design.', travel: 10190 },
  academy: { title: 'The Knowledge Academy', text: 'Master of Design in Interaction Design at Lovely Professional University, Punjab: understanding the principles behind design.', travel: 12520 },
  camp: { title: "The Mentor's Camp", text: 'Mentorship from UX Anuji: where to start, why to start there, and how I think.', travel: 16100 },
  classroom: { title: 'The School Classroom', text: 'Where it really began: understanding how a problem is solved, not just memorising the answer.', relive: true },
};

// Stage 6: the school memory puzzle. An illustrative example of the method:
// multiplying by 5 is the same as multiplying by 10, then halving.
export const MATH_PUZZLE = {
  example: { problem: '48 × 5 = ?', steps: ['× 5 is the same as × 10, then ÷ 2', '48 × 10 = 480', '480 ÷ 2 = 240'], answer: '240' },
  problem: '64 × 5 = ?',
  correct: ['× 5 is the same as × 10, then ÷ 2', '64 × 10 = 640', '640 ÷ 2 = 320'],
  distractor: '64 + 5 = 69',
  answer: '320',
};

// Stage 5: the facts shown on the campus information board.
export const ACADEMY_INFO = {
  institution: 'Lovely Professional University, Punjab',
  programme: 'Master of Design',
  specialisation: 'Interaction Design',
};

// Learning objects in the academy. These represent areas of design learning,
// not a list of specific coursework.
export const LEARNING_CONTENT = {
  hierarchy: { text: 'Size, contrast and position tell people what to look at first, and what to look at next.', example: 'hierarchy' },
  gestalt: { text: 'We see groups, not pieces. Proximity, similarity, closure and continuity shape how a layout is read.', example: 'gestalt' },
  typography: { text: 'Type sets the voice and the rhythm of a page: the typeface, size, weight and spacing all carry meaning.', example: 'typography' },
  composition: { text: 'Balance, alignment and whitespace guide the eye through a layout and give it calm.', example: 'composition' },
  colour: { text: 'Colour creates mood, contrast and meaning, and it has to stay readable for everyone.', example: 'colour' },
  'usability-principles': { text: 'Clear, consistent and forgiving: people should know what to do next, and be able to recover from mistakes.', example: 'usability' },
  research: { text: 'Learning what people actually do, need and struggle with before deciding what to build.', example: 'research' },
  interviews: { text: 'Open questions, then listening. The most useful insights often come from the stories people tell.', example: 'interviews' },
  'empathy-map': { text: 'What people say, think, do and feel, side by side, so the whole person stays in view.', example: 'empathy' },
  personas: { text: 'A portrait of a type of user, grounded in research rather than guesses.', example: 'persona' },
  affinity: { text: 'Grouping research notes until patterns and themes start to appear.', example: 'affinity' },
  problem: { text: 'Framing the right problem before jumping to a solution.', example: 'problem' },
};

export const PRINCIPLE_CONTENT = {
  hierarchy: 'Visual hierarchy: guiding attention, so the most important thing is seen first.',
  gestalt: 'Gestalt principles: how the mind groups what it sees into meaningful wholes.',
  typography: 'Typography: making words readable, expressive and easy to scan.',
  research: 'User research: starting from what people really need.',
  empathy: 'Empathy: seeing the problem through someone else\'s eyes.',
  patterns: 'Interaction patterns: familiar ways of doing things, so people don\'t have to relearn.',
  usability: 'Usability: making things easy to use, understand and recover from.',
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
