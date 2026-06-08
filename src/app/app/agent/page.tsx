'use client'

import '@/app/globals.css'
import { useEffect, useState } from 'react'
import { DefaultChatTransport, ToolUIPart } from 'ai'
import { useChat } from '@ai-sdk/react'

// import {
//   PromptInput,
//   PromptInputBody,
//   PromptInputTextarea,
// } from '@/shared/components/ai-elements/prompt-input'

// import {
//   Conversation,
//   ConversationContent,
//   ConversationScrollButton,
// } from '@/shared/components/ai-elements/conversation'

// import { Message, MessageContent, MessageResponse } from '@/shared/components/ai-elements/message'

// import { Tool, ToolHeader, ToolContent, ToolInput, ToolOutput } from '@/shared/components/ai-elements/tool'
import { PromptInput,PromptInputBody,PromptInputTextarea } from '@/shared/components/ai-elements/prompt-input'
import { Conversation, ConversationContent, ConversationScrollButton } from '@/shared/components/ai-elements/conversation'
import { Message, MessageContent, MessageResponse } from '@/shared/components/ai-elements/message'
import { Tool, ToolContent, ToolHeader, ToolInput, ToolOutput } from '@/shared/components/ai-elements/tool'
// import { Tool } from '@/shared/components/ai-elements/tool'

function Chat() {
  const [input, setInput] = useState<string>('')

  const { messages, setMessages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat-mastra',
    }),
  })

  useEffect(() => {
    const fetchMessages = async () => {
      const res = await fetch('/api/chat')
      const data = await res.json()
      setMessages([...data])
    }
    fetchMessages()
  }, [setMessages])

  const handleSubmit = async () => {
    if (!input.trim()) return

    sendMessage({ text: input })
    setInput('')
  }

  return (
    <div className="relative size-full h-screen w-full p-6">
        <h1>Agent Page</h1>
          <p>This is the agent page.</p>
      <div className="flex h-full flex-col">
        <Conversation className="h-full">
          <ConversationContent>
            {(messages ?? []).map(message => (
              <div key={message.id}>
                {message.parts?.map((part, i) => {
                  if (part.type === 'text') {
                    return (
                      <Message key={`${message.id}-${i}`} from={message.role}>
                        <MessageContent>
                          <MessageResponse>{part.text}</MessageResponse>
                        </MessageContent>
                      </Message>
                    )
                  }

                  if (part.type?.startsWith('tool-')) {
                    return (
                      <Tool key={`${message.id}-${i}`}>
                        <ToolHeader
                          type={(part as ToolUIPart).type}
                          state={(part as ToolUIPart).state || 'output-available'}
                          className="cursor-pointer"
                        />
                        <ToolContent>
                          <ToolInput input={(part as ToolUIPart).input || {}} />
                          <ToolOutput
                            output={(part as ToolUIPart).output}
                            errorText={(part as ToolUIPart).errorText}
                          />
                        </ToolContent>
                      </Tool>
                    )
                  }

                  return null
                })}
              </div>
            ))}
            <ConversationScrollButton />
          </ConversationContent>
        </Conversation>

        <PromptInput onSubmit={handleSubmit} className="mt-20">
          <PromptInputBody>
            <PromptInputTextarea
              onChange={e => setInput(e.target.value)}
              className="md:leading-10"
              value={input}
              placeholder="Type your message..."
              disabled={status !== 'ready'}
            />
          </PromptInputBody>
        </PromptInput>
      </div>
    </div>
  )
}

export default Chat
