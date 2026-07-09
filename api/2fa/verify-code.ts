import { TOTP, NobleCryptoPlugin, ScureBase32Plugin } from 'otplib';

const totp = new TOTP({
  crypto: new NobleCryptoPlugin(),
  base32: new ScureBase32Plugin()
});

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { secret, code } = req.body || {};
  if (!secret || !code) {
    return res.status(400).json({ error: 'Missing secret or code in request body.' });
  }

  try {
    const verifyResult = await totp.verify(code.trim(), { secret, epochTolerance: 1 });
    return res.status(200).json({ valid: verifyResult.valid });
  } catch (err: any) {
    console.error('[2FA Verify Code Error]:', err);
    return res.status(500).json({ error: 'Failed to verify 2FA code.', details: err.message });
  }
}
