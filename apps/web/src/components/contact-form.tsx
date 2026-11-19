'use client';

import { FormEvent, useEffect, useState } from 'react';

export function ContactForm() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [ready, setReady] = useState(false);

  useEffect(() => setReady(true), []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('sending');
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(data.entries())),
      });
      if (!response.ok) throw new Error('Contact request failed');
      form.reset();
      setStatus('success');
    } catch {
      setStatus('error');
    }
  }

  return <form className="contact-form" onSubmit={onSubmit}>
    <div className="form-row">
      <label>Nombre<input name="name" autoComplete="name" minLength={2} maxLength={120} required /></label>
      <label>Correo electrónico<input name="email" type="email" autoComplete="email" maxLength={320} required /></label>
    </div>
    <label>Mensaje<textarea name="message" rows={5} minLength={10} maxLength={3000} required /></label>
    <div className="honeypot" aria-hidden="true"><label>Sitio web<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
    <button className="button button-primary" type="submit" disabled={!ready || status === 'sending'}>{status === 'sending' ? 'Enviando…' : 'Enviar mensaje ↗'}</button>
    <p className="form-status" role="status" aria-live="polite">
      {status === 'success' && 'Gracias. Tu mensaje quedó guardado y lo revisaré pronto.'}
      {status === 'error' && <>No se pudo enviar. Puedes escribirme a <a href="mailto:maximilianoturdera@gmail.com">maximilianoturdera@gmail.com</a>.</>}
    </p>
  </form>;
}
