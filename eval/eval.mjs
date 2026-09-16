// Runs pangu.js's shipping AI-spacing prompts against a hosted model over the OpenAI chat-completions API and scores the answers on the pangu.js corpora.
//
//   node --env-file-if-exists=eval/.env eval/eval.mjs run <provider>:<model> [--experiment hyphen-digit|digit-plus]
//   node eval/eval.mjs compare
//
// Provider keys come from the env vars named in PROVIDERS. Results land in eval/results/<experiment>/<provider>--<model>.json; a rerun overwrites.
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { parseArgs } from 'node:util';

const PANGU_JS = new URL('../../pangu.js/', import.meta.url);
const RESULTS = new URL('./results/', import.meta.url);

const EXPERIMENTS = {
  'hyphen-digit': { prompt: 'browser-extensions/chrome/src/ai-spacing/shapes/hyphen-digit-prompt.ts', export: 'hyphenDigitPrompt' },
  'digit-plus': { prompt: 'browser-extensions/chrome/src/ai-spacing/shapes/digit-plus-prompt.ts', export: 'digitPlusPrompt' },
};

// ${NAME} anywhere in a url or header is read from the environment. Workers AI serves its own OpenAI-compatible path; cf-aig-gateway-id routes the call through the gateway for logging and caching
const PROVIDERS = {
  openrouter: {
    url: 'https://openrouter.ai/api/v1/chat/completions',
    headers: { Authorization: 'Bearer ${OPENROUTER_API_KEY}' },
  },
  'workers-ai': {
    url: 'https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/v1/chat/completions',
    headers: { Authorization: 'Bearer ${CLOUDFLARE_API_TOKEN}', 'cf-aig-gateway-id': '${CLOUDFLARE_AI_GATEWAY}' },
  },
};

const RETRIES = 5;

function env(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`set ${name}`);
  }
  return value;
}

async function loadExperiment(name) {
  const { prompt, export: exportName } = EXPERIMENTS[name];
  const spec = (await import(new URL(prompt, PANGU_JS)))[exportName];
  const corpus = JSON.parse(readFileSync(new URL(`scripts/prompt-experiments/${name}/corpus/development.json`, PANGU_JS), 'utf8'));
  return { spec, cases: corpus.cases.filter((kase) => !kase.review) };
}

// The prompts ask for the option name alone, so anything beyond the bare label is a miss
function parseLabel(raw, labels) {
  const cleaned = raw.trim().replace(/^[^a-z]+|[^a-z]+$/gi, '').toLowerCase();
  return labels.find((label) => label === cleaned) ?? null;
}

async function complete({ url, headers, thinking }, model, messages) {
  // Workers AI turns a reasoning model's thinking off through the chat template, not a top-level field
  const body = JSON.stringify({ model, messages, temperature: 0, ...(thinking ? {} : { chat_template_kwargs: { enable_thinking: false } }) });
  for (let attempt = 0; ; attempt++) {
    const response = await fetch(url, { method: 'POST', headers, body });
    if (response.ok) {
      const data = await response.json();
      return { content: data.choices[0].message.content ?? '', usage: data.usage ?? null };
    }
    const text = await response.text();
    if ((response.status === 429 || response.status >= 500) && attempt < RETRIES) {
      const seconds = Number(response.headers.get('retry-after')) || 2 ** attempt;
      console.error(`${response.status}, retrying in ${seconds}s`);
      await new Promise((resolve) => setTimeout(resolve, seconds * 1000));
      continue;
    }
    throw new Error(`${response.status} ${text.slice(0, 200)}`);
  }
}

async function run(target, experiments, thinking) {
  const [provider, ...rest] = target.split(':');
  const model = rest.join(':');
  if (!PROVIDERS[provider] || !model) {
    throw new Error(`use <provider>:<model> with provider in ${Object.keys(PROVIDERS).join(', ')}`);
  }
  const { url, headers } = PROVIDERS[provider];
  const expand = (text) => text.replace(/\$\{(\w+)\}/g, (_, name) => env(name));
  const endpoint = {
    url: expand(url),
    headers: { 'Content-Type': 'application/json', ...Object.fromEntries(Object.entries(headers).map(([name, value]) => [name, expand(value)])) },
    thinking,
  };
  for (const experiment of experiments) {
    const { spec, cases } = await loadExperiment(experiment);
    const results = [];
    for (const kase of cases) {
      const messages = [
        { role: 'system', content: spec.systemPrompt },
        { role: 'user', content: spec.buildQuestion(kase.input, kase.at) },
      ];
      const started = performance.now();
      let raw = null;
      let usage = null;
      let error = null;
      try {
        ({ content: raw, usage } = await complete(endpoint, model, messages));
      } catch (caught) {
        error = String(caught.message ?? caught);
      }
      const answer = raw === null ? null : parseLabel(raw, spec.candidateLabels);
      results.push({ id: kase.id, expected: kase.expected_label, answer, raw, error, ms: Math.round(performance.now() - started), usage });
      process.stderr.write(answer === kase.expected_label ? '.' : 'x');
    }
    process.stderr.write('\n');

    const passed = results.filter((result) => result.answer === result.expected).length;
    const classes = Object.fromEntries(
      spec.candidateLabels.map((label) => {
        const matching = results.filter((result) => result.expected === label);
        return [label, `${matching.filter((result) => result.answer === label).length}/${matching.length}`];
      }),
    );
    const summary = {
      provider,
      model,
      experiment,
      thinking,
      promptVersion: spec.version,
      timestamp: new Date().toISOString(),
      passed,
      total: results.length,
      errors: results.filter((result) => result.error).length,
      avgMs: Math.round(results.reduce((sum, result) => sum + result.ms, 0) / results.length),
      tokens: ['prompt_tokens', 'completion_tokens'].reduce((totals, field) => ({ ...totals, [field]: results.reduce((sum, result) => sum + (result.usage?.[field] ?? 0), 0) }), {}),
      classes,
      results,
    };
    const directory = new URL(`${experiment}/`, RESULTS);
    mkdirSync(directory, { recursive: true });
    writeFileSync(new URL(`${provider}--${model.replaceAll('/', '_')}${thinking ? '' : '--nothink'}.json`, directory), `${JSON.stringify(summary, null, 2)}\n`);

    console.log(`${target}${thinking ? '' : ' (no thinking)'} ${experiment}: ${passed}/${results.length}; classes ${JSON.stringify(classes)}; errors ${summary.errors}; avg ${summary.avgMs}ms; tokens ${JSON.stringify(summary.tokens)}`);
    console.log(
      'Misses:',
      results
        .filter((result) => result.answer !== result.expected)
        .map((result) => `${result.id}=${result.error ? 'error' : JSON.stringify(result.raw)}`)
        .join(', ') || 'none',
    );
  }
}

function compare() {
  const rows = [];
  for (const experiment of readdirSync(RESULTS)) {
    for (const file of readdirSync(new URL(`${experiment}/`, RESULTS))) {
      const { provider, model, thinking, passed, total, errors, avgMs, tokens } = JSON.parse(readFileSync(new URL(`${experiment}/${file}`, RESULTS), 'utf8'));
      rows.push({ experiment, target: `${provider}:${model}`, think: thinking === false ? 'off' : 'on', passed: `${passed}/${total}`, errors, avgMs, out: tokens?.completion_tokens ?? null });
    }
  }
  rows.sort((left, right) => left.experiment.localeCompare(right.experiment) || Number(right.passed.split('/')[0]) - Number(left.passed.split('/')[0]));
  console.table(rows);
}

const { positionals, values } = parseArgs({ allowPositionals: true, options: { experiment: { type: 'string' }, 'no-thinking': { type: 'boolean' } } });
const [command, target] = positionals;
if (command === 'run' && target) {
  await run(target, values.experiment ? [values.experiment] : Object.keys(EXPERIMENTS), !values['no-thinking']);
} else if (command === 'compare') {
  compare();
} else {
  console.error('usage: eval.mjs run <provider>:<model> [--experiment <name>] [--no-thinking] | eval.mjs compare');
  process.exitCode = 1;
}
