# pangu.space

[![](https://img.shields.io/badge/made%20with-%e2%9d%a4-ff69b4.svg?style=flat-square)](https://vinta.ws/code/)

Paranoid text spacing for good readability, to automatically insert whitespace between CJK (Chinese, Japanese, Korean) and half-width characters (alphabetical letters, numerical digits and symbols).

- [pangu.go](https://github.com/vinta/pangu) (Go)
- [pangu.java](https://github.com/vinta/pangu.java) (Java)
- [pangu.js](https://github.com/vinta/pangu.js) (JavaScript)
- [pangu.py](https://github.com/vinta/pangu.py) (Python)
- [pangu.space](https://github.com/vinta/pangu.space) (Web API)

## Usage

Current APIs:

- `https://api.pangu.space/v1/spacing-text?t=YOUR-TEXT`

in Command-line interface:

```console
$ curl https://api.pangu.space/v1/spacing-text -G --data-urlencode "t=當你凝視著bug，bug也凝視著你" -H "x-api-key: TiEeVInyGza4ta0kougRH4MBBfdGe2Q91TjrbQLm" -w "\n"
當你凝視著 bug，bug 也凝視著你
```

in Python:

```python
import requests

r = requests.get('https://api.pangu.space/v1/spacing-text?t=當你凝視著bug，bug也凝視著你', headers={'x-api-key': 'TiEeVInyGza4ta0kougRH4MBBfdGe2Q91TjrbQLm'})
print(r.content.decode('utf-8'))
# 當你凝視著 bug，bug 也凝視著你
```

You must request the API with a HTTP header `x-api-key: TiEeVInyGza4ta0kougRH4MBBfdGe2Q91TjrbQLm`. Yeah, you are free to use the API key for accessing the service. Although it has a quota of 100000 requests per month.

## Development

[pangu.space](https://api.pangu.space/v1/) is built on AWS Lambda and Amazon API Gateway. I use [Apex](http://apex.run/) to manage and deploy Lambda functions.

```console
# deploy all functions
$ apex deploy

# view logs
$ apex logs -f

# invoke a function directly
$ apex invoke spacing_text --logs
{
    "statusCode": 400,
    "headers": null,
    "body":"{\"message\": \"No text was provided in HTTP query string\"}"
}

# invoke a function with an API Gateway event
$ cat fixtures/spacing_text_event.json
{
    "queryStringParameters": {"t": "與PM戰鬥的人，應當小心自己不要成為PM"}
}
$ apex invoke spacing_text --logs < fixtures/spacing_text_event.json
{
    "statusCode": 200,
    "headers": {"content-type": "text/plain; charset=utf-8"},
    "body": "與 PM 戰鬥的人，應當小心自己不要成為 PM"
}
```

## Related Posts

- [Apex and Terraform: The easiest way to manage AWS Lambda functions](https://vinta.ws/code/apex-and-terraform-the-easiest-way-to-manage-aws-lambda-functions.html)
