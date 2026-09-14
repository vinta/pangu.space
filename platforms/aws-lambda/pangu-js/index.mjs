import pangu from 'pangu';

// Default origin, so it also receives unknown lib values that the router let through
export const handler = async (event) => {
  const { t = '', lib = 'pangu-js' } = event.queryStringParameters ?? {};
  if (lib !== 'pangu-js') {
    return { statusCode: 400, body: JSON.stringify({ error: `unknown lib: ${lib}` }) };
  }
  return { text: pangu.spaceText(t), lib, version: pangu.version };
};
