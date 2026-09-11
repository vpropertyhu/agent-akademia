import { createHmac, createHash, timingSafeEqual } from 'node:crypto';
export function sign(body, secret, purpose, at = String(Date.now())) { const digest = createHash('sha256').update(body).digest('hex'); return { at, signature: createHmac('sha256', secret).update(purpose + '\n' + at + '\n' + digest).digest('hex') }; }
export function verify(body, secret, purpose, at, signature, maxAge = 60000) { if (!secret || secret.length < 32 || !at || !/^\d{13}$/.test(at) || Math.abs(Date.now() - Number(at)) > maxAge || !signature || !/^[0-9a-f]{64}$/.test(signature))
    return false; return timingSafeEqual(Buffer.from(sign(body, secret, purpose, at).signature, 'hex'), Buffer.from(signature, 'hex')); }
