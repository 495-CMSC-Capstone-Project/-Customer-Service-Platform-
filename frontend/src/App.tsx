import { FormEvent, useState } from "react";

type ChatResponse = {
  conversationId: string;
  messageId: string;
  response: string;
  source: string;
  confidence: number;
  escalated: boolean;
};

function App() {
  const [message, setMessage] = useState("");
  const [response, setResponse] = useState<ChatResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const conversationId = "conv_001";
  const customerId = "cust_001";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedMessage = message.trim();

    if (!trimmedMessage) {
      setError("Please enter a message.");
      return;
    }

    if (trimmedMessage.length > 2000) {
      setError("Message must be 2,000 characters or fewer.");
      return;
    }

    setLoading(true);
    setError("");
    setResponse(null);

    try {
      const apiResponse = await fetch(
        `http://localhost:8000/api/v1/conversations/${conversationId}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            customerId,
            message: trimmedMessage,
          }),
        }
      );

      if (!apiResponse.ok) {
        if (apiResponse.status === 403) {
          throw new Error(
            "You do not have access to this conversation."
          );
        }

        if (apiResponse.status === 404) {
          throw new Error("Conversation not found.");
        }

        if (apiResponse.status === 400) {
          throw new Error("The message could not be processed.");
        }

        throw new Error("The service is temporarily unavailable.");
      }

      const data: ChatResponse = await apiResponse.json();

      setResponse(data);
      setMessage("");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <h1>Customer Support Platform</h1>

      <form onSubmit={handleSubmit}>
        <label htmlFor="message">
          How can we help?
        </label>

        <textarea
          id="message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          maxLength={2000}
          rows={6}
          placeholder="Enter your support question..."
          disabled={loading}
        />

        <p>{message.length}/2000 characters</p>

        <button type="submit" disabled={loading}>
          {loading ? "Sending..." : "Send"}
        </button>
      </form>

      {error && (
        <p role="alert">
          {error}
        </p>
      )}

      {response && (
        <section>
          <h2>Response</h2>

          <p>{response.response}</p>

          <p>
            Source: {response.source}
          </p>

          <p>
            Confidence: {Math.round(response.confidence * 100)}%
          </p>

          {response.escalated && (
            <p>
              This conversation has been escalated to a human agent.
            </p>
          )}
        </section>
      )}
    </main>
  );
}

export default App;
