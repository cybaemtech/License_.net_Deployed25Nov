import React, { useState } from 'react';
import { Send, Mail, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface EmailFormProps {
  defaultTo?: string;
  defaultSubject?: string;
  defaultMessage?: string;
}

export function EmailForm({ defaultTo = '', defaultSubject = '', defaultMessage = '' }: EmailFormProps) {
  const [to, setTo] = useState(defaultTo);
  const [subject, setSubject] = useState(defaultSubject);
  const [message, setMessage] = useState(defaultMessage);
  const [ccAdmin, setCcAdmin] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);
    setSending(true);

    try {
      const response = await fetch('/api/send_custom_email.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to,
          subject,
          message,
          reply_to: 'accounts@cybaemtech.com',
          cc_admin: ccAdmin,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult({ success: true, message: 'Email sent successfully!' });
        setTo('');
        setSubject('');
        setMessage('');
        setCcAdmin(false);
      } else {
        setResult({ success: false, message: data.error || 'Failed to send email' });
      }
    } catch (error) {
      console.error('Email sending error:', error);
      setResult({ success: false, message: 'Network error. Please try again.' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="flex items-center gap-2 mb-6">
        <Mail className="w-6 h-6 text-indigo-600" />
        <h2 className="text-2xl font-bold text-gray-900">Send Email</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="to" className="block text-sm font-medium text-gray-700 mb-1">
            To <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            id="to"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            required
            placeholder="recipient@example.com"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
            Subject <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            placeholder="Enter email subject"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
            Message <span className="text-red-500">*</span>
          </label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            rows={8}
            placeholder="Enter your message (HTML supported)"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
          />
          <p className="mt-1 text-xs text-gray-500">
            You can use HTML tags for formatting
          </p>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="ccAdmin"
            checked={ccAdmin}
            onChange={(e) => setCcAdmin(e.target.checked)}
            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
          />
          <label htmlFor="ccAdmin" className="ml-2 text-sm text-gray-700">
            CC admin (accounts@cybaemtech.com)
          </label>
        </div>

        {result && (
          <div
            className={`p-4 rounded-md flex items-center gap-2 ${
              result.success
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {result.success ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600" />
            )}
            <span>{result.message}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={sending}
          className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium transition-colors"
        >
          {sending ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              Send Email
            </>
          )}
        </button>
      </form>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <h3 className="font-medium text-blue-900 mb-2">Email Deliverability Tips:</h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Avoid spam trigger words (FREE, URGENT, ACT NOW)</li>
          <li>Don't use ALL CAPS in subject lines</li>
          <li>Keep the message clear and professional</li>
          <li>The email will be sent from noreply@{'{server-domain}'}</li>
          <li>Replies will go to accounts@cybaemtech.com</li>
        </ul>
      </div>
    </div>
  );
}
