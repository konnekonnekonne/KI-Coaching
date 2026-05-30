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
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      {/* Avatar for KICO */}
      {!isUser && (
        <div className="mr-2 mt-1 flex-shrink-0">
          <div className="w-7 h-7 rounded-full bg-[--accent] flex items-center justify-center">
            <span className="text-white text-xs font-bold">K</span>
          </div>
        </div>
      )}

      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
          isUser
            ? 'bg-[--accent] text-white rounded-tr-sm'
            : 'bg-[--surface] text-[--foreground] border border-[--border] rounded-tl-sm'
        )}
      >
        {isStreaming && !message.content ? (
          // Typing indicator
          <div className="flex gap-1 items-center py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[--muted] animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-[--muted] animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-[--muted] animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        ) : (
          <p className="whitespace-pre-wrap">{message.content}</p>
        )}
      </div>
    </div>
  )
}
