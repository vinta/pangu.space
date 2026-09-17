# pangu.space

Work in progress.

## Usage

```console
$ curl -G https://api.pangu.space/text --data-urlencode "text=當你凝視著bug，bug也凝視著你"
{"text":"當你凝視著 bug，bug 也凝視著你","lib":"pangu-js","version":"10.1.1"}
```

`version` is the [pangu.js](https://github.com/vinta/pangu.js) version that spaced your text. No API key, CORS is open.

Errors come with a `code` you can check:

- `missing_text` (400): no `text` in the query string
- `not_found` (404): any path other than `/text`

```json
{
  "error": {
    "code": "missing_text",
    "message": "missing query parameter: text"
  }
}
```
