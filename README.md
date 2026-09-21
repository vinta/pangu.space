# pangu.space

Opinionated paranoid text spacing: automatically inserts whitespace between CJK (Chinese, Japanese, Korean) and ANS (alphabetical letters, numerical digits and symbols).

- [pangu.js](https://github.com/vinta/pangu.js)
- [pangu.py](https://github.com/vinta/pangu.py)
- [pangu.go](https://github.com/vinta/pangu)
- [pangu.java](https://github.com/vinta/pangu.java)
- [pangu.space](https://github.com/vinta/pangu.space) (Website and HTTP API)

## Website

Try it at [pangu.space](https://pangu.space): paste text on the left, get the spaced text on the right, with every added or removed space highlighted.

## HTTP API

- `https://api.pangu.space/text`

### GET

```bash
$ curl --get https://api.pangu.space/text --data-urlencode "text=當你凝視著bug，bug也凝視著你"
{"text":"當你凝視著 bug，bug 也凝視著你","lib":"pangu-js","version":"10.1.1"}
```

### POST

Use this for long text.

```bash
$ curl https://api.pangu.space/text --header "Content-Type: application/json" --data '{"text": "與PM戰鬥的人，應當小心自己不要成為PM"}'
{"text":"與 PM 戰鬥的人，應當小心自己不要成為 PM","lib":"pangu-js","version":"10.1.1"}
```

### AI Spacing

Regex rules can't tell a minus sign from a separator, so add `feature=ai-spacing` to the query string and an LLM decides. Works with both GET and POST.

```bash
$ curl --get "https://api.pangu.space/text?feature=ai-spacing" --data-urlencode "text=女朋友今天的氣溫是-273.15度"
{
  "text": "女朋友今天的氣溫是 -273.15 度",
  "lib": "pangu-js",
  "version": "10.1.1",
  "model": "@cf/google/gemma-4-26b-a4b-it",
  "promptVersions": { "hyphen-digit": "v29-zh", "digit-plus": "v18-en-real-examples" },
  "candidates": [{ "kind": "hyphen-digit", "sentence": "女朋友今天的氣溫是-273.15度", "at": 9, "label": "signed-number" }]
}
```

- `candidates`: every symbol the model was asked about. `at` is the symbol's index in `sentence`
- `label`: the model's answer. `null` means the model failed, and that symbol keeps the regex spacing

### Errors

Errors come with a `code` you can check:

- `missing_text` (400): no `text` in the query string, or no string `text` in the JSON body
- `invalid_json` (400): the POST body is not valid JSON
- `unknown_feature` (400): any `feature` other than `ai-spacing`
- `too_many_candidates` (413): the text has more than 20 ambiguous spots. Split it into smaller requests
- `ai_quota_exceeded` (429): the daily AI quota is used up. It resets at 00:00 UTC, and `Retry-After` tells you how many seconds are left
- `method_not_allowed` (405): any method other than GET, POST, and OPTIONS
- `not_found` (404): any path other than `/text`

```json
{
  "error": {
    "code": "missing_text",
    "message": "missing query parameter: text"
  }
}
```

## Development

```bash
$ npm install
$ npm run dev -w web # the website, http://localhost:5566
$ npm run dev -w api # the API, http://localhost:8787
$ npm test -w api
```

The website has no bundler. `web/scripts/vendor.mjs` copies pangu.js into `web/public/vendor/`, and both `dev` and `deploy` run it first.

```bash
$ npm run deploy -w web
$ npm run deploy -w api
```

Design tokens live in `web/public/tokens.css`. The design boards and their generators live in `design/`.
