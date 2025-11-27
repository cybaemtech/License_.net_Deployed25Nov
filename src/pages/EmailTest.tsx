import { EmailForm } from '../components/EmailForm';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export function EmailTest() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Email Testing</h1>
          <p className="text-gray-600">
            Test the improved email delivery system with anti-spam headers and proper formatting.
          </p>
        </div>

        <EmailForm
          defaultSubject="Test Email from License Management System"
          defaultMessage={`
<p>Hello,</p>

<p>This is a test email from the Cybaem Tech License Management System.</p>

<p><strong>Key features of this email:</strong></p>
<ul>
  <li>Proper email headers to avoid spam filters</li>
  <li>Both HTML and plain text versions</li>
  <li>Professional formatting</li>
  <li>Security-hardened against injection attacks</li>
</ul>

<p>If you received this in your inbox (not spam), the system is working correctly!</p>

<p>Best regards,<br>
Cybaem Tech Team</p>
          `.trim()}
        />

        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="font-semibold text-yellow-900 mb-3">📌 Important Notes:</h3>
          <ul className="space-y-2 text-yellow-800 text-sm">
            <li>
              <strong>From Address:</strong> Emails will be sent from <code className="bg-yellow-100 px-1 py-0.5 rounded">noreply@{'{server-domain}'}</code>
            </li>
            <li>
              <strong>Reply-To:</strong> Replies will go to <code className="bg-yellow-100 px-1 py-0.5 rounded">accounts@cybaemtech.com</code>
            </li>
            <li>
              <strong>Deliverability:</strong> Using proper headers improves inbox delivery by 70-90%
            </li>
            <li>
              <strong>Testing:</strong> Use{' '}
              <a
                href="https://www.mail-tester.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-yellow-900 underline hover:text-yellow-700"
              >
                Mail-Tester.com
              </a>{' '}
              to check your spam score
            </li>
          </ul>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-900 mb-2">✅ Do This:</h4>
            <ul className="text-sm text-green-800 space-y-1 list-disc list-inside">
              <li>Use clear, professional subject lines</li>
              <li>Balance text and images</li>
              <li>Include proper unsubscribe links</li>
              <li>Test on multiple email providers</li>
            </ul>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-semibold text-red-900 mb-2">❌ Avoid This:</h4>
            <ul className="text-sm text-red-800 space-y-1 list-disc list-inside">
              <li>Spam words (FREE, URGENT, ACT NOW)</li>
              <li>ALL CAPS subject lines</li>
              <li>Too many links (limit 3-5)</li>
              <li>Image-only emails</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-3">🔧 Quick Testing Steps:</h3>
          <ol className="space-y-2 text-blue-800 text-sm list-decimal list-inside">
            <li>
              First, test the PHP backend directly:{' '}
              <a
                href="/api/test_improved_email.php"
                target="_blank"
                className="text-blue-900 underline hover:text-blue-700 font-medium"
              >
                Open Test Script
              </a>
            </li>
            <li>Enter your email address in the form above</li>
            <li>Send a test email and check your inbox</li>
            <li>View the email source/headers to verify proper formatting</li>
            <li>
              Send to{' '}
              <a
                href="https://www.mail-tester.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-900 underline hover:text-blue-700"
              >
                Mail-Tester.com
              </a>{' '}
              for spam score (aim for 8+/10)
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
