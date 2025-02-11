"use client";

import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <SignUp routing="path" path="/sign-up" />
    </div>
  );
}
