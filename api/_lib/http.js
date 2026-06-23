// Kleine HTTP-Helfer für die Serverless-Funktionen.
function json(res, obj, code) {
  res.statusCode = code || 200;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(obj));
}
function readBody(req) {
  return new Promise(function (resolve) {
    let d = '';
    req.on('data', function (c) { d += c; });
    req.on('end', function () { try { resolve(d ? JSON.parse(d) : {}); } catch (e) { resolve({}); } });
    req.on('error', function () { resolve({}); });
  });
}
module.exports = { json, readBody };
