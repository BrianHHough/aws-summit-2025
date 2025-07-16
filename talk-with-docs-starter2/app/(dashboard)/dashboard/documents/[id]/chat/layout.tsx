import { ReactNode } from 'react';

export default function DocumentChatLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col h-full">
      {children}
    </div>
  );
}