
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function TermsOfServicePage() {
  return (
    <div className="container mx-auto p-4 pt-8 max-w-2xl">
        <div className="mb-4">
            <Link href="/login" className="text-sm text-primary hover:underline">
                &larr; Back to App
            </Link>
        </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-headline">Terms of Service</CardTitle>
           <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
        </CardHeader>
        <CardContent className="prose prose-sm dark:prose-invert max-w-none">
          <p>
            Welcome to DayFlow! These terms and conditions outline the rules and
            regulations for the use of our application. This is a placeholder document.
            You must replace this with a legally compliant Terms of Service agreement.
          </p>

          <h2 className="text-xl font-semibold mt-6">1. Acceptance of Terms</h2>
          <p>
            By accessing and using our application, you accept and agree to be bound
            by the terms and provision of this agreement.
          </p>

          <h2 className="text-xl font-semibold mt-6">2. User Accounts</h2>
          <p>
            When you create an account with us, you must provide us with information
            that is accurate, complete, and current at all times. Failure to do so
            constitutes a breach of the Terms, which may result in immediate
            termination of your account on our Service.
          </p>

          <h2 className="text-xl font-semibold mt-6">3. Content</h2>
          <p>
            Our Service allows you to post, link, store, share and otherwise make
            available certain information, text, graphics, or other material
            ("Content"). You are responsible for the Content that you post on or
            through the Service, including its legality, reliability, and
            appropriateness.
          </p>

          <h2 className="text-xl font-semibold mt-6">4. Use of Service</h2>
          <p>
            You agree not to use the Service for any purpose that is illegal or
            prohibited by these Terms. You agree not to use the Service in any
            manner that could damage, disable, overburden, or impair the Service.
          </p>

          <h2 className="text-xl font-semibold mt-6">5. Termination</h2>
          <p>
            We may terminate or suspend your account immediately, without prior notice
            or liability, for any reason whatsoever, including without limitation if
            you breach the Terms.
          </p>
          
          <h2 className="text-xl font-semibold mt-6">6. Disclaimer</h2>
           <p>
            The Service is provided on an "AS IS" and "AS AVAILABLE" basis. The Service
            is provided without warranties of any kind, whether express or implied.
          </p>

          <h2 className="text-xl font-semibold mt-6">7. Changes to Terms</h2>
          <p>
            We reserve the right, at our sole discretion, to modify or replace
            these Terms at any time. We will provide notice of any changes by
            posting the new Terms of Service on this page.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
