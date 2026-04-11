import { bedrock } from '@ai-sdk/amazon-bedrock';
import { generateText } from 'ai';

export default function Test3Page() {

  async function main() {
    const { text } = await generateText({
      // You can swap this for 'us.amazon.nova-pro-v1:0' 
      // or 'anthropic.claude-3-5-sonnet-20241022-v2:0'
      model: bedrock('us.amazon.nova-lite-v1:0'),
      prompt: 'Tell me a short joke about web development.',
    });
    console.log(text);
    return text;
  }

  const joke = main();

  return (
    <div>
      <h1>Check the console for the joke!</h1>
      <p>{joke}</p>
    </div>
  );
}