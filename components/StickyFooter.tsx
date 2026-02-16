
import React, { useState } from 'react';
import { type Language, useLanguage } from '../context/LanguageContext';

const waitlistUiMessages: Record<
  Language,
  { joining: string; success: string; genericError: string; invalidEmail: string }
> = {
  en: {
    joining: 'Joining...',
    success: "You're on the waitlist. We will be in touch soon.",
    genericError: 'Failed to join waitlist. Please try again.',
    invalidEmail: 'Please enter a valid email address.',
  },
  de: {
    joining: 'Wird hinzugefügt...',
    success: 'Du bist auf der Warteliste. Wir melden uns bald bei dir.',
    genericError: 'Beitritt zur Warteliste fehlgeschlagen. Bitte versuche es erneut.',
    invalidEmail: 'Bitte gib eine gültige E-Mail-Adresse ein.',
  },
  pl: {
    joining: 'Dołączanie...',
    success: 'Jesteś na liście oczekujących. Wkrótce się odezwiemy.',
    genericError: 'Nie udało się dołączyć do listy. Spróbuj ponownie.',
    invalidEmail: 'Wpisz poprawny adres e-mail.',
  },
};

const StickyFooter: React.FC = () => {
  const { language, messages } = useLanguage();
  const { stickyFooter } = messages;
  const localizedUi = waitlistUiMessages[language];
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitWaitlist = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setStatus('error');
      setFeedbackMessage(localizedUi.invalidEmail);
      return;
    }

    setIsSubmitting(true);
    setStatus('idle');
    setFeedbackMessage('');

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: normalizedEmail }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          typeof result.message === 'string' && result.message.length > 0
            ? result.message
            : localizedUi.genericError
        );
      }

      setStatus('success');
      setFeedbackMessage(
        typeof result.message === 'string' && result.message.length > 0
          ? result.message
          : localizedUi.success
      );
      setEmail('');
    } catch (error) {
      setStatus('error');
      setFeedbackMessage(error instanceof Error ? error.message : localizedUi.genericError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50 p-3 sm:p-4 md:p-8 pointer-events-none">
      <div className="max-w-5xl mx-auto bg-white/90 luxury-blur rounded-[2rem] shadow-[0_20px_50px_-10px_rgba(0,0,0,0.1)] border border-primary/10 p-4 md:p-6 flex flex-col md:flex-row items-center justify-between gap-4 pointer-events-auto">
        <div className="w-full md:w-auto flex items-center justify-center md:justify-start gap-8 px-2 sm:px-4">
          <div className="hidden lg:block">
            <span className="text-[10px] uppercase tracking-[0.25em] text-primary font-black block mb-1">
              {stickyFooter.membershipLabel}
            </span>
            <span className="text-sm font-bold opacity-80 whitespace-nowrap">{stickyFooter.membershipValue}</span>
          </div>
          
          <div className="h-10 w-px bg-primary/10 hidden lg:block"></div>
          
          <p className="max-w-xl text-sm md:text-base font-medium opacity-70 italic text-center md:text-left leading-tight">
            {stickyFooter.quote}
          </p>
        </div>

        <form
          onSubmit={submitWaitlist}
          className="w-full md:w-auto"
        >
          <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-center md:justify-end">
            <input
              className="w-full max-w-md sm:max-w-none sm:flex-grow md:w-72 bg-background-light border-none rounded-2xl text-sm px-4 sm:px-6 py-3 sm:py-4 focus:ring-2 focus:ring-primary/20 placeholder:opacity-30 placeholder:font-medium font-medium transition-all min-w-0"
              placeholder={stickyFooter.emailPlaceholder}
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={isSubmitting}
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full max-w-md sm:w-auto bg-primary hover:bg-primary/90 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-2xl text-sm font-bold tracking-tight transition-all active:scale-95 shadow-xl shadow-primary/20 whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-80"
            >
              {isSubmitting ? localizedUi.joining : stickyFooter.waitlistButton}
            </button>
          </div>
          <p
            aria-live="polite"
            className={`mt-2 text-center text-xs font-semibold ${
              status === 'success'
                ? 'text-primary'
                : status === 'error'
                  ? 'text-red-500'
                  : 'text-transparent'
            }`}
          >
            {feedbackMessage || '\u00A0'}
          </p>
        </form>
      </div>
    </footer>
  );
};

export default StickyFooter;
