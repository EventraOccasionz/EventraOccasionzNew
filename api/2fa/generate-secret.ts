import { TOTP, NobleCryptoPlugin, ScureBase32Plugin } from 'otplib';
import QRCode from 'qrcode';

const totp = new TOTP({
  crypto: new NobleCryptoPlugin(),
  base32: new ScureBase32Plugin()
});

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  
  const { email } = req.body || {};
  if (!email) {
    return res.status(400).json({ error: 'Missing email in request body.' });
  }

  try {
    const secret = totp.generateSecret();
    const otpauth = totp.toURI({ secret, label: email, issuer: 'Eventra Occasionz' });
    const qrCodeUrl = await QRCode.toDataURL(otpauth);

    const recoveryCodes: string[] = [];
    for (let i = 0; i < 10; i++) {
      recoveryCodes.push(Math.random().toString(36).substring(2, 10).toUpperCase());
    }

    return res.status(200).json({ secret, qrCodeUrl, recoveryCodes });
  } catch (err: any) {
    console.error('[2FA Generate Secret Error]:', err);
    return res.status(500).json({ error: 'Failed to generate 2FA secret.', details: err.message });
  }
}
