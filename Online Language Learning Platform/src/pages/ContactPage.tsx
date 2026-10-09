import React, { useState } from 'react';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Alert } from '../components/common/Alert';
import { Mail, MessageSquare, Send, CheckCircle2 } from 'lucide-react';

export const ContactPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulating response & validation
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSent(true);
    }, 600);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-10">
      <div className="text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white">Contact & Feedback</h1>
        <p className="text-sm text-slate-400">
          Have an inquiry, course proposal, or technical feedback for CodeVerse? Reach out to our engineering team.
        </p>
      </div>

      <div className="p-8 rounded-3xl bg-[#101522] border border-slate-800 shadow-2xl">
        {isSent ? (
          <div className="text-center py-8 space-y-4">
            <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white">Message Received!</h3>
            <p className="text-xs text-slate-300 max-w-sm mx-auto">
              Thank you for getting in touch. Our team has received your note and will review it shortly.
            </p>
            <Button variant="outline" size="sm" onClick={() => setIsSent(false)}>
              Send Another Note
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Your Name"
                required
                placeholder="Linus Torvalds"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Input
                label="Email Address"
                type="email"
                required
                placeholder="you@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="w-4 h-4" />}
              />
            </div>

            <Input
              label="Subject"
              required
              placeholder="Feedback on C++ Curriculum / Platform bug"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />

            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Message <span className="text-rose-400">*</span>
              </label>
              <textarea
                rows={5}
                required
                placeholder="Share your thoughts, issue description, or partnership ideas..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full bg-[#121724] border border-slate-800 text-slate-100 text-sm rounded-lg p-3 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full py-2.5"
              isLoading={isSubmitting}
              rightIcon={<Send className="w-4 h-4" />}
            >
              Submit Message
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};
