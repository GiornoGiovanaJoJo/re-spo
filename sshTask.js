const { Client } = require('ssh2');

const conf = `
server {
    listen 80;
    server_name _;
    client_max_body_size 100M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
`;

const conn = new Client();
conn.on('ready', () => {
  const command = `cat << 'EOF' > /etc/nginx/conf.d/default.conf\n${conf}\nEOF\nsystemctl restart nginx`;
  conn.exec(command, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      conn.end();
    }).on('data', (data) => console.log('STDOUT: ' + data))
      .stderr.on('data', (data) => console.log('STDERR: ' + data));
  });
}).on('error', (err) => console.error('Connection error:', err))
  .connect({
    host: '60f67cfaba8e.vps.myjino.ru',
    port: 49340,
    username: 'root',
    password: 'Nikitoso02'
  });
