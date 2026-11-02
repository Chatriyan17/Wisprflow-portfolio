// Small visual examples for the academy's learning objects (pure HTML/CSS).
import { LEARNING_CONTENT, PRINCIPLE_CONTENT, ACADEMY_INFO } from '../content/chapter01.js';
import { LEARNING } from '../world/level.js';

const EXAMPLES = {
  hierarchy: `<div class="ex ex-hier"><b>Big idea first</b><i>Then the supporting line</i><span>And finally the small details, read last.</span></div>`,
  gestalt: `<div class="ex ex-gestalt"><div><span></span><span></span><span></span><span></span></div><div><span></span><span></span><span></span><span></span></div><p>Eight identical dots, read as two groups, just because of the space between them.</p></div>`,
  typography: `<div class="ex ex-type"><span style="font:700 26px var(--font-body)">Aa</span><span style="font:400 26px Georgia,serif">Aa</span><span style="font:400 26px var(--font-pixel)">Aa</span><p>Same letters, three different voices.</p></div>`,
  composition: `<div class="ex ex-comp"><div class="a"></div><div class="b"></div><div class="c"></div><p>Aligned to a grid, with room to breathe.</p></div>`,
  colour: `<div class="ex ex-colour"><span style="background:#f6e6d0;color:#1d1222">Readable</span><span style="background:#f2c18d;color:#f6e6d0">Hard to read</span><span style="background:#4fb3a8;color:#1d1222">Calm</span><span style="background:#e04848;color:#fff">Urgent</span></div>`,
  usability: `<div class="ex ex-usab"><span class="msg">Message deleted.</span><button type="button" tabindex="-1">Undo</button><p>A forgiving interface lets people take it back.</p></div>`,
  research: `<div class="ex ex-notes"><span>"I always check the price first."</span><span>"I gave up halfway through."</span><span>"I didn't know where to tap."</span></div>`,
  interviews: `<div class="ex ex-chat"><p class="q">Tell me about the last time you…</p><p class="a">Well, it started when…</p><p class="q">What happened next?</p></div>`,
  empathy: `<div class="ex ex-empathy"><span>Says</span><span>Thinks</span><span>Does</span><span>Feels</span></div>`,
  persona: `<div class="ex ex-persona"><div class="face"></div><div><b>A typical user</b><span>Goals, frustrations and context, drawn from research.</span></div></div>`,
  affinity: `<div class="ex ex-affinity"><div><span></span><span></span><span></span></div><div><span></span><span></span></div><div><span></span><span></span><span></span><span></span></div></div>`,
  problem: `<div class="ex ex-problem"><span class="bad">"We need a new button."</span><span class="arrow">→</span><span class="good">"People can't find how to finish their order."</span></div>`,
};

export function learningCard(id) {
  const meta = LEARNING.find((l) => l.id === id);
  const c = LEARNING_CONTENT[id];
  return {
    eyebrow: meta.area === 'fundamentals' ? 'Design Fundamentals · a learning area' : 'Understanding People · a learning area',
    title: meta.name,
    html: `<p class="lede">${c.text}</p>${EXAMPLES[c.example] || ''}`,
  };
}

export function principleCard(id, name) {
  return {
    eyebrow: 'The Foundation Wall',
    title: name,
    html: `<p class="lede">${PRINCIPLE_CONTENT[id]}</p>`,
  };
}

export function academyInfoCard() {
  const i = ACADEMY_INFO;
  return {
    eyebrow: 'The Knowledge Academy',
    title: 'Academic information',
    html: `<dl class="info-board">
      <dt>Institution</dt><dd>${i.institution}</dd>
      <dt>Programme</dt><dd>${i.programme}</dd>
      <dt>Specialisation</dt><dd>${i.specialisation}</dd>
    </dl>`,
  };
}
