
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Logo } from '@/components/logo';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { sendPasswordReset } = useAuth();
  const { toast } = useToast();

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await sendPasswordReset(email);
      setIsSubmitted(true);
    } catch (error: any) {
      toast({
        title: "Request Failed",
        description: error.message,
        variant: 'destructive'
      });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/30">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
                <Logo />
            </div>
          <CardTitle className="text-2xl font-bold font-headline">Forgot Password</CardTitle>
          <CardDescription>
            {isSubmitted 
                ? "Check your email for a password reset link."
                : "Enter your email and we'll send you a link to reset your password."
            }
            </CardDescription>
        </CardHeader>
        <CardContent>
            {isSubmitted ? (
                 <div className="text-center">
                    <p className="text-muted-foreground mb-4">
                        If an account with that email exists, a reset link has been sent. It may take a few minutes to arrive.
                    </p>
                    <Button asChild variant="outline">
                        <Link href="/login">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Login
                        </Link>
                    </Button>
                </div>
            ) : (
                <form onSubmit={handleResetRequest} className="space-y-4">
                    <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="m@example.com"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Send Reset Link
                    </Button>
                </form>
            )}
            {!isSubmitted && (
                 <div className="mt-4 text-center text-sm">
                    Remember your password?{' '}
                    <Link href="/login" className="underline">
                    Login
                    </Link>
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
