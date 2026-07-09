import { TOTP, NobleCryptoPlugin, ScureBase32Plugin } from 'otplib';

export const totp = new TOTP({
  crypto: new NobleCryptoPlugin(),
  base32: new ScureBase32Plugin()
});
