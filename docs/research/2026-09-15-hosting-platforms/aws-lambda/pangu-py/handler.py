import pangu


def handler(event, context):
    t = (event.get("queryStringParameters") or {}).get("t", "")
    return {"text": pangu.spacing_text(t), "lib": "pangu-py", "version": pangu.__version__}
