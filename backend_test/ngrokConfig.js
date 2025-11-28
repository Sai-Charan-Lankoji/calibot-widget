import dotenv from 'dotenv';
dotenv.config();

export default {
  enabled: true,  //process.env.NGROK_ENABLED === 'true',
  authToken: process.env.NGROK_AUTHTOKEN || '',
  domain: process.env.NGROK_DOMAIN || '',
};