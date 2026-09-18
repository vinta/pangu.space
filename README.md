# pangu.space

Opinionated paranoid text spacing: automatically inserts whitespace between CJK (Chinese, Japanese, Korean) and ANS (alphabetical letters, numerical digits and symbols).

- [pangu.js](https://github.com/vinta/pangu.js)
- [pangu.py](https://github.com/vinta/pangu.py)
- [pangu.go](https://github.com/vinta/pangu)
- [pangu.java](https://github.com/vinta/pangu.java)
- [pangu.space](https://github.com/vinta/pangu.space) (Website and HTTP API)

## Website

Try it at [pangu.space](https://pangu.space): paste text on the left, get the spaced text on the right, with every added or removed space highlighted.

## Endpoints

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

### Errors

Errors come with a `code` you can check:

- `missing_text` (400): no `text` in the query string, or no string `text` in the JSON body
- `invalid_json` (400): the POST body is not valid JSON
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
