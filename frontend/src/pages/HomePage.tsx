import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/auth";
import { useAuthModal } from "../context/authModal";

const features = [
  {
    title: "Ask the AI assistant",
    body: "Get clear answers to common questions without waiting in a queue.",
  },
  {
    title: "Know when to get more help",
    body: "The assistant can recommend human review. Agent routing is not connected in this demo.",
  },
  {
    title: "Keep your history",
    body: "Revisit messages saved in this browser and browse read-only example conversations.",
  },
] as const;

const steps = [
  {
    number: "1",
    title: "Open the demo profile",
    body: "Sign in with cust_001 for live AI support. Other profiles are saved locally and have no server conversation yet.",
  },
  {
    number: "2",
    title: "Describe the issue",
    body: "Send a message in your own words. You will see a loading state while we work on a reply.",
  },
  {
    number: "3",
    title: "Review the reply",
    body: "Read the answer, continue the conversation, and record whether it helped. A human-review recommendation is not a confirmed support ticket.",
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
          <h1>Work through your support issue with an AI assistant.</h1>
          <p className="hero__lede">
            Try the live support demo, review the response, and see when your
            issue may need help from a person.
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
          a question, read the response, and decide whether you need more help.
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
            <p>Return to the live demo or browse your local conversation history.</p>
            <Link to="/conversations" className="button button--primary">
              Go to conversations
            </Link>
          </>
        ) : (
          <>
            <p>Sign in as cust_001 to try the live AI demo.</p>
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
