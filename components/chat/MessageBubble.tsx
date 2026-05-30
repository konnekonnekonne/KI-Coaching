import { cn } from '@/lib/utils'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

interface MessageBubbleProps {
  message: Message
  isStreaming?: boolean
}

export function MessageBubble({ message, isStreaming }: MessageBubbleProps) {
  const isUser = message.role === 'user'

  return (
    <div className={cn('flex items-end gap-2', isUser ? 'justify-end' : 'justify-start')}>

      {/* KICO-Avatar */}
      {!isUser && (
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary flex items-center justify-center mb-0.5">
          <svg width="14" height="14" viewBox="0 0 40 40" fill="none">
            <line x1="20" y1="36" x2="20" y2="21" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
            <path d="M20 21 Q14 17 9 13" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none"/>
            <path d="M20 21 Q26 15 31 8" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none"/>
            <circle cx="9"  cy="13" r="3.5" fill="white"/>
            <circle cx="31" cy="8"  r="3.5" fill="white"/>
          </svg>
        </div>
      )}

      {/* Bubble */}
      <div
        className={cn(
          'max-w-[78%] px-4 py-3 text-sm leading-relaxed',
          isUser
            ? 'bg-primary text-white rounded-2xl rounded-br-sm'
            : 'bg-surface text-kico-text border border-border rounded-2xl rounded-bl-sm'
        )}
      >
        {isStreaming && !message.content ? (
          <div className="flex gap-1 items-center py-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-muted animate-bounce [animation-delay:0ms]" />
            <span className="w-1.5 h-1.5 rounded-full bg-muted animate-bounce [animation-delay:150ms]" />
            <span className="w-1.5 h-1.5 rounded-full bg-muted animate-bounce [animation-delay:300ms]" />
          </div>
        ) : (
          <p className="whitespace-pre-wrap">{message.content}</p>
        )}
      </div>
    </div>
  )
}
