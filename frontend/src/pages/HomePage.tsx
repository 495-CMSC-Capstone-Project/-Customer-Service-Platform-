import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useAuthModal } from "../context/AuthModalContext";

const features = [
  {
    title: "Ask the AI assistant",
    body: "Get clear answers to common questions without waiting in a queue.",
  },
  {
    title: "Talk to a person",
    body: "If the assistant is unsure or the issue is complex, we escalate to a human agent.",
  },
  {
    title: "Keep your history",
    body: "Return to past conversations, see what was resolved, and pick up where you left off.",
  },
] as const;

const steps = [
  {
    number: "1",
    title: "Sign in or sign up",
    body: "Use your customer account so we can look up the right information.",
  },
  {
    number: "2",
    title: "Describe the issue",
    body: "Send a message in your own words. You will see a loading state while we work on a reply.",
  },
  {
    number: "3",
    title: "Get an answer or an agent",
    body: "We show whether the reply came from AI or a person, and we can open a support ticket when needed.",
  },
] as const;

export function HomePage() {
  const { isAuthenticated } = useAuth();
  const { openSignIn, openSignUp } = useAuthModal();
  const location = useLocation();

  useEffect(() => {
    const id = location.hash.replace("#", "");
    if (!id) {
      return;
    }
    document.getElementById(id)?.scrollIntoView();
  }, [location.hash]);

  return (
    <>
      <section className="hero">
        <div className="hero__content">
          <p className="eyebrow">Customer Service Platform</p>
          <h1>Get help from an AI assistant, or a real person when you need one.</h1>
          <p className="hero__lede">
            Ask a question, see a clear answer, and know right away if your issue
            was handled automatically or sent to a human agent.
          </p>
          <div className="hero__actions">
            {isAuthenticated ? (
              <Link to="/conversations" className="button button--primary">
                View conversations
              </Link>
            ) : (
              <>
                <button type="button" className="button button--primary" onClick={openSignIn}>
                  Sign in to get help
                </button>
                <button type="button" className="button button--secondary" onClick={openSignUp}>
                  Sign up
                </button>
              </>
            )}
            <a href="#how-it-works" className="button button--secondary">
              How it works
            </a>
          </div>
        </div>
      </section>

      <section className="section" id="support" aria-labelledby="support-heading">
        <h2 id="support-heading">Support that stays easy to follow</h2>
        <p className="section__intro">
          The customer interface is built around a few straightforward steps: ask
          a question, read the response, and see if a human agent has been
          brought in.
        </p>
        <div className="feature-grid">
          {features.map((feature) => (
            <article key={feature.title} className="feature-card">
              <h3>{feature.title}</h3>
              <p>{feature.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section section--alt" id="how-it-works" aria-labelledby="steps-heading">
        <h2 id="steps-heading">How it works</h2>
        <ol className="steps">
          {steps.map((step) => (
            <li key={step.number} className="step">
              <span className="step__number" aria-hidden="true">
                {step.number}
              </span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="cta-band">
        <h2>Ready to start a conversation?</h2>
        {isAuthenticated ? (
          <>
            <p>Open your conversation history to continue or start a new request.</p>
            <Link to="/conversations" className="button button--primary">
              Go to conversations
            </Link>
          </>
        ) : (
          <>
            <p>Sign in or create a customer account to reach support.</p>
            <div className="cta-band__actions">
              <button type="button" className="button button--primary" onClick={openSignIn}>
                Sign in
              </button>
              <button type="button" className="button button--secondary" onClick={openSignUp}>
                Sign up
              </button>
            </div>
          </>
        )}
      </section>

      <footer className="site-footer">
        <p>Customer Support Platform</p>
      </footer>
    </>
  );
}
