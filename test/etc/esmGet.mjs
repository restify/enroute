export default async function esmGet(req, res) {
  res.header('name', 'esm');
  res.header('method', 'get');
  res.send(200);
};