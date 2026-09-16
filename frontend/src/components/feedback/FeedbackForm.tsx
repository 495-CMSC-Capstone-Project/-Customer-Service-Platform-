import { useState, type FormEvent } from "react";
import {
  FeedbackCategory,
  ResolutionType,
  type ResolutionType as ResolutionTypeValue,
} from "../../types/support";
import { ErrorMessage } from "../common/ErrorMessage";

interface FeedbackFormProps {
  defaultResolutionType: ResolutionTypeValue;
  onSubmit: (payload: {
    resolutionType: ResolutionTypeValue;
    successful: boolean;
    category: string;
  }) => void;
}

export function FeedbackForm({
  defaultResolutionType,
  onSubmit,
}: FeedbackFormProps) {
  const [resolutionType, setResolutionType] =
    useState<ResolutionTypeValue>(defaultResolutionType);
  const [successful, setSuccessful] = useState("true");
  const [category, setCategory] = useState<string>(FeedbackCategory.GENERAL);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    try {
      onSubmit({
        resolutionType,
        successful: successful === "true",
        category,
      });
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to record feedback.",
      );
    }
  }

  return (
    <form className="feedback-form" onSubmit={handleSubmit}>
      <label htmlFor="resolution-type">How was this resolved?</label>
      <select
        id="resolution-type"
        value={resolutionType}
        onChange={(event) =>
          setResolutionType(event.target.value as ResolutionTypeValue)
        }
      >
        <option value={ResolutionType.AI_RESOLVED}>AI resolved</option>
        <option value={ResolutionType.HUMAN_RESOLVED}>Human resolved</option>
      </select>

      <label htmlFor="feedback-success">Was the issue handled successfully?</label>
      <select
        id="feedback-success"
        value={successful}
        onChange={(event) => setSuccessful(event.target.value)}
      >
        <option value="true">Yes</option>
        <option value="false">No</option>
      </select>

      <label htmlFor="feedback-category">Category</label>
      <select
        id="feedback-category"
        value={category}
        onChange={(event) => setCategory(event.target.value)}
      >
        {Object.values(FeedbackCategory).map((value) => (
          <option key={value} value={value}>
            {value.replaceAll("_", " ").toLowerCase()}
          </option>
        ))}
      </select>

      <ErrorMessage message={error} />
      <button type="submit" className="button button--primary">
        Submit feedback
      </button>
    </form>
  );
}
