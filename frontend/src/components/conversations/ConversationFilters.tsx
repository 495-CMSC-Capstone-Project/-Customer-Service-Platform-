import {
  ConversationSort,
  ConversationStatusFilter,
  type ConversationStatusCounts,
} from "../../utils/conversationFilters";

const statusOptions = [
  { value: ConversationStatusFilter.ALL, label: "All" },
  { value: ConversationStatusFilter.ACTIVE, label: "Active" },
  { value: ConversationStatusFilter.ESCALATED, label: "Escalated" },
  { value: ConversationStatusFilter.RESOLVED, label: "Resolved" },
  { value: ConversationStatusFilter.CLOSED, label: "Closed" },
] as const;

interface ConversationFiltersProps {
  query: string;
  status: ConversationStatusFilter;
  sort: ConversationSort;
  counts: ConversationStatusCounts;
  resultCount: number;
  onQueryChange: (query: string) => void;
  onStatusChange: (status: ConversationStatusFilter) => void;
  onSortChange: (sort: ConversationSort) => void;
  onClear: () => void;
}

export function ConversationFilters({
  query,
  status,
  sort,
  counts,
  resultCount,
  onQueryChange,
  onStatusChange,
  onSortChange,
  onClear,
}: ConversationFiltersProps) {
  const hasFilters =
    query.length > 0 ||
    status !== ConversationStatusFilter.ALL ||
    sort !== ConversationSort.NEWEST;

  return (
    <section className="conversation-tools" aria-label="Conversation tools">
      <div className="conversation-tools__row">
        <label className="conversation-search">
          <span className="sr-only">Search conversations</span>
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            width="20"
            height="20"
          >
            <path
              d="m21 21-4.35-4.35m2.35-5.15a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="2"
            />
          </svg>
          <input
            type="search"
            value={query}
            placeholder="Search messages, tickets, or queues"
            onChange={(event) => onQueryChange(event.target.value)}
          />
        </label>

        <label className="conversation-sort">
          <span>Sort by</span>
          <select
            value={sort}
            onChange={(event) =>
              onSortChange(event.target.value as ConversationSort)
            }
          >
            <option value={ConversationSort.NEWEST}>Most recent</option>
            <option value={ConversationSort.OLDEST}>Oldest first</option>
          </select>
        </label>
      </div>

      <div className="conversation-tools__footer">
        <div className="status-filters" role="group" aria-label="Filter by status">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className="status-filter"
              aria-pressed={status === option.value}
              aria-label={`${option.label}, ${counts[option.value]} ${counts[option.value] === 1 ? "conversation" : "conversations"}`}
              onClick={() => onStatusChange(option.value)}
            >
              {option.label}
              <span>{counts[option.value]}</span>
            </button>
          ))}
        </div>

        <div className="conversation-results" aria-live="polite">
          <span>
            {resultCount} {resultCount === 1 ? "conversation" : "conversations"}
          </span>
          {hasFilters ? (
            <button type="button" onClick={onClear}>
              Clear filters
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
