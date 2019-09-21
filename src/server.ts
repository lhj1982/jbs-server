import app from './app';
// import * as https from 'https';
import * as http from 'http';
import * as fs from 'fs';
import config from './config';

// const httpsOptions = {
//   key: fs.readFileSync('./config/key.pem'),
//   cert: fs.readFileSync('./config/cert.pem')
// };

http.createServer(app).listen(config.server.port, () => {
  console.log('Express server listening on port ' + config.server.port);
});

// https.createServer(httpsOptions, app).listen(config.port, () => {
//   console.log('Express server listening on port ' + config.port);
// });
