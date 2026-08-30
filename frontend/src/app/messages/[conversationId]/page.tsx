'use client';

import React, { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MessagesMainPage from '../page';

export default function SingleConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();

  useEffect(() => {
    if (resolvedParams?.conversationId) {
      router.replace(`/messages?conv=${encodeURIComponent(resolvedParams.conversationId)}`);
    }
  }, [resolvedParams, router]);

  return <MessagesMainPage />;
}
