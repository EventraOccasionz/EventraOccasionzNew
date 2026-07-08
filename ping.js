import http from 'http';

http.get('http://0.0.0.0:3000', (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => console.log(data.slice(0, 500)));
}).on('error', (e) => {
  console.error(`ERROR: ${e.message}`);
});
