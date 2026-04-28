'use client';

import { useState } from 'react';

export const dynamic = 'force-dynamic';

export default function Test3Page() {
  const [joke, setJoke] = useState('');
  const [loading, setLoading] = useState(false);

  // async function getJoke() {
  //   setLoading(true);
  //   try {
  //     const res = await fetch('/api/bedrock', {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({
  //         modelId: 'us.amazon.nova-lite-v1:0',
  //         prompt: 'Say hello in one sentence.',
  //       }),
  //     });
  //     const data = await res.json();
  //     if (data.success) {
  //       setJoke(data.output.text);
  //     } else {
  //       setJoke('Error: ' + data.error);
  //     }
  //   } catch (error) {
  //     console.error(error);
  //     setJoke('Error generating response');
  //   }
  //   setLoading(false);
  // }

  return (
    <div>
      <h1>Bedrock Test</h1>
      {/* <button onClick={getJoke} disabled={loading}>
        {loading ? 'Generating...' : 'Test API'}
      </button>
      <p>{joke}</p> */}
    </div>
  );
}