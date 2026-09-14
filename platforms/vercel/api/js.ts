import pangu from 'pangu';

export default {
  fetch(request: Request) {
    const t = new URL(request.url).searchParams.get('t') ?? '';
    return Response.json({ text: pangu.spaceText(t), lib: 'pangu-js', version: pangu.version });
  },
};
