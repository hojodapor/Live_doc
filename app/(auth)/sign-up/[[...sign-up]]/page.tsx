import { SignIn, SignUp } from "@clerk/nextjs";
import React from "react";

export default function SignUpPage() {
  return (
    <main className="auth-page">
      <SignUp />
    </main>
  );
}
