// js/apps/news.js — Apple News app for the macOS Sequoia web clone
// Self-contained; no imports from apps.js. Uses api.store/api.load for persistence.
import { el, setHTML } from '../dom.js';

// ─── Mock article data ────────────────────────────────────────────────────────

const CHANNELS = [
  { id: 'top',      label: 'Top Stories',  glyph: '📰' },
  { id: 'tech',     label: 'Technology',   glyph: '💻' },
  { id: 'business', label: 'Business',     glyph: '📈' },
  { id: 'sports',   label: 'Sports',       glyph: '🏆' },
  { id: 'science',  label: 'Science',      glyph: '🔬' },
  { id: 'health',   label: 'Health',       glyph: '🏥' },
  { id: 'world',    label: 'World',        glyph: '🌍' },
  { id: 'arts',     label: 'Arts & Culture', glyph: '🎭' },
];

const ARTICLES = [
  // Top Stories
  {
    id: 'a1', channel: 'top', hero: true,
    headline: 'Artificial Intelligence Transforms How the World Works',
    source: 'The Daily Report', time: '2h ago',
    gradient: 'linear-gradient(135deg,#1a1a2e 0%,#16213e 40%,#0f3460 100%)',
    accent: '#e94560',
    summary: 'From healthcare breakthroughs to creative industries, AI is reshaping economies and societies at a pace few anticipated. Governments and corporations alike are racing to harness the technology — and manage its risks.',
    body: `Artificial intelligence has become the defining technological force of the decade. Once confined to research labs and narrow applications, it now permeates virtually every industry, from medicine and law to creative arts and finance.

The shift accelerated dramatically with the arrival of large language models capable of understanding and generating human-like text. Companies that once dismissed the technology as hype have bet billions on it, while entire new categories of software — and jobs — have emerged almost overnight.

"We are living through a genuine inflection point," said one prominent technology researcher. "The pace of change is unlike anything we've seen since the internet itself."

Governments around the world have scrambled to draft regulatory frameworks, attempting to balance innovation with concerns about bias, privacy, and the displacement of workers. Progress has been uneven: some nations have moved quickly to establish guardrails, while others have prioritized growth over governance.

Critics worry that the benefits are accruing disproportionately to wealthy nations and large corporations, widening existing inequalities. Meanwhile, proponents argue that AI represents the most powerful tool humanity has yet created for solving problems like climate change, disease, and poverty.

What is clear is that the question is no longer whether AI will transform the world, but how — and whether societies can adapt fast enough to guide that transformation wisely.`,
  },
  {
    id: 'a2', channel: 'top', hero: false,
    headline: 'Global Markets Rally After Central Bank Policy Shift',
    source: 'Financial Times', time: '3h ago',
    gradient: 'linear-gradient(135deg,#134e5e,#71b280)',
    accent: '#71b280',
    summary: 'Equity markets surged worldwide as investors welcomed a softer tone from major central banks, raising hopes that a long cycle of rate increases may finally be ending.',
    body: `Stock markets around the globe climbed sharply after the Federal Reserve and European Central Bank both signaled a potential pause in their interest-rate hiking cycles, citing easing inflation pressures and signs of economic resilience.

The S&P 500 gained 2.1% in its best single-day performance in months, while European and Asian benchmarks posted similar advances. Technology shares, which are particularly sensitive to interest-rate expectations, led the rally.

Currency markets also moved decisively, with the dollar weakening against major peers as traders reassessed expectations for monetary policy. Bond yields fell, reflecting increased confidence that the era of aggressive tightening may be drawing to a close.

Analysts cautioned that the pivot is not guaranteed. Inflation, while declining, remains above target in most major economies, and labor markets have stayed resilient in ways that could complicate the case for cutting rates. A single strong jobs report or renewed price pressure could quickly reverse sentiment.

"Markets tend to get ahead of themselves in moments like this," noted one veteran fund manager. "The data will ultimately decide when and how quickly rates come down."

For now, however, the mood is cautiously optimistic — a welcome change after a prolonged period of uncertainty that has kept investors on edge.`,
  },
  {
    id: 'a3', channel: 'top', hero: false,
    headline: 'Space Agency Announces Historic Mission to Europa',
    source: 'Space & Science Weekly', time: '5h ago',
    gradient: 'linear-gradient(135deg,#0f0c29,#302b63,#24243e)',
    accent: '#a78bfa',
    summary: 'Scientists confirmed a robotic lander will attempt to drill through Europa\'s icy crust in search of signs of life in the subsurface ocean beneath.',
    body: `In what many scientists are calling the most consequential planetary mission in a generation, space agencies announced a fully funded plan to land a robotic spacecraft on Jupiter's moon Europa and drill through its thick ice shell to sample the ocean believed to lie beneath.

The mission, scheduled to launch within the next several years, would be humanity's first direct attempt to access a liquid-water environment beyond Earth. Europa's ocean is thought to contain more water than all of Earth's oceans combined, and its contact with a rocky seafloor creates conditions that some researchers believe could support life.

The lander would carry a suite of instruments designed to detect chemical signatures of biological activity, including amino acids and other organic compounds. Data would be transmitted back over a period of months before the spacecraft's expected end of life.

"This is the mission we've been dreaming about for decades," said one of the principal scientists. "We're not claiming we'll find life — but we're finally going to look."

The announcement drew widespread excitement from the scientific community, as well as renewed debate about planetary protection protocols and the ethical dimensions of potentially introducing Earth microbes to another world.

Funding and international cooperation remain key challenges. Several partner nations have pledged contributions to the mission, but the final configuration and launch date are still being negotiated among participating agencies.`,
  },
  {
    id: 'a4', channel: 'top', hero: false,
    headline: 'New Study Reveals Surprising Benefits of Urban Green Spaces',
    source: 'Nature & Society', time: '6h ago',
    gradient: 'linear-gradient(135deg,#2d6a4f,#52b788)',
    accent: '#95d5b2',
    summary: 'Researchers found that even small parks and tree-lined streets measurably improve mental health, reduce crime, and increase property values in dense urban areas.',
    body: `A landmark study tracking thousands of residents across dozens of cities has found that access to green space — even in limited quantities — produces significant and measurable improvements in mental health, community cohesion, and economic outcomes.

The research, which followed participants over a decade, found that people living within a short walk of parks, gardens, or tree-lined streets reported lower rates of anxiety and depression, higher life satisfaction, and stronger social connections than those in comparably dense neighborhoods without green infrastructure.

The effects were particularly pronounced for children, elderly residents, and lower-income households, suggesting that equitable access to nature could serve as a powerful tool for reducing health disparities.

Urban planners and policymakers have long argued for more green space on quality-of-life grounds, but the new study provides unusually rigorous evidence by controlling for income, demographics, and pre-existing health conditions. The findings are likely to influence city planning priorities in the years ahead.

Crime statistics also showed a correlation: neighborhoods with well-maintained parks experienced lower rates of certain property crimes, supporting theories about community space and social oversight.

The researchers emphasized that the quality and accessibility of green space matters as much as its presence. Parks that feel unsafe or are poorly maintained may not deliver the same benefits as welcoming, well-resourced ones.`,
  },

  // Technology
  {
    id: 'a5', channel: 'tech', hero: false,
    headline: 'Apple Unveils Next-Generation Chip Architecture',
    source: 'TechCrunch', time: '1h ago',
    gradient: 'linear-gradient(135deg,#434343,#000000)',
    accent: '#0a84ff',
    summary: 'The new silicon delivers unprecedented performance-per-watt, with on-device AI capabilities that eliminate the need for cloud processing in most everyday tasks.',
    body: `Apple has announced its latest chip design, promising a substantial leap in both performance and efficiency over its predecessors. The new architecture features expanded neural engine capabilities, allowing complex AI tasks to run entirely on-device rather than being offloaded to cloud servers.

The chip, designed using a cutting-edge fabrication process, delivers roughly twice the machine learning performance of its predecessor while consuming significantly less power. This enables real-time language translation, advanced photo processing, and other AI-intensive features on devices that run all day on a single charge.

The announcement drew immediate comparisons to competitors' approaches to on-device AI, with analysts noting that Apple's tight integration of hardware and software gives it a meaningful advantage in latency and privacy — tasks that never leave the device cannot be intercepted or stored remotely.

"This is about democratizing AI," said one analyst covering the semiconductor industry. "Putting this capability in every device, not just data centers, fundamentally changes what's possible for developers and users."

The chip will appear first in high-end devices before eventually making its way across the entire product line. Developers have already begun testing applications that take advantage of the expanded neural engine, with several promising demonstrations shown during the announcement event.

Battery life figures cited by the company suggest real-world improvements of several hours for typical usage patterns, a claim that will be subject to independent testing in the weeks ahead.`,
  },
  {
    id: 'a6', channel: 'tech', hero: false,
    headline: 'Open Source AI Model Reaches Human-Level Reasoning on Benchmarks',
    source: 'Ars Technica', time: '4h ago',
    gradient: 'linear-gradient(135deg,#355c7d,#6c5b7b,#c06c84)',
    accent: '#c06c84',
    summary: 'A collaborative research consortium released a freely available model that matches or exceeds the performance of leading proprietary systems on standardized reasoning tests.',
    body: `A newly released open-source AI model has achieved scores on par with the most capable proprietary large language models across a broad range of standardized reasoning benchmarks, a development that researchers say will dramatically lower the barrier to building advanced AI applications.

The model, released under a permissive license by a consortium of academic and independent research groups, can be downloaded and run on hardware available to most well-resourced institutions — and, in a smaller configuration, even on consumer-grade machines.

The release immediately sparked debate in the AI community. Proponents celebrated it as a democratizing force, arguing that concentrating frontier AI capabilities in a handful of large companies poses risks to competition and innovation. Critics worried about the potential for misuse, citing concerns about the ease with which open models can be fine-tuned for harmful purposes.

"We've thought hard about the dual-use concerns," said one of the lead researchers. "Our assessment is that the benefits of open access outweigh the risks, particularly given the capabilities already available through commercial APIs."

The benchmark results, while impressive, also came with caveats. Some researchers pointed out that standardized tests do not fully capture real-world performance, and that the model shows limitations in areas such as long-form reasoning and factual reliability that don't always show up in aggregate scores.

Independent developers have already begun fine-tuning the model for specialized applications in medicine, law, and education, with early results suggesting that domain-specific versions may outperform much larger general-purpose models on targeted tasks.`,
  },

  // Business
  {
    id: 'a7', channel: 'business', hero: false,
    headline: 'Electric Vehicle Market Reaches Tipping Point as Prices Fall',
    source: 'Bloomberg', time: '2h ago',
    gradient: 'linear-gradient(135deg,#093028,#237a57)',
    accent: '#34c759',
    summary: 'For the first time, the average price of a new electric vehicle is set to fall below that of a comparable combustion-engine car in multiple major markets.',
    body: `The electric vehicle industry is approaching a long-anticipated milestone: price parity with traditional internal combustion engine vehicles. New analysis shows that in several major markets, average EV prices are poised to fall below equivalent gasoline cars within the next 12 to 18 months, a shift that analysts say will unlock mass-market adoption.

The convergence is being driven by falling battery costs, increased competition among manufacturers, and economies of scale as production volumes grow. Battery prices have declined more than 80% over the past decade and continue to fall, with further reductions expected as new chemistries and manufacturing techniques come online.

Several automakers have already begun competing aggressively on price, cutting margins on entry-level EVs in a bid to gain market share before the competitive landscape hardens. Some legacy manufacturers have acknowledged that the transition will be painful in the short term but view it as essential to long-term survival.

The infrastructure challenge remains. Public charging availability, while improving, still lags consumer expectations in many regions, particularly in rural areas. Range anxiety — real or perceived — continues to discourage a meaningful segment of potential buyers.

Government incentives have accelerated adoption in some markets, though policy uncertainty creates risks for both consumers and manufacturers. Several major economies are reviewing subsidy programs, and the outcome of those reviews will have significant implications for the pace of transition.

"We've crossed a threshold," said one EV industry analyst. "The question is no longer whether EVs will dominate — it's how long the transition will take and who will come out on top."`,
  },
  {
    id: 'a8', channel: 'business', hero: false,
    headline: 'Startup Valuations Rebound as Venture Funding Returns',
    source: 'Wall Street Journal', time: '7h ago',
    gradient: 'linear-gradient(135deg,#8e2de2,#4a00e0)',
    accent: '#bf5af2',
    summary: 'After two years of contraction, venture capital investment is flowing again, with AI startups commanding multiples that recall the froth of the previous boom cycle.',
    body: `Venture capital investment is staging a recovery after two difficult years, with fundraising and deal volumes picking up sharply and valuations climbing toward levels not seen since the peak of the previous cycle. AI companies are at the center of the revival, attracting capital at a pace that has surprised even optimistic observers.

The renewed enthusiasm reflects genuine commercial traction in AI-related businesses, not just speculative excitement. A number of startups that raised money during the last boom have since demonstrated real revenue growth, giving investors confidence that the technology can generate returns.

Some market observers are already drawing comparisons to prior boom cycles and warning that froth is building. Valuations in certain sectors have risen faster than underlying business metrics, and the bar for rigorous due diligence appears to be falling as competition for deals intensifies.

"There's a fear of missing out again," said one venture partner at a major firm. "And that fear is well-founded — the AI opportunity is real. But some of these valuations are pricing in outcomes that may take a decade to materialize."

Late-stage companies are also finding it easier to raise capital, with crossover investors and growth funds re-entering the private market after a prolonged absence. Several startups have quietly shelved IPO plans in favor of another private funding round, waiting for a more favorable public market environment.

For founders, the improved climate is welcome after a period of brutal renegotiation and down rounds. Many used the contraction to cut costs and refocus, and they are entering the new cycle in better operational shape than their predecessors did.`,
  },

  // Sports
  {
    id: 'a9', channel: 'sports', hero: false,
    headline: 'Championship Final Delivers an Instant Classic',
    source: 'ESPN', time: '1h ago',
    gradient: 'linear-gradient(135deg,#c94b4b,#4b134f)',
    accent: '#ff6b6b',
    summary: 'In a game that will be talked about for years, the underdog team rallied from a 20-point deficit to claim the title in the final moments.',
    body: `In one of the most dramatic championship finales in recent memory, an underdog team overcame a massive deficit to claim the title in the game's dying seconds, sending their supporters into rapturous celebration and leaving the heavily favored opponent stunned.

The contest appeared to be going according to script through the first three quarters, with the dominant side building a commanding lead that seemed insurmountable. Then, in a sequence of plays that coaches will study for years, the momentum shifted completely.

The turning point came midway through the final period, when a sequence of forced turnovers led to a rapid reversal. The crowd, largely composed of neutral observers, shifted its allegiance to the underdogs as the improbable comeback gathered steam.

"I've been doing this for twenty years and I've never seen anything like it," said one of the coaching staff afterward. "The composure they showed, the belief — I genuinely don't know where it came from. It was something special."

The winning team's star player finished with a performance for the ages, recording figures that will be discussed alongside the greatest individual championship performances in the sport's history. More remarkable was the collective nature of the effort — this was a team triumph in the fullest sense.

For the losing side, there will be difficult questions to answer in the off-season about leadership, preparation, and the psychological fragility that allowed such a lead to evaporate. For now, however, the sports world belongs to the champions.`,
  },
  {
    id: 'a10', channel: 'sports', hero: false,
    headline: 'Record Transfer Fee Set as Football Star Moves to New Club',
    source: 'The Guardian', time: '3h ago',
    gradient: 'linear-gradient(135deg,#11998e,#38ef7d)',
    accent: '#38ef7d',
    summary: 'A blockbuster deal reportedly worth over €200 million has shattered the previous transfer record, reigniting debate about financial sustainability in professional sport.',
    body: `The football transfer market has reached a new financial frontier with the completion of a deal that, if confirmed at reported figures, will shatter the previous world record. The player, widely regarded as one of the two or three best in the world at his position, signed a multi-year contract that makes him the highest-paid player in the sport's history.

The move has divided opinion. Supporters of the acquiring club celebrate the signing as a statement of ambition and a potential catalyst for success in the sport's biggest competitions. Critics see it as further evidence that professional football has become unmoored from financial reality, accessible only to clubs backed by sovereign wealth or oligarchic resources.

Regulatory bodies have faced persistent criticism for their inability to impose meaningful financial discipline on the sport's biggest spenders. The latest deal will intensify that pressure, with several clubs and national associations calling for urgent reform of financial fair play rules.

The player himself spoke with characteristic confidence at his unveiling, expressing certainty that his new club will win the league title and compete seriously for the Champions League. Whether the transfer fee represents value will ultimately be judged on trophy count.

Player agents and intermediaries stand to earn tens of millions in commissions from the deal, fueling long-standing calls for greater transparency in the transfer system. The total economic activity generated by a single player's movement — including commercial deals, merchandise, and broadcasting uplift — can significantly exceed the headline transfer figure.`,
  },

  // Science
  {
    id: 'a11', channel: 'science', hero: false,
    headline: 'Breakthrough in Fusion Energy Edges Humanity Closer to Clean Power',
    source: 'Scientific American', time: '30m ago',
    gradient: 'linear-gradient(135deg,#f7971e,#ffd200)',
    accent: '#ffd200',
    summary: 'Researchers achieved sustained net energy gain from fusion for the second time, confirming earlier results and marking a pivotal step toward commercial viability.',
    body: `Scientists have confirmed a second sustained instance of net energy gain from nuclear fusion, a result that significantly strengthens confidence that the technology could eventually become a viable source of clean, virtually limitless power.

The experiment, conducted at a major national laboratory, produced more energy than was used to initiate the fusion reaction — a threshold long considered the critical technical barrier to commercial fusion. The result was slightly above the record set in an earlier experiment, suggesting that the gain is reproducible and can be incrementally improved.

Fusion, which powers the sun and stars, has long been called the energy source of the future — and, critics note, always will be. Decades of research have produced enormous scientific understanding but no commercial reactor. The new results have renewed optimism that the commercialization timeline, while still measured in years or decades, is not purely theoretical.

"This is no longer a question of whether it's possible," said the laboratory's director. "The question now is engineering — how do we build a system that runs continuously and delivers power to the grid economically."

Private investment in fusion has grown dramatically in recent years, with dozens of startups pursuing a variety of technical approaches. Several have announced partnerships with utilities and governments, though none has yet built a device that approaches the scale needed for commercial generation.

The scientific community is also debating how to accelerate progress through international collaboration. Existing frameworks for sharing research face political complications, but most researchers agree that fusion is too important and too difficult for any single nation to solve alone.`,
  },
  {
    id: 'a12', channel: 'science', hero: false,
    headline: 'Ancient DNA Reveals Surprising Origins of Early Civilizations',
    source: 'Nature', time: '8h ago',
    gradient: 'linear-gradient(135deg,#3f2b96,#a8c0ff)',
    accent: '#a8c0ff',
    summary: 'A massive genomic study has upended long-held theories about where and how the world\'s first complex societies emerged.',
    body: `A sweeping new analysis of ancient DNA recovered from hundreds of archaeological sites is challenging fundamental assumptions about the origins of early civilization, revealing patterns of population movement, mixing, and cultural exchange that are far more complex than the textbook narrative suggests.

The study, which draws on genomic data spanning thousands of years and dozens of regions, found evidence of large-scale migrations that carried both agricultural practices and cultural innovations across continents far earlier than previously understood. Some groups once thought to be isolated appear to have been connected by long-range networks of exchange.

The findings have immediate implications for ongoing debates about the relative roles of migration versus independent invention in the spread of farming, writing, metallurgy, and other defining features of civilization. In several cases, the genomic evidence supports the migration hypothesis more strongly than existing archaeological evidence alone could demonstrate.

Researchers were careful to note that genetics is one line of evidence among many, and that genomic ancestry does not translate directly into cultural continuity. A population can adopt the practices of migrants without being descended from them, and vice versa.

The study is expected to prompt revision of several long-standing archaeological interpretations, and scholars in the field have already begun debating its implications. Some welcome the additional clarity; others note that the volume and complexity of the genomic data creates its own interpretive challenges.

"DNA doesn't lie, but it doesn't always answer the question you're asking," said one archaeologist who was not involved in the research. "This is a powerful tool. We're still learning how to use it wisely."`,
  },

  // Health
  {
    id: 'a13', channel: 'health', hero: false,
    headline: 'New Class of Weight-Loss Drugs Reshapes Medicine',
    source: 'STAT News', time: '4h ago',
    gradient: 'linear-gradient(135deg,#f953c6,#b91d73)',
    accent: '#f953c6',
    summary: 'The rapid expansion of GLP-1 receptor agonists is transforming how doctors treat obesity, diabetes, and potentially a range of other chronic conditions.',
    body: `A generation of medications that mimic gut hormones to suppress appetite and regulate blood sugar is transforming medicine at a pace that has startled even enthusiastic proponents. Demand has outstripped supply, reshaping pharmaceutical supply chains and prompting regulatory agencies to revise approval pathways.

The drugs, originally developed for type 2 diabetes, have demonstrated remarkable efficacy for weight loss in clinical trials — average losses of 15 to 20 percent of body weight, far exceeding earlier treatments. Early data also suggests benefits for cardiovascular health, liver disease, and potentially other conditions, triggering a wave of new trials to explore the drugs' broader therapeutic potential.

The public health implications are profound. Obesity affects hundreds of millions of people globally and is associated with a cascade of costly chronic conditions. If these medications can durably reduce weight at scale, the downstream effects on disease burden could be enormous.

Access and cost remain significant barriers. The medications are expensive, and insurance coverage is inconsistent, raising equity concerns about who will benefit from the breakthrough. Compounding pharmacies have attempted to fill supply gaps, creating quality-control and regulatory challenges.

Long-term data are still accumulating. Most large clinical trials have run for one to two years; what happens to patients who stop taking the drugs — whether the weight returns, and how quickly — is an important and not fully resolved question.

The pharmaceutical industry is responding to the opportunity at scale, with multiple companies racing to develop next-generation molecules that might be more effective, have fewer side effects, or could eventually be taken in pill form rather than by injection.`,
  },

  // World
  {
    id: 'a14', channel: 'world', hero: false,
    headline: 'Climate Summit Produces Landmark Agreement on Emissions',
    source: 'Reuters', time: '2h ago',
    gradient: 'linear-gradient(135deg,#005c97,#363795)',
    accent: '#4fc3f7',
    summary: 'After difficult negotiations, nearly 150 nations signed a binding commitment to dramatically accelerate the phase-out of fossil fuels over the next decade.',
    body: `Delegates representing nearly 150 nations signed a landmark climate accord that commits signatories to a binding schedule for phasing out the use of coal, oil, and natural gas far faster than existing international agreements require. The deal, reached after days of difficult late-night negotiations, was greeted with relief by many observers who had feared another round of incremental pledges.

The agreement sets specific targets for reducing fossil fuel consumption by defined percentages at five-year intervals, with independent verification mechanisms that previous accords have lacked. Countries that fail to meet their commitments face a combination of financial penalties and trade consequences, a step that proponents say gives the agreement genuine teeth.

Several major emitters held out for extended timelines and transition provisions that critics argue undermine the deal's ambition. The final text reflects a series of hard compromises, and some environmental groups argued that it still falls short of what the science demands.

"Perfect is the enemy of good," said one senior negotiator from a small island nation facing existential sea-level threats. "This isn't everything we wanted. But it is real, and it is binding, and that matters enormously."

Financing for developing nations was one of the most contentious issues. Wealthy countries made commitments to fund clean energy transitions in lower-income economies, though the precise mechanisms and governance of those funds remain to be worked out in follow-on negotiations.

Implementation will now become the central challenge. Previous climate agreements have suffered from the gap between commitment and action, and the new accord's verification architecture will be tested as the first compliance deadlines approach.`,
  },

  // Arts
  {
    id: 'a15', channel: 'arts', hero: false,
    headline: 'Streaming Era Produces a New Golden Age of Documentary Film',
    source: 'The New Yorker', time: '1d ago',
    gradient: 'linear-gradient(135deg,#485563,#29323c)',
    accent: '#ffd89b',
    summary: 'With budgets and audiences that theatrical distribution could never provide, documentary filmmakers are telling stories of unprecedented scope and ambition.',
    body: `The documentary form, long confined to the margins of mainstream entertainment, has entered an extraordinary moment. Streaming platforms hungry for content have poured resources into non-fiction filmmaking, enabling projects of ambition and scale that theatrical distribution could rarely support, and delivering them to audiences of a size unimaginable a decade ago.

The results have been uneven but, at their best, genuinely remarkable. Multi-part documentary series have become a distinctive format — part investigative journalism, part cinema, part long-form storytelling — that attracts both critical acclaim and massive viewership. Several have had measurable real-world impacts, prompting legal reviews, policy changes, and renewed public attention to stories that had previously faded from memory.

Documentary filmmakers speak of a complicated relationship with the streaming economy. The money is real and the audience is vast, but so are the pressures: toward digestibility, toward emotional arcs that audiences will stick with across multiple episodes, toward subjects with pre-existing name recognition.

"There's a version of this that's wonderful," said one veteran director whose latest film premiered on a major platform. "And there's a version that's just expensive reality television with a more serious soundtrack. The line between them isn't always obvious, even to us."

The theatrical documentary has not disappeared, but its role has changed. The festival circuit remains essential for prestige and discovery, but even celebrated films often find their largest audiences on streaming, sometimes years after their initial release.

What seems beyond dispute is that documentaries are being made, watched, and argued about with an intensity that no one predicted at the dawn of the streaming era. Whatever its compromises, that is a development the form's practitioners are inclined to celebrate.`,
  },
];

// ─── Gradient image placeholder ──────────────────────────────────────────────

function makeGradientImg(gradient, accent, glyph, cls) {
  const d = el(cls || 'news-img');
  d.style.cssText = `background:${gradient};position:relative;overflow:hidden;`;
  const overlay = el('news-img-overlay');
  overlay.style.cssText = `position:absolute;inset:0;display:flex;align-items:center;justify-content:center;`;
  const g = el('news-img-glyph');
  g.textContent = glyph || '📰';
  g.style.cssText = `font-size:48px;filter:drop-shadow(0 2px 8px rgba(0,0,0,0.4));opacity:0.85;`;
  overlay.append(g);
  const stripe = el('news-img-stripe');
  stripe.style.cssText = `position:absolute;bottom:0;left:0;right:0;height:3px;background:${accent};`;
  d.append(overlay, stripe);
  return d;
}

// ─── Main export ─────────────────────────────────────────────────────────────

export function content(win, api) {
  // Load persisted state
  let saved = api.load('saved', []);           // array of article ids
  let activeChannel = api.load('channel', 'top');

  // ── Root layout ──────────────────────────────────────────────────────────
  const root = el('news-root');

  // ── Sidebar ──────────────────────────────────────────────────────────────
  const sidebar = el('news-sidebar');

  const sidebarHeader = setHTML('news-sidebar-header', `
    <div class="news-logo">📰</div>
    <div class="news-sidebar-title">News</div>
  `);
  sidebar.append(sidebarHeader);

  const channelList = el('news-channel-list');

  // "Saved" channel at top
  const savedChannel = { id: 'saved', label: 'Saved Stories', glyph: '🔖' };
  const allChannels = [savedChannel, ...CHANNELS];

  allChannels.forEach((ch) => {
    const row = el('news-channel-row', 'button');
    row.dataset.chid = ch.id;
    row.innerHTML = `<span class="nch-glyph">${ch.glyph}</span><span class="nch-label">${ch.label}</span>`;
    if (ch.id === activeChannel) row.classList.add('active');
    row.addEventListener('click', () => {
      selectChannel(ch.id);
    });
    channelList.append(row);
  });

  sidebar.append(channelList);
  root.append(sidebar);

  // ── Main content area ─────────────────────────────────────────────────────
  const mainArea = el('news-main');
  root.append(mainArea);

  // ── Reading pane (hidden by default) ────────────────────────────────────
  const readPane = el('news-reader');
  readPane.style.display = 'none';
  root.append(readPane);

  // ── Feed rendering ────────────────────────────────────────────────────────
  let currentView = 'feed'; // 'feed' | 'reader'

  function articlesForChannel(chId) {
    if (chId === 'saved') {
      return ARTICLES.filter((a) => saved.includes(a.id));
    }
    return ARTICLES.filter((a) => a.channel === chId);
  }

  function channelInfo(chId) {
    return allChannels.find((c) => c.id === chId) || allChannels[0];
  }

  function selectChannel(chId) {
    activeChannel = chId;
    api.store('channel', chId);
    channelList.querySelectorAll('.news-channel-row').forEach((r) => {
      r.classList.toggle('active', r.dataset.chid === chId);
    });
    closeReader();
    renderFeed(chId);
  }

  function isSaved(id) {
    return saved.includes(id);
  }

  function toggleSave(id) {
    if (isSaved(id)) {
      saved = saved.filter((s) => s !== id);
      api.toast('Removed from Saved Stories');
    } else {
      saved.push(id);
      api.toast('Saved to Reading List  🔖');
    }
    api.store('saved', saved);
    // Refresh save buttons in feed
    mainArea.querySelectorAll(`[data-save-btn="${id}"]`).forEach((btn) => {
      btn.classList.toggle('saved', isSaved(id));
      btn.title = isSaved(id) ? 'Remove from Saved' : 'Save Story';
      btn.textContent = isSaved(id) ? '🔖' : '◻';
    });
    // Refresh save button in reader if open
    if (currentView === 'reader') {
      readPane.querySelectorAll(`[data-save-btn="${id}"]`).forEach((btn) => {
        btn.classList.toggle('saved', isSaved(id));
        btn.title = isSaved(id) ? 'Remove from Saved' : 'Save Story';
        btn.textContent = isSaved(id) ? '🔖' : '◻';
      });
    }
  }

  function openArticle(article) {
    currentView = 'reader';
    mainArea.style.display = 'none';
    readPane.style.display = '';

    const glyphs = { top: '📰', tech: '💻', business: '📈', sports: '🏆', science: '🔬', health: '🏥', world: '🌍', arts: '🎭', saved: '🔖' };
    const glyph = glyphs[article.channel] || '📰';

    readPane.innerHTML = '';

    // Back bar
    const backBar = el('news-reader-backbar');
    const backBtn = el('news-back-btn', 'button');
    backBtn.innerHTML = '◀ Back';
    backBtn.addEventListener('click', closeReader);

    const saveBtn = el('news-reader-save-btn', 'button');
    saveBtn.dataset.saveBtnAttr = article.id;
    saveBtn.dataset.saveBtn = article.id;
    saveBtn.classList.toggle('saved', isSaved(article.id));
    saveBtn.title = isSaved(article.id) ? 'Remove from Saved' : 'Save Story';
    saveBtn.textContent = isSaved(article.id) ? '🔖' : '◻';
    saveBtn.addEventListener('click', () => toggleSave(article.id));

    backBar.append(backBtn, saveBtn);
    readPane.append(backBar);

    // Hero image
    const heroImg = makeGradientImg(article.gradient, article.accent, glyph, 'news-reader-hero');
    readPane.append(heroImg);

    // Article metadata
    const meta = el('news-reader-meta');
    meta.innerHTML = `
      <div class="nrm-source">${article.source}</div>
      <div class="nrm-time">${article.time}</div>
    `;
    readPane.append(meta);

    // Headline
    const headline = el('news-reader-headline');
    headline.textContent = article.headline;
    readPane.append(headline);

    // Summary (lead paragraph)
    const summary = el('news-reader-summary');
    summary.textContent = article.summary;
    readPane.append(summary);

    // Body
    const body = el('news-reader-body');
    // Split into paragraphs
    article.body.split('\n\n').forEach((para) => {
      if (para.trim()) {
        const p = el('news-reader-para', 'p');
        p.textContent = para.trim();
        body.append(p);
      }
    });
    readPane.append(body);

    // Related / end card
    const endCard = setHTML('news-reader-end', `
      <div class="nre-label">Continue Reading</div>
      <div class="nre-hint">More stories in ${channelInfo(article.channel).label}</div>
    `);
    endCard.addEventListener('click', closeReader);
    readPane.append(endCard);

    readPane.scrollTop = 0;
  }

  function closeReader() {
    currentView = 'feed';
    readPane.style.display = 'none';
    mainArea.style.display = '';
    mainArea.scrollTop = 0;
  }

  function renderFeed(chId) {
    mainArea.innerHTML = '';
    const articles = articlesForChannel(chId);
    const ch = channelInfo(chId);

    // Feed header
    const header = el('news-feed-header');
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    header.innerHTML = `
      <div class="nfh-channel">${ch.glyph} ${ch.label}</div>
      <div class="nfh-date">${dateStr}</div>
    `;
    mainArea.append(header);

    if (articles.length === 0) {
      const empty = el('news-empty');
      if (chId === 'saved') {
        empty.innerHTML = `<div class="ne-glyph">🔖</div><div class="ne-msg">No saved stories yet</div><div class="ne-sub">Tap ◻ on any article to save it here</div>`;
      } else {
        empty.innerHTML = `<div class="ne-glyph">📭</div><div class="ne-msg">No stories found</div>`;
      }
      mainArea.append(empty);
      return;
    }

    // Hero article (only for non-saved feeds with a hero article)
    const heroArticle = chId !== 'saved' ? articles.find((a) => a.hero) : null;
    if (heroArticle) {
      const heroCard = buildHeroCard(heroArticle);
      mainArea.append(heroCard);
    }

    // Regular cards
    const cardFeed = el('news-card-feed');
    const nonHero = chId !== 'saved'
      ? articles.filter((a) => !a.hero)
      : articles;

    nonHero.forEach((article) => {
      const card = buildCard(article);
      cardFeed.append(card);
    });

    mainArea.append(cardFeed);
  }

  function buildHeroCard(article) {
    const glyphs = { top: '📰', tech: '💻', business: '📈', sports: '🏆', science: '🔬', health: '🏥', world: '🌍', arts: '🎭' };
    const glyph = glyphs[article.channel] || '📰';

    const card = el('news-hero-card');

    const img = makeGradientImg(article.gradient, article.accent, glyph, 'news-hero-img');
    card.append(img);

    const content = el('news-hero-content');
    const badge = el('news-hero-badge');
    badge.textContent = `${article.source} · ${article.time}`;
    const headline = el('news-hero-headline');
    headline.textContent = article.headline;
    const summary = el('news-hero-summary');
    summary.textContent = article.summary;

    const actions = el('news-hero-actions');
    const readBtn = el('news-hero-read-btn', 'button');
    readBtn.textContent = 'Read Story';
    readBtn.addEventListener('click', () => openArticle(article));

    const saveBtn = el('news-save-btn', 'button');
    saveBtn.dataset.saveBtn = article.id;
    saveBtn.classList.toggle('saved', isSaved(article.id));
    saveBtn.title = isSaved(article.id) ? 'Remove from Saved' : 'Save Story';
    saveBtn.textContent = isSaved(article.id) ? '🔖' : '◻';
    saveBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleSave(article.id); });

    actions.append(readBtn, saveBtn);
    content.append(badge, headline, summary, actions);
    card.append(content);

    card.addEventListener('click', (e) => {
      if (!e.target.closest('button')) openArticle(article);
    });

    return card;
  }

  function buildCard(article) {
    const glyphs = { top: '📰', tech: '💻', business: '📈', sports: '🏆', science: '🔬', health: '🏥', world: '🌍', arts: '🎭', saved: '🔖' };
    const glyph = glyphs[article.channel] || '📰';

    const card = el('news-card');

    const img = makeGradientImg(article.gradient, article.accent, glyph, 'news-card-img');
    card.append(img);

    const body = el('news-card-body');
    const source = el('news-card-source');
    source.textContent = `${article.source} · ${article.time}`;
    const headline = el('news-card-headline');
    headline.textContent = article.headline;
    const summary = el('news-card-summary');
    summary.textContent = article.summary;

    const footer = el('news-card-footer');
    const saveBtn = el('news-save-btn', 'button');
    saveBtn.dataset.saveBtn = article.id;
    saveBtn.classList.toggle('saved', isSaved(article.id));
    saveBtn.title = isSaved(article.id) ? 'Remove from Saved' : 'Save Story';
    saveBtn.textContent = isSaved(article.id) ? '🔖' : '◻';
    saveBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleSave(article.id); });

    footer.append(saveBtn);
    body.append(source, headline, summary, footer);
    card.append(body);

    card.addEventListener('click', (e) => {
      if (!e.target.closest('button')) openArticle(article);
    });

    return card;
  }

  // Initial render
  renderFeed(activeChannel);

  return root;
}
