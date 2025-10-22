
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto p-4 pt-8 max-w-2xl">
        <div className="mb-4">
            <Link href="/login" className="text-sm text-primary hover:underline">
                &larr; Back to App
            </Link>
        </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-headline">Privacy Policy</CardTitle>
          <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
        </CardHeader>
        <CardContent className="prose prose-sm dark:prose-invert max-w-none">
          <p>
            Welcome to DayFlow. This is a placeholder privacy policy. It is
            essential that you replace this text with your own privacy policy to
            comply with legal requirements and be transparent with your users about
            how you collect, use, and protect their data.
          </p>

          <h2 className="text-xl font-semibold mt-6">1. Information We Collect</h2>
          <p>
            When you use our application, we may collect the following types of
            information:
          </p>
          <ul>
            <li>
              <strong>Account Information:</strong> When you sign up, we collect
              your email address and name provided by you or through your Google
              account.
            </li>
            <li>
              <strong>User-Generated Content:</strong> We store the activities,
              moods, goals, and notification preferences you create and log within
              the app.
            </li>
             <li>
              <strong>Google Calendar Data:</strong> If you grant permission, our
              app will have the ability to create and delete calendar events on your
              primary Google Calendar for the purpose of setting reminders. We do
              not read or store any other information from your calendar.
            </li>
          </ul>

          <h2 className="text-xl font-semibold mt-6">2. How We Use Your Information</h2>
          <p>
            Your information is used to:
          </p>
          <ul>
            <li>Provide, maintain, and improve the application.</li>
            <li>Personalize your experience.</li>
            <li>Sync reminders with your Google Calendar if you have enabled it.</li>
            <li>Communicate with you about your account or our services.</li>
          </ul>

          <h2 className="text-xl font-semibold mt-6">3. Data Sharing</h2>
          <p>
            We do not sell, trade, or otherwise transfer your personally
            identifiable information to outside parties. This does not include
            trusted third parties who assist us in operating our application,
            conducting our business, or servicing you, so long as those parties
            agree to keep this information confidential.
          </p>
          
           <h2 className="text-xl font-semibold mt-6">4. Data Security</h2>
          <p>
            We implement a variety of security measures to maintain the safety of
            your personal information. Your data is stored in a secure database
            (Firebase) protected by security rules.
          </p>

          <h2 className="text-xl font-semibold mt-6">5. Your Consent</h2>
          <p>
            By using our app, you consent to our privacy policy.
          </p>
          
          <h2 className="text-xl font-semibold mt-6">6. Changes to Our Privacy Policy</h2>
          <p>
            If we decide to change our privacy policy, we will post those changes
            on this page.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
