const STOPWORDS = new Set([
  'about','above','after','again','against','because','been','before','being','below','between','both','cannot','could',
  'during','each','from','further','have','having','here','into','itself','more','most','once','only','other','ought',
  'same','should','some','such','than','that','their','them','then','there','these','they','this','those','through','under',
  'until','very','were','what','when','where','which','while','with','within','would','your','yours','shall','must',
  'they','their','there','these','those','will','have','been','were','also','such','other','some','only','than','then',
  'every','each','many','much','any','all','both','few','nor','not','but','and','for','are','was','were','you','our',
  'its','his','her','out','own','per','via','one','two','new','old','any','may','might','one','upon','whether','using',
]);

function normaliseWhitespace(s: string) {
  return s.replace(/\s+/g, ' ').trim();
}

export function splitSentences(text: string): string[] {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/([.!?])\s+/g, '$1\u0001')
    .split('\u0001')
    .map((s) => normaliseWhitespace(s))
    .filter((s) => s.length >= 45 && s.split(/\s+/).length >= 9 && !/^(page|\d+\s*$)/i.test(s));
}

function keyTerms(sentence: string): string[] {
  const words = sentence.split(/\s+/).map((w) => w.replace(/^[^\w-]+|[^\w-]+$/g, ''));
  const candidates: string[] = [];
  words.forEach((w, idx) => {
    if (!w || w.length < 5) return;
    if (STOPWORDS.has(w.toLowerCase())) return;
    if (/^\d+$/.test(w)) return;
    const lower = w.toLowerCase();
    if (STOPWORDS.has(lower)) return;
    // prefer domain-ish words: not generic verbs
    if (/(?:tion|ment|ance|ence|ing|ity|ness|logy|ics|ics)$/i.test(w)) candidates.push(w);
    else if (/^[A-Z][a-z]{4,}/.test(w) && idx > 0) candidates.push(w);
    else if (/^[A-Z]{2,6}$/.test(w)) candidates.push(w);
    else if (w.length >= 7) candidates.push(w);
  });
  return Array.from(new Set(candidates));
}

function titleCase(s: string) {
  return s.replace(/\b[a-z]/g, (c) => c.toUpperCase());
}

/**
 * Builds cloze-style objective questions from the extracted document text.
 * Each question blanks out a key term and offers the true term plus three
 * distractors drawn from other key terms in the same document.
 */
export function generateQuestions(text: string, count = 5): Array<{ question: string; options: string[]; answer: string }> {
  const sentences = splitSentences(text);
  if (!sentences.length) return [];

  const allTerms = Array.from(new Set(sentences.flatMap((s) => keyTerms(s))));
  if (allTerms.length < 4) return [];

  const questions: Array<{ question: string; options: string[]; answer: string }> = [];
  const usedTerms = new Set<string>();
  const usedSentences = new Set<string>();

  for (const sentence of sentences) {
    if (questions.length >= count) break;
    if (usedSentences.has(sentence)) continue;
    const terms = keyTerms(sentence).filter((t) => !usedTerms.has(t));
    if (!terms.length) continue;

    const target = terms.sort((a, b) => b.length - a.length)[0];
    const distractors = allTerms
      .filter((t) => t.toLowerCase() !== target.toLowerCase() && !usedTerms.has(t))
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    if (distractors.length < 3) continue;

    const blanked = normaliseWhitespace(sentence.replace(new RegExp(`\\b${target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i'), '________'));
    const options = [target, ...distractors];
    // shuffle so the answer is not always index 0
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }

    questions.push({
      question: `According to the training manual, complete the statement: "${blanked}"`,
      options: options.map((o) => titleCase(o)),
      answer: titleCase(target),
    });
    usedTerms.add(target);
    usedSentences.add(sentence);
  }

  return questions;
}
